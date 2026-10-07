import { createLocalDataSource } from "@/shared/api";
import type { AuthUser, LocalAccount, ProfilePatch, RegisterPayload } from "../model/types";

const accountsSource = createLocalDataSource<LocalAccount[] | null>("pc-auth-accounts-v3");
const sessionSource = createLocalDataSource<{ userId: string } | null>("pc-auth-session-v3");

const seedAccounts: LocalAccount[] = [
  { id: "u1", firstName: "Анна", lastName: "Сонина", email: "admin@phygital.local", password: "Admin123!", phone: "+7 912 345-67-89", telegram: "@annasonina", birthDate: "2000-05-14", avatar: "", bio: "Администратор платформы и организатор турниров.", role: "ADMIN" },
  { id: "u2", firstName: "Иван", lastName: "Петров", email: "user@phygital.local", password: "User123!", phone: "+7 912 111-22-33", telegram: "@ivanpetrov", birthDate: "2001-08-22", avatar: "", bio: "Капитан New Dimension. Люблю баскетбол и командную игру.", role: "USER" },
  { id: "u3", firstName: "Мария", lastName: "Иванова", email: "maria@mail.ru", password: "Member123!", phone: "+7 900 123-45-67", telegram: "@maria_iv", birthDate: "2001-11-10", avatar: "", bio: "Игрок фиджитал-команд.", role: "USER" },
  { id: "u4", firstName: "Алексей", lastName: "Смирнов", email: "alex@mail.ru", password: "Member123!", phone: "+7 909 111-22-33", telegram: "@smirnov_a", birthDate: "2000-03-22", avatar: "", bio: "Участник турниров Phygital Core.", role: "USER" },
  { id: "u5", firstName: "Никита", lastName: "Соколов", email: "member@phygital.local", password: "Member123!", phone: "", telegram: "", birthDate: "", avatar: "", bio: "Участник команды без капитанских прав.", role: "USER" },
];

const wait = (ms = 420) => new Promise(resolve => window.setTimeout(resolve, ms));
const publicUser = (account: LocalAccount): AuthUser => ({
  id: account.id, firstName: account.firstName, lastName: account.lastName,
  email: account.email, phone: account.phone, telegram: account.telegram,
  birthDate: account.birthDate, avatar: account.avatar, bio: account.bio, role: account.role,
});

async function getAccounts() {
  const existing = await accountsSource.read(null);
  if(existing !== null) return existing;
  await accountsSource.write(seedAccounts);
  return seedAccounts;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    await wait();
    const account = (await getAccounts()).find(item => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!account || account.password !== password) throw new Error("Неверный email или пароль");
    await sessionSource.write({ userId: account.id });
    return publicUser(account);
  },
  async register(payload: RegisterPayload): Promise<AuthUser> {
    await wait(550);
    const accounts = await getAccounts();
    const email = payload.email.trim().toLowerCase();
    if (accounts.some(item => item.email.toLowerCase() === email)) throw new Error("Пользователь с таким email уже зарегистрирован");
    const account: LocalAccount = { id: crypto.randomUUID(), firstName: payload.firstName.trim(), lastName: payload.lastName.trim(), email, password: payload.password, phone: "", telegram: "", birthDate: "", avatar: "", bio: "", role: "USER" };
    await accountsSource.write([...accounts, account]);
    await sessionSource.write({ userId: account.id });
    const user = publicUser(account);
    window.dispatchEvent(new CustomEvent("phygital:user-sync", { detail: user }));
    return user;
  },
  async adminCreateAccount(payload: RegisterPayload): Promise<AuthUser> {
    await wait(550);
    const accounts = await getAccounts();
    const email = payload.email.trim().toLowerCase();
    if (accounts.some(item => item.email.toLowerCase() === email)) throw new Error("Пользователь с таким email уже зарегистрирован");
    const account: LocalAccount = { id: crypto.randomUUID(), firstName: payload.firstName.trim(), lastName: payload.lastName.trim(), email, password: payload.password, phone: "", telegram: "", birthDate: "", avatar: "", bio: "", role: "USER" };
    await accountsSource.write([...accounts, account]);
    return publicUser(account);
  },
  async adminUpdateAccount(userId: string, patch: Partial<AuthUser>): Promise<AuthUser> {
    await wait();
    const accounts = await getAccounts();
    const index = accounts.findIndex(item => item.id === userId);
    if (index < 0) {
      if (!patch.email || !patch.firstName || !patch.lastName) throw new Error("Пользователь не найден");
      const created: LocalAccount = { id: userId, firstName: patch.firstName, lastName: patch.lastName, email: patch.email.trim().toLowerCase(), password: "12345678", phone: patch.phone ?? "", telegram: patch.telegram ?? "", birthDate: patch.birthDate ?? "", avatar: patch.avatar ?? "", bio: patch.bio ?? "", role: patch.role ?? "USER" };
      await accountsSource.write([...accounts, created]);
      return publicUser(created);
    }
    if (patch.email && accounts.some(item => item.id !== userId && item.email.toLowerCase() === patch.email!.trim().toLowerCase())) throw new Error("Пользователь с таким email уже зарегистрирован");
    accounts[index] = { ...accounts[index], ...patch, email: patch.email?.trim().toLowerCase() ?? accounts[index].email };
    await accountsSource.write(accounts);
    return publicUser(accounts[index]);
  },
  async adminResetPassword(user: AuthUser): Promise<void> {
    await wait();
    const accounts = await getAccounts();
    const index = accounts.findIndex(item => item.id === user.id);
    if (index < 0) {
      await accountsSource.write([...accounts, { ...user, password: "12345678" }]);
      return;
    }
    accounts[index] = { ...accounts[index], password: "12345678" };
    await accountsSource.write(accounts);
  },
  async adminDeleteAccount(userId: string): Promise<void> {
    await wait();
    const accounts = await getAccounts();
    await accountsSource.write(accounts.filter(item => item.id !== userId));
  },
  async getCurrentUser(): Promise<AuthUser | null> {
    const session = await sessionSource.read(null);
    if (!session) return null;
    const account = (await getAccounts()).find(item => item.id === session.userId);
    if (!account) { await sessionSource.clear(); return null; }
    return publicUser(account);
  },
  async logout(): Promise<void> {
    await sessionSource.clear();
  },
  async updateProfile(userId: string, patch: ProfilePatch): Promise<AuthUser> {
    await wait();
    const accounts = await getAccounts();
    const index = accounts.findIndex(item => item.id === userId);
    if (index < 0) throw new Error("Пользователь не найден");
    const updated = { ...accounts[index], ...patch };
    accounts[index] = updated;
    await accountsSource.write(accounts);
    const user = publicUser(updated);
    window.dispatchEvent(new CustomEvent("phygital:user-sync", { detail: user }));
    return user;
  },
  async changePassword(userId: string, currentPassword: string, nextPassword: string): Promise<void> {
    await wait();
    const accounts = await getAccounts();
    const index = accounts.findIndex(item => item.id === userId);
    if (index < 0 || accounts[index].password !== currentPassword) throw new Error("Текущий пароль указан неверно");
    accounts[index] = { ...accounts[index], password: nextPassword };
    await accountsSource.write(accounts);
  },
};
