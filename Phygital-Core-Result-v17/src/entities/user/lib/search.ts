import type { User } from "../model/types";

// Names and partial phone numbers share a case/format-insensitive search path.
export function matchesPlayerSearch(user: User, query: string) {
  const words = normalized(query),
    digits = phoneDigits(query);
  if (!words && !digits) return false;
  return (
    normalized(`${user.firstName} ${user.lastName}`).includes(words) ||
    (digits.length >= 2 && phoneDigits(user.phone).includes(digits))
  );
}

export function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return phone || "Телефон не указан";
  return `+${digits[0]} ${digits.slice(1, 4)} *** ** ${digits.slice(-2)}`;
}

export function normalized(value: string) {
  return value.toLocaleLowerCase("ru-RU").replace(/\s+/g, " ").trim();
}

export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}
