export function participants(count: number) {
  const mod10 = count % 10,
    mod100 = count % 100;
  return `${count} ${mod10 === 1 && mod100 !== 11 ? "участник" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "участника" : "участников"}`;
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toLocaleUpperCase("ru-RU");
}
