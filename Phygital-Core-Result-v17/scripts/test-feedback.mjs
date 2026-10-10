// Run with: node --experimental-vm-modules scripts/test-feedback.mjs
// Tests the actual TypeScript adapter. IndexedDB is emulated here only to inject
// failures deterministically; the real browser persistence is checked separately.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { webcrypto } from "node:crypto";

const records = new Map();
let failOpen = false,
  failCommit = false,
  committed = 0,
  tail = Promise.resolve();
const events = new EventTarget();
class RecordEvent extends Event {
  constructor(type, options) {
    super(type);
    this.detail = options?.detail;
  }
}
const indexedDB = {
  open() {
    const request = {};
    queueMicrotask(() => {
      if (failOpen) {
        request.onerror?.();
        return;
      }
      request.result = {
        close() {},
        transaction() {
          const transaction = {},
            requests = [],
            staged = new Map();
          let aborted = false;
          transaction.abort = () => {
            aborted = true;
          };
          transaction.objectStore = () => ({
            get(key) {
              const read = {};
              requests.push({ read, key });
              return read;
            },
            put(value, key) {
              staged.set(key, structuredClone(value));
            },
          });
          const run = async () => {
            for (const { read, key } of requests) {
              read.result = structuredClone(records.get(key));
              read.onsuccess?.();
            }
            await Promise.resolve();
            if (aborted || failCommit) {
              transaction.onabort?.();
              return;
            }
            for (const [key, value] of staged) records.set(key, value);
            if (staged.size) committed++;
            transaction.oncomplete?.();
          };
          tail = tail.then(run);
          return transaction;
        },
      };
      request.onsuccess?.();
    });
    return request;
  },
};
const context = vm.createContext({
  indexedDB,
  window: events,
  CustomEvent: RecordEvent,
  crypto: webcrypto,
  Date,
  Error,
  Promise,
  console,
});
const modules = new Map();
const overrides = new Map();
async function load(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const source = await readFile(filename, "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const sourceModule = new vm.SourceTextModule(code, { context, identifier: filename });
  modules.set(filename, sourceModule);
  await sourceModule.link(async (specifier, parent) => {
    if (overrides.has(specifier)) return overrides.get(specifier);
    let target = specifier.startsWith("@/")
      ? path.resolve("src", specifier.slice(2))
      : path.resolve(path.dirname(parent.identifier), specifier);
    let resolved;
    for (const candidate of [
      target,
      `${target}.ts`,
      `${target}.tsx`,
      path.join(target, "index.ts"),
    ]) {
      try {
        await readFile(candidate);
        resolved = candidate;
        break;
      } catch {
        /* Try the next TS resolution candidate. */
      }
    }
    if (!resolved) throw new Error(`Cannot resolve ${specifier} from ${parent.identifier}`);
    target = resolved;
    return load(target);
  });
  return sourceModule;
}
const serviceModule = await load(path.resolve("src/entities/feedback/service.ts"));
await serviceModule.evaluate();
const { feedbackService: service } = serviceModule.namespace;
const admin = { role: "ADMIN", firstName: "QA", lastName: "Admin" },
  player = { role: "USER" };
const draft = {
  name: "  QA User  ",
  email: "QA@EXAMPLE.TEST ",
  topic: "Технические вопросы",
  message: "Первая строка\nВторая строка",
};
const key = "admin-state-v4";
records.set(key, { teams: [{ id: "keep-team" }], users: [{ id: "keep-user" }], logs: [] });
let assertions = 0;
const check = (actual, expected) => {
  assert.deepEqual(actual, expected);
  assertions++;
};
const rejects = async (action, pattern) => {
  await assert.rejects(action, pattern);
  assertions++;
};

for (const patch of [
  { name: " " },
  { email: "wrong" },
  { topic: "Несуществующая тема" },
  { message: " " },
  { message: "a".repeat(501) },
])
  await rejects(() => service.createFeedback({ ...draft, ...patch }), /Имя|email|тему|Сообщение/);
check(committed, 0);
const first = await service.createFeedback(draft);
check(first.name, "QA User");
check(first.email, "qa@example.test");
check(first.status, "new");
check(first.message, draft.message);
check(Boolean(first.createdAt && first.id), true);
check(committed, 1);
check(records.get(key).teams, [{ id: "keep-team" }]);
check(records.get(key).users, [{ id: "keep-user" }]);
await Promise.all(
  Array.from({ length: 12 }, (_, index) =>
    service.createFeedback({ ...draft, name: `QA ${index}` }),
  ),
);
check((await service.getFeedbackList(admin)).length, 13);
await rejects(() => service.getFeedbackList(null), /администратор/);
await rejects(() => service.getFeedbackById(first.id, player), /администратор/);
await rejects(() => service.updateFeedbackStatus(first.id, "closed", player), /администратор/);
await rejects(() => service.markViewed(first.id, player), /администратор/);
await rejects(() => service.updateFeedbackStatus(first.id, "bad", admin), /статус/);
await rejects(() => service.getFeedbackById("missing", admin), /не найдено/);
await rejects(() => service.updateFeedbackStatus("missing", "closed", admin), /не найдено/);
await service.markViewed(first.id, admin);
const viewed = (await service.getFeedbackById(first.id, admin)).viewedAt;
await service.markViewed(first.id, admin);
check((await service.getFeedbackById(first.id, admin)).viewedAt, viewed);
await service.updateFeedbackStatus(first.id, "in_progress", admin);
await service.updateFeedbackStatus(first.id, "closed", admin);
check((await service.getFeedbackById(first.id, admin)).status, "closed");
check(records.get(key).logs.length, 2);
await service.updateFeedbackStatus(first.id, "closed", admin);
check(records.get(key).logs.length, 2);
const before = structuredClone(records.get(key));
failCommit = true;
await rejects(() => service.createFeedback(draft), /сохранить/);
check(records.get(key), before);
await rejects(() => service.updateFeedbackStatus(first.id, "new", admin), /сохранить/);
check(records.get(key), before);
failCommit = false;
failOpen = true;
await rejects(() => service.createFeedback(draft), /открыть/);
await rejects(() => service.getFeedbackList(admin), /открыть/);
failOpen = false;
check((await service.getFeedbackList(admin)).length, 13);
console.log(
  `PASS: ${assertions} feedback assertions (validation, access, atomicity, concurrency, persistence failures).`,
);

// Exercise the actual AdminStore actions with a minimal React hook host. No UI,
// password changes, emails or user-owned browser records are touched by these tests.
const feedbackAssertions = assertions;
function stub(name, exports) {
  overrides.set(
    name,
    new vm.SyntheticModule(
      Object.keys(exports),
      function () {
        for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
      },
      { context },
    ),
  );
}
const players = [
  {
    id: "captain",
    firstName: "QA",
    lastName: "Captain",
    role: "USER",
    email: "captain@example.test",
  },
  { id: "player", firstName: "QA", lastName: "Player", role: "USER", email: "player@example.test" },
  {
    id: "decliner",
    firstName: "QA",
    lastName: "Decliner",
    role: "USER",
    email: "decliner@example.test",
  },
  { id: "admin", firstName: "QA", lastName: "Admin", role: "ADMIN", email: "admin@example.test" },
];
let actor = players[0],
  hookIndex = 0,
  authWrites = 0;
const hookState = [];
stub("react", {
  createContext: () => ({ Provider: "Provider" }),
  useContext: () => null,
  useEffect: () => {},
  useMemo: (calculate) => calculate(),
  useState: (initial) => {
    const index = hookIndex++;
    if (!(index in hookState))
      hookState[index] = typeof initial === "function" ? initial() : initial;
    return [
      hookState[index],
      (value) => {
        hookState[index] = typeof value === "function" ? value(hookState[index]) : value;
      },
    ];
  },
});
stub("react/jsx-runtime", {
  jsx: (type, props) => ({ type, props }),
  jsxs: (type, props) => ({ type, props }),
});
stub("@/entities/user/@x/platform", { users: players });
stub("@/entities/team/@x/platform", { teams: [] });
stub("@/entities/tournament/@x/platform", { tournaments: [] });
stub("@/entities/tournament-application/@x/platform", { tournamentApplications: [] });
stub("@/entities/admin-log/@x/platform", { logs: [] });
const accountService = {
  adminCreateAccount: async () => {
    authWrites++;
  },
  adminUpdateAccount: async () => {
    authWrites++;
  },
  adminDeleteAccount: async () => {
    authWrites++;
  },
  adminResetPassword: async () => {
    authWrites++;
  },
};
records.clear();
const storeModule = await load(path.resolve("src/entities/platform/model/PlatformProvider.tsx"));
await storeModule.evaluate();
const actions = () => {
  hookIndex = 0;
  return storeModule.namespace.PlatformProvider({ children: null, actor, accountService }).props
    .value;
};
await rejects(() => actions().createUser({ password: "Testing123!" }), /Недостаточно прав/);
await rejects(() => actions().resetPassword("player"), /Недостаточно прав/);
check(authWrites, 0);
const team = await actions().createCaptainTeam("QA Integration Team");
check(actions().state.teams[0].members.length, 1);
await actions().sendInvitation(team.id, "player");
await rejects(() => actions().sendInvitation(team.id, "player"), /уже отправлено/);
await rejects(() => actions().sendInvitation(team.id, "admin"), /Администратора/);
const invitation = actions().state.invitations[0];
actor = players[2];
await rejects(() => actions().respondInvitation(invitation.id, "accepted"), /прав/);
actor = players[1];
await actions().respondInvitation(invitation.id, "accepted");
check(actions().state.teams[0].members.length, 2);
check(actions().state.invitations[0].status, "accepted");
await rejects(() => actions().respondInvitation(invitation.id, "accepted"), /обработано/);
check(
  actions().state.notifications.some(
    (item) => item.userId === "captain" && item.type === "invitation_result",
  ),
  true,
);
actor = players[0];
await actions().sendInvitation(team.id, "decliner");
const declinedId = actions().state.invitations[0].id;
actor = players[2];
await actions().respondInvitation(declinedId, "declined");
check(actions().state.teams[0].members.length, 2);
check(actions().state.invitations[0].status, "declined");
actor = players[0];
await actions().sendInvitation(team.id, "decliner");
await actions().cancelInvitation(actions().state.invitations[0].id);
check(actions().state.invitations[0].status, "cancelled");
await rejects(() => actions().removeTeamMember(team.id, "captain"), /другого капитана/);
await rejects(() => actions().assignCaptain(team.id, "decliner"), /участником/);
await actions().assignCaptain(team.id, "player");
check(
  actions()
    .state.teams[0].members.filter((item) => item.captain)
    .map((item) => item.id),
  ["player"],
);
await rejects(() => actions().removeTeamMember(team.id, "player"), /другого капитана/);
actor = players[1];
await actions().removeTeamMember(team.id, "captain");
check(actions().state.teams[0].members.length, 1);
actor = players[3];
await rejects(
  () => actions().createTeam({ name: "Invalid", playerIds: ["admin"], captainId: "admin" }),
  /себя/,
);
await rejects(
  () =>
    actions().createTeam({
      name: "Invalid",
      playerIds: ["captain", "captain"],
      captainId: "captain",
    }),
  /несколько слотов/,
);
await rejects(
  () => actions().createTeam({ name: "Invalid", playerIds: ["captain"], captainId: "player" }),
  /игровой слот/,
);
await actions().createTeam({
  name: "QA Slots",
  playerIds: ["captain", "decliner"],
  captainId: "captain",
});
const slots = actions().state.teams.find((item) => item.name === "QA Slots");
check(slots.members.length, 2);
await rejects(() => actions().updateTeam(slots.id, { name: " " }), /название/);
await rejects(() => actions().updateTeam(slots.id, { name: team.name }), /уже существует/);
await actions().updateTeam(slots.id, { name: "QA Renamed" });
check(actions().state.teams.find((item) => item.id === slots.id).name, "QA Renamed");
await actions().addTeamMember(slots.id, "player");
await rejects(() => actions().addTeamMember(slots.id, "player"), /уже состоит/);
await actions().removeTeamMember(slots.id, "player");
check(actions().state.teams.find((item) => item.id === slots.id).members.length, 2);
const tournamentDraft = {
  name: "QA Tournament",
  shortDescription: "Test",
  fullDescription: "Long description",
  city: "QA City",
  startAt: "2027-01-01T12:00",
  endAt: "2027-01-02T12:00",
  imageName: "test.png",
  imageUrl: "data:image/png;base64,test",
};
await rejects(
  () => actions().createTournament({ ...tournamentDraft, endAt: "2026-01-01T12:00" }),
  /позднее/,
);
await actions().createTournament(tournamentDraft);
const tournament = actions().state.tournaments[0];
check(tournament.description, "Long description");
check(tournament.imageUrl, tournamentDraft.imageUrl);
await rejects(
  () => actions().updateTournament(tournament.id, { shortDescription: "x".repeat(501) }),
  /500/,
);
await rejects(
  () => actions().updateTournament(tournament.id, { endAt: "invalid" }),
  /корректные даты/,
);
actor = players[2];
await rejects(() => actions().submitTournamentApplication(slots.id, tournament.id, ""), /капитан/);
actor = players[0];
await actions().submitTournamentApplication(slots.id, tournament.id, "Test application");
check(actions().state.tournamentApplications.length, 1);
await rejects(
  () => actions().submitTournamentApplication(slots.id, tournament.id, ""),
  /уже отправлена/,
);
actor = players[3];
await actions().updateTournamentApplication(
  actions().state.tournamentApplications[0].id,
  "APPROVED",
);
check(actions().state.tournamentApplications[0].status, "APPROVED");
await actions().deleteTournament(tournament.id);
check(actions().state.tournaments.length, 0);
check(actions().state.tournamentApplications.length, 0);
await actions().deleteTeam(slots.id);
check(
  actions().state.teams.some((item) => item.id === slots.id),
  false,
);
check(records.get(key).teams.length, 1);
check(
  actions().state.logs.some((item) => item.action === "Удаление" && item.entityType === "Турнир"),
  true,
);
// v15: captain editing and leaving use the same atomic store as all screens.
actor = players[0];
const managed = await actions().createCaptainTeam("QA Shared Management");
await actions().updateTeam(managed.id, { name: "QA Captain Rename" });
check(actions().state.teams.find((item) => item.id === managed.id).name, "QA Captain Rename");
await rejects(() => actions().updateTeam(managed.id, { name: "x".repeat(81) }), /80/);
await rejects(() => actions().leaveTeam(managed.id), /права капитана/);
await actions().sendInvitation(managed.id, "decliner");
const leavingInvite = actions().state.invitations[0].id;
actor = players[2];
await actions().respondInvitation(leavingInvite, "accepted");
await rejects(() => actions().updateTeam(managed.id, { name: "Forbidden" }), /только капитан/);
await rejects(() => actions().deleteTeam(managed.id), /только капитан/);
await rejects(() => actions().assignCaptain(managed.id, "decliner"), /только капитан/);
await rejects(() => actions().removeTeamMember(managed.id, "captain"), /другого капитана/);
const leaveSnapshot = structuredClone(records.get(key));
failCommit = true;
await rejects(() => actions().leaveTeam(managed.id), /сохранить/);
check(records.get(key), leaveSnapshot);
failCommit = false;
await actions().leaveTeam(managed.id);
check(
  actions()
    .state.teams.find((item) => item.id === managed.id)
    .members.map((item) => item.id),
  ["captain"],
);
check(
  records
    .get(key)
    .teams.find((item) => item.id === managed.id)
    .members.map((item) => item.id),
  ["captain"],
);
check(
  actions().state.logs.some((item) => item.entityId === managed.id && item.action === "Выход"),
  true,
);
await rejects(() => actions().leaveTeam(managed.id), /не состоите/);
actor = players[1];
await rejects(() => actions().leaveTeam(managed.id), /не состоите/);
actor = players[0];
await actions().sendInvitation(managed.id, "decliner");
const rejoinInvite = actions().state.invitations[0].id;
actor = players[2];
await actions().respondInvitation(rejoinInvite, "accepted");
actor = players[0];
await actions().assignCaptain(managed.id, "decliner");
await actions().leaveTeam(managed.id);
check(
  actions()
    .state.teams.find((item) => item.id === managed.id)
    .members.map((item) => [item.id, item.captain]),
  [["decliner", true]],
);
actor = players[2];
await rejects(() => actions().leaveTeam(managed.id), /права капитана/);
console.log(
  `PASS: ${assertions - feedbackAssertions} platform assertions (teams, invitations, roster, captain, applications, CRUD, logs).`,
);
const platformAssertions = assertions;
// Reload/migration preserves real teams and invitations, not the removed workflow.
const platformModule = await load(path.resolve("src/entities/platform/api/platformService.ts"));
await platformModule.evaluate();
const { platformService } = platformModule.namespace;
records.set(key, { ...records.get(key), teamApplications: [{ id: "obsolete" }] });
const restored = await platformService.getState(actions().state);
check("teamApplications" in restored, false);
check(JSON.stringify(restored.teams), JSON.stringify(actions().state.teams));
check(JSON.stringify(restored.invitations), JSON.stringify(actions().state.invitations));
await platformService.updateState((value) => value, restored);
check("teamApplications" in records.get(key), false);
check(
  JSON.stringify(restored.tournamentApplications),
  JSON.stringify(actions().state.tournamentApplications),
);

const statisticsModule = await load(path.resolve("src/entities/platform/lib/statistics.ts"));
await statisticsModule.evaluate();
const { getStatisticsRange, getStatisticsMetrics, getStatisticsChart } = statisticsModule.namespace;
const fixedNow = new Date(2026, 9, 11, 12, 0);
const stamp = (day, month = 9) => new Date(2026, month, day, 12).toISOString();
const statsState = {
  ...restored,
  users: [
    { createdAt: stamp(11) },
    { createdAt: stamp(5) },
    { createdAt: stamp(1) },
    { createdAt: stamp(1, 0) },
  ],
  teams: [],
  tournaments: [],
  tournamentApplications: [],
  invitations: [],
  feedback: [],
  logs: [],
};
for (const [period, expected] of [
  ["today", 1],
  ["7d", 2],
  ["30d", 3],
  ["month", 3],
  ["year", 4],
]) {
  const range = getStatisticsRange(period, "", "", fixedNow);
  check(getStatisticsMetrics(statsState, range).users, expected);
  check(
    getStatisticsChart(statsState, range).reduce((sum, bin) => sum + bin.users, 0),
    expected,
  );
}
check(
  getStatisticsMetrics(
    statsState,
    getStatisticsRange("custom", "2026-10-01", "2026-10-05", fixedNow),
  ).users,
  2,
);
check(
  getStatisticsMetrics(
    statsState,
    getStatisticsRange("custom", "2024-01-01", "2024-01-31", fixedNow),
  ).users,
  0,
);
check(getStatisticsChart(statsState, getStatisticsRange("7d", "", "", fixedNow)).length, 7);
const searchModule = await load(path.resolve("src/entities/user/lib/search.ts"));
await searchModule.evaluate();
const { matchesPlayerSearch, maskPhone } = searchModule.namespace;
const searchable = { firstName: "Иван", lastName: "Петров", phone: "+7 912 345-67-89" };
for (const query of ["иван", "ИВАН", "Петров", "Иван Петров", "+7 912", "34567"])
  check(matchesPlayerSearch(searchable, query), true);
check(matchesPlayerSearch(searchable, "Мария"), false);
check(matchesPlayerSearch(searchable, ""), false);
check(maskPhone(searchable.phone), "+7 912 *** ** 89");
console.log(
  `PASS: ${assertions - platformAssertions} migration/statistics/search assertions (reload, obsolete schema, real periods, chart totals, names, partial phones).`,
);

// Real auth service runs against an isolated in-memory localStorage, never a browser profile.
const storageRecords = new Map();
events.localStorage = {
  getItem: (key) => storageRecords.get(key) ?? null,
  setItem: (key, value) => storageRecords.set(key, value),
  removeItem: (key) => storageRecords.delete(key),
};
events.setTimeout = (callback) => {
  queueMicrotask(callback);
  return 1;
};
const authModule = await load(path.resolve("src/entities/user/api/authService.ts"));
await authModule.evaluate();
const auth = authModule.namespace.authService,
  authAssertions = assertions;
const registered = await auth.register({
  firstName: "QA",
  lastName: "Registered",
  email: " NEW@EXAMPLE.TEST ",
  password: "Testing123!",
});
check(registered.role, "USER");
check(registered.email, "new@example.test");
check("password" in registered, false);
check((await auth.getCurrentUser()).id, registered.id);
await auth.logout();
check(await auth.getCurrentUser(), null);
await rejects(() => auth.login(registered.email, "wrong"), /Неверный/);
await auth.login("NEW@example.test", "Testing123!");
check((await auth.getCurrentUser()).id, registered.id);
await rejects(
  () =>
    auth.register({
      firstName: "QA",
      lastName: "Duplicate",
      email: registered.email,
      password: "Testing123!",
    }),
  /уже зарегистрирован/,
);
await auth.updateProfile(registered.id, {
  firstName: "Updated",
  lastName: "Registered",
  phone: "+7 912 345-67-89",
  telegram: "",
  birthDate: "",
  bio: "QA",
});
check((await auth.getCurrentUser()).firstName, "Updated");
await rejects(() => auth.changePassword(registered.id, "wrong", "NewTest123!"), /неверно/);
await auth.changePassword(registered.id, "Testing123!", "NewTest123!");
await auth.logout();
await auth.login(registered.email, "NewTest123!");
check((await auth.getCurrentUser()).id, registered.id);
await auth.adminDeleteAccount(registered.id);
check(await auth.getCurrentUser(), null);
check(storageRecords.has("pc-auth-session-v3"), false);
console.log(
  `PASS: ${assertions - authAssertions} auth assertions (registration, login, logout, restored session, profile, password, removed account).`,
);
const integrationAssertions = assertions;
let uiId = 0;
stub("react", {
  useEffect: () => {},
  useEffectEvent: (fn) => fn,
  useId: () => `test-${++uiId}`,
  useRef: () => ({ current: null }),
  useState: (value) => [value, () => {}],
  useSyncExternalStore: () => true,
});
stub("react-dom", { createPortal: (node) => node });
stub("lucide-react", { Eye: "Eye", EyeOff: "EyeOff", X: "X", LoaderCircle: "LoaderCircle" });
const uiModule = await load(path.resolve("src/shared/ui/Button/Button.tsx"));
await uiModule.evaluate();
const { Button, GlowButton, SecondaryButton } = uiModule.namespace;
const idle = Button({
  children: "Save",
  variant: "primary",
  type: "submit",
  className: "custom",
  onClick: () => {},
});
check(idle.type, "button");
check(idle.props.type, "submit");
check(idle.props.disabled, false);
check(idle.props["aria-busy"], undefined);
check(idle.props.className, "pc-button primary custom");
check(typeof idle.props.onClick, "function");
const pending = Button({ children: "Save", loading: true });
check(pending.props.disabled, true);
check(pending.props["aria-busy"], true);
check(pending.props.children[0].props["aria-hidden"], "true");
check(Button({ children: "Delete", disabled: true, variant: "danger" }).props.disabled, true);
check(GlowButton({ children: "Create" }).props.variant, "primary");
check(SecondaryButton({ children: "Cancel" }).props.variant, "secondary");
console.log(
  `PASS: ${assertions - integrationAssertions} Button assertions (native semantics, variants, loading, disabled, handlers).`,
);
const buttonAssertions = assertions;
context.document = { body: {} };
const modalModule = await load(path.resolve("src/shared/ui/Modal/Modal.tsx"));
await modalModule.evaluate();
const { Modal, ModalFooter, CloseButton } = modalModule.namespace;
const close = () => {};
const closeControl = CloseButton({ onClick: close, disabled: true });
check(closeControl.props.type, "button");
check(closeControl.props.variant, "ghost");
check(closeControl.props["aria-label"], "Закрыть");
check(closeControl.props.disabled, true);
const footer = ModalFooter({ children: "actions" });
check(footer.props.className, "modal-actions");
const frame = Modal({
  title: "Tournament",
  subtitle: "Description",
  children: "facts",
  footer,
  onClose: close,
  busy: true,
}).props.children;
check(frame.props.role, "dialog");
check(frame.props["aria-modal"], "true");
check(frame.props["aria-busy"], true);
check(
  Array.from(frame.props.children, (child) => child.props.className),
  ["modal-header", "modal-content", "modal-footer"],
);
check(frame.props.children[0].props.children[0].type, CloseButton);
check(frame.props.children[1].props.children, "facts");
check(frame.props.children[2].props.children, footer);
check(Boolean(frame.props["aria-describedby"]), true);
const selectHooks = [];
let selectHook = 0,
  picked = "";
stub("react", {
  useEffect: () => {},
  useId: () => `select-${++uiId}`,
  useRef: () => ({ current: null }),
  useState: (initial) => {
    const index = selectHook++;
    if (!(index in selectHooks)) selectHooks[index] = initial;
    return [
      selectHooks[index],
      (value) => {
        selectHooks[index] = typeof value === "function" ? value(selectHooks[index]) : value;
      },
    ];
  },
});
stub("lucide-react", { Check: "Check", ChevronDown: "ChevronDown" });
const selectModule = await load(path.resolve("src/shared/ui/Select/SelectField.tsx"));
await selectModule.evaluate();
const { SelectField, optionIndex } = selectModule.namespace;
check(optionIndex("ArrowDown", 1, 2), 0);
check(optionIndex("ArrowUp", 0, 2), 1);
check(optionIndex("Home", 1, 2), 0);
check(optionIndex("End", 0, 2), 1);
check(optionIndex("ArrowDown", 0, 0), -1);
check(optionIndex("Other", 1, 2), 1);
const selectProps = {
  options: [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
  ],
  value: "a",
  labelId: "team-label",
  name: "teamId",
  required: true,
  onChange: (value) => {
    picked = value;
  },
};
const selectRender = (props) => {
  selectHook = 0;
  return SelectField({ ...selectProps, ...props });
};
const triggerOf = (field) => field.props.children[1];
let field = selectRender();
check(triggerOf(field).props.role, "combobox");
check(triggerOf(field).props["aria-expanded"], false);
check(triggerOf(field).props["aria-labelledby"], "team-label");
check(triggerOf(field).props["aria-required"], true);
const keyEvent = (key) => ({ key, preventDefault() {}, stopPropagation() {} });
triggerOf(field).props.onKeyDown(keyEvent("ArrowDown"));
field = selectRender();
check(triggerOf(field).props["aria-expanded"], true);
check(field.props.children[2].props.role, "listbox");
triggerOf(field).props.onKeyDown(keyEvent("ArrowDown"));
field = selectRender();
triggerOf(field).props.onKeyDown(keyEvent("Enter"));
field = selectRender();
check(picked, "b");
check(triggerOf(field).props["aria-expanded"], false);
triggerOf(field).props.onClick();
field = selectRender();
triggerOf(field).props.onKeyDown(keyEvent("Escape"));
field = selectRender();
check(triggerOf(field).props["aria-expanded"], false);
triggerOf(field).props.onClick();
field = selectRender();
triggerOf(field).props.onKeyDown(keyEvent("Tab"));
field = selectRender();
check(triggerOf(field).props["aria-expanded"], false);
field = selectRender({ disabled: true });
triggerOf(field).props.onKeyDown(keyEvent("ArrowDown"));
field = selectRender({ disabled: true });
check(triggerOf(field).props.disabled, true);
check(triggerOf(field).props["aria-expanded"], false);
console.log(
  `PASS: ${assertions - buttonAssertions} modal/select assertions (three zones, close control, accessibility, arrows, Enter, Escape, Tab, disabled).`,
);
