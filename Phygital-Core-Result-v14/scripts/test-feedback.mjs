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
let failOpen = false, failCommit = false, committed = 0, tail = Promise.resolve();
const events = new EventTarget();
class RecordEvent extends Event { constructor(type, options) { super(type); this.detail = options?.detail; } }
const indexedDB = {
  open() {
    const request = {};
    queueMicrotask(() => {
      if (failOpen) { request.onerror?.(); return; }
      request.result = {
        close() {},
        transaction() {
          const transaction = {}, requests = [], staged = new Map(); let aborted = false;
          transaction.abort = () => { aborted = true; };
          transaction.objectStore = () => ({
            get(key) { const read = {}; requests.push({ read, key }); return read; },
            put(value, key) { staged.set(key, structuredClone(value)); },
          });
          const run = async () => {
            for (const { read, key } of requests) { read.result = structuredClone(records.get(key)); read.onsuccess?.(); }
            await Promise.resolve();
            if (aborted || failCommit) { transaction.onabort?.(); return; }
            for (const [key, value] of staged) records.set(key, value);
            if (staged.size) committed++;
            transaction.oncomplete?.();
          };
          tail = tail.then(run); return transaction;
        },
      };
      request.onsuccess?.();
    });
    return request;
  },
};
const context = vm.createContext({ indexedDB, window: events, CustomEvent: RecordEvent, crypto: webcrypto, Date, Error, Promise, console });
const modules = new Map();
const overrides = new Map();
async function load(filename) {
  if (modules.has(filename)) return modules.get(filename);
  const source = await readFile(filename, "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const sourceModule = new vm.SourceTextModule(code, { context, identifier: filename }); modules.set(filename, sourceModule);
  await sourceModule.link(async (specifier, parent) => {
    if (overrides.has(specifier)) return overrides.get(specifier);
    let target = specifier.startsWith("@/") ? path.resolve("src", specifier.slice(2)) : path.resolve(path.dirname(parent.identifier), specifier);
    try { await readFile(`${target}.ts`); target += ".ts"; } catch { target = path.join(target, "index.ts"); }
    return load(target);
  });
  return sourceModule;
}
const serviceModule = await load(path.resolve("src/entities/feedback/service.ts")); await serviceModule.evaluate();
const { feedbackService: service } = serviceModule.namespace;
const admin = { role: "ADMIN", firstName: "QA", lastName: "Admin" }, player = { role: "USER" };
const draft = { name: "  QA User  ", email: "QA@EXAMPLE.TEST ", topic: "Технические вопросы", message: "Первая строка\nВторая строка" };
const key = "admin-state-v4";
records.set(key, { teams: [{ id: "keep-team" }], users: [{ id: "keep-user" }], logs: [] });
let assertions = 0;
const check = (actual, expected) => { assert.deepEqual(actual, expected); assertions++; };
const rejects = async (action, pattern) => { await assert.rejects(action, pattern); assertions++; };

for (const patch of [{ name: " " }, { email: "wrong" }, { topic: "Несуществующая тема" }, { message: " " }, { message: "a".repeat(501) }]) await rejects(() => service.createFeedback({ ...draft, ...patch }), /Имя|email|тему|Сообщение/);
check(committed, 0);
const first = await service.createFeedback(draft);
check(first.name, "QA User"); check(first.email, "qa@example.test"); check(first.status, "new"); check(first.message, draft.message);
check(Boolean(first.createdAt && first.id), true); check(committed, 1);
check(records.get(key).teams, [{ id: "keep-team" }]); check(records.get(key).users, [{ id: "keep-user" }]);
await Promise.all(Array.from({ length: 12 }, (_, index) => service.createFeedback({ ...draft, name: `QA ${index}` })));
check((await service.getFeedbackList(admin)).length, 13);
await rejects(() => service.getFeedbackList(null), /администратор/);
await rejects(() => service.getFeedbackById(first.id, player), /администратор/);
await rejects(() => service.updateFeedbackStatus(first.id, "closed", player), /администратор/);
await rejects(() => service.markViewed(first.id, player), /администратор/);
await rejects(() => service.updateFeedbackStatus(first.id, "bad", admin), /статус/);
await rejects(() => service.getFeedbackById("missing", admin), /не найдено/);
await rejects(() => service.updateFeedbackStatus("missing", "closed", admin), /не найдено/);
await service.markViewed(first.id, admin); const viewed = (await service.getFeedbackById(first.id, admin)).viewedAt;
await service.markViewed(first.id, admin); check((await service.getFeedbackById(first.id, admin)).viewedAt, viewed);
await service.updateFeedbackStatus(first.id, "in_progress", admin); await service.updateFeedbackStatus(first.id, "closed", admin);
check((await service.getFeedbackById(first.id, admin)).status, "closed"); check(records.get(key).logs.length, 2);
await service.updateFeedbackStatus(first.id, "closed", admin); check(records.get(key).logs.length, 2);
const before = structuredClone(records.get(key));
failCommit = true;
await rejects(() => service.createFeedback(draft), /сохранить/); check(records.get(key), before);
await rejects(() => service.updateFeedbackStatus(first.id, "new", admin), /сохранить/); check(records.get(key), before);
failCommit = false; failOpen = true;
await rejects(() => service.createFeedback(draft), /открыть/);
await rejects(() => service.getFeedbackList(admin), /открыть/);
failOpen = false;
check((await service.getFeedbackList(admin)).length, 13);
console.log(`PASS: ${assertions} feedback assertions (validation, access, atomicity, concurrency, persistence failures).`);

// Exercise the actual AdminStore actions with a minimal React hook host. No UI,
// password changes, emails or user-owned browser records are touched by these tests.
const feedbackAssertions = assertions;
function stub(name, exports) {
  overrides.set(name, new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context }));
}
const players = [
  { id: "captain", firstName: "QA", lastName: "Captain", role: "USER", email: "captain@example.test" },
  { id: "player", firstName: "QA", lastName: "Player", role: "USER", email: "player@example.test" },
  { id: "decliner", firstName: "QA", lastName: "Decliner", role: "USER", email: "decliner@example.test" },
  { id: "admin", firstName: "QA", lastName: "Admin", role: "ADMIN", email: "admin@example.test" },
];
let actor = players[0], hookIndex = 0, authWrites = 0;
const hookState = [];
stub("react", {
  createContext: () => ({ Provider: "Provider" }), useContext: () => null,
  useEffect: () => {}, useMemo: calculate => calculate(),
  useState: initial => { const index = hookIndex++; if (!(index in hookState)) hookState[index] = typeof initial === "function" ? initial() : initial; return [hookState[index], value => { hookState[index] = typeof value === "function" ? value(hookState[index]) : value; }]; },
});
stub("react/jsx-runtime", { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) });
stub("@/entities", { users: players, teams: [], tournaments: [], teamApplications: [], tournamentApplications: [], logs: [] });
stub("@/features/auth", { useAuth: () => ({ user: actor }), authService: {
  adminCreateAccount: async () => { authWrites++; }, adminUpdateAccount: async () => { authWrites++; },
  adminDeleteAccount: async () => { authWrites++; }, adminResetPassword: async () => { authWrites++; },
} });
records.clear();
const storeModule = await load(path.resolve("src/features/admin-management/model/AdminStore.tsx")); await storeModule.evaluate();
const actions = () => { hookIndex = 0; return storeModule.namespace.AdminStoreProvider({ children: null }).props.value; };
await rejects(() => actions().createUser({ password: "Testing123!" }), /Недостаточно прав/);
await rejects(() => actions().resetPassword("player"), /Недостаточно прав/); check(authWrites, 0);
const team = await actions().createCaptainTeam("QA Integration Team");
check(actions().state.teams[0].members.length, 1);
await actions().sendInvitation(team.id, "player");
await rejects(() => actions().sendInvitation(team.id, "player"), /уже отправлено/);
await rejects(() => actions().sendInvitation(team.id, "admin"), /Администратора/);
const invitation = actions().state.invitations[0];
actor = players[2]; await rejects(() => actions().respondInvitation(invitation.id, "accepted"), /прав/);
actor = players[1]; await actions().respondInvitation(invitation.id, "accepted");
check(actions().state.teams[0].members.length, 2);
check(actions().state.invitations[0].status, "accepted");
await rejects(() => actions().respondInvitation(invitation.id, "accepted"), /обработано/);
check(actions().state.notifications.some(item => item.userId === "captain" && item.type === "invitation_result"), true);
actor = players[0]; await actions().sendInvitation(team.id, "decliner");
const declinedId = actions().state.invitations[0].id;
actor = players[2]; await actions().respondInvitation(declinedId, "declined");
check(actions().state.teams[0].members.length, 2); check(actions().state.invitations[0].status, "declined");
actor = players[0]; await actions().sendInvitation(team.id, "decliner");
await actions().cancelInvitation(actions().state.invitations[0].id); check(actions().state.invitations[0].status, "cancelled");
await rejects(() => actions().removeTeamMember(team.id, "captain"), /другого капитана/);
await rejects(() => actions().assignCaptain(team.id, "decliner"), /участником/);
await actions().assignCaptain(team.id, "player"); check(actions().state.teams[0].members.filter(item => item.captain).map(item => item.id), ["player"]);
await rejects(() => actions().removeTeamMember(team.id, "player"), /другого капитана/);
actor = players[1]; await actions().removeTeamMember(team.id, "captain"); check(actions().state.teams[0].members.length, 1);
actor = players[3];
await rejects(() => actions().createTeam({ name: "Invalid", playerIds: ["admin"], captainId: "admin" }), /себя/);
await rejects(() => actions().createTeam({ name: "Invalid", playerIds: ["captain", "captain"], captainId: "captain" }), /несколько слотов/);
await rejects(() => actions().createTeam({ name: "Invalid", playerIds: ["captain"], captainId: "player" }), /игровой слот/);
await actions().createTeam({ name: "QA Slots", playerIds: ["captain", "decliner"], captainId: "captain" });
const slots = actions().state.teams.find(item => item.name === "QA Slots"); check(slots.members.length, 2);
await rejects(() => actions().updateTeam(slots.id, { name: " " }), /название/);
await rejects(() => actions().updateTeam(slots.id, { name: team.name }), /уже существует/);
await actions().updateTeam(slots.id, { name: "QA Renamed" }); check(actions().state.teams.find(item => item.id === slots.id).name, "QA Renamed");
await actions().addTeamMember(slots.id, "player"); await rejects(() => actions().addTeamMember(slots.id, "player"), /уже состоит/);
await actions().removeTeamMember(slots.id, "player"); check(actions().state.teams.find(item => item.id === slots.id).members.length, 2);
const tournamentDraft = { name: "QA Tournament", shortDescription: "Test", fullDescription: "Long description", city: "QA City", startAt: "2027-01-01T12:00", endAt: "2027-01-02T12:00", imageName: "test.png", imageUrl: "data:image/png;base64,test" };
await rejects(() => actions().createTournament({ ...tournamentDraft, endAt: "2026-01-01T12:00" }), /позднее/);
await actions().createTournament(tournamentDraft);
const tournament = actions().state.tournaments[0];
check(tournament.description, "Long description"); check(tournament.imageUrl, tournamentDraft.imageUrl);
await rejects(() => actions().updateTournament(tournament.id, { shortDescription: "x".repeat(501) }), /500/);
await rejects(() => actions().updateTournament(tournament.id, { endAt: "invalid" }), /корректные даты/);
actor = players[2]; await rejects(() => actions().submitTournamentApplication(slots.id, tournament.id, ""), /капитан/);
actor = players[0]; await actions().submitTournamentApplication(slots.id, tournament.id, "Test application");
check(actions().state.tournamentApplications.length, 1);
await rejects(() => actions().submitTournamentApplication(slots.id, tournament.id, ""), /уже отправлена/);
actor = players[3]; await actions().updateTournamentApplication(actions().state.tournamentApplications[0].id, "APPROVED");
check(actions().state.tournamentApplications[0].status, "APPROVED");
await actions().deleteTournament(tournament.id); check(actions().state.tournaments.length, 0); check(actions().state.tournamentApplications.length, 0);
await actions().deleteTeam(slots.id); check(actions().state.teams.some(item => item.id === slots.id), false);
check(records.get(key).teams.length, 1);
check(actions().state.logs.some(item => item.action === "Удаление" && item.entityType === "Турнир"), true);
console.log(`PASS: ${assertions - feedbackAssertions} platform assertions (teams, invitations, roster, captain, applications, CRUD, logs).`);
