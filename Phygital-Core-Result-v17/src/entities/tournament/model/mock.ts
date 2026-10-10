import { type Tournament } from "./types";

export const tournaments: Tournament[] = [
  {
    id: "phygital-basketball",
    publicNumber: "#001",
    name: "Фиджитал Баскетбол",
    discipline: "Фиджитал-спорт",
    format: "5×5 · LAN + REAL",
    city: "Екатеринбург",
    venue: "Кампус КЦТ",
    shortDescription: "Реальные броски. Цифровые победы.",
    description:
      "Турнир, где физическая игра встречается с киберпространством. Команды проходят реальный и цифровой этапы.",
    startAt: "2027-10-25T09:00:00+05:00",
    endAt: "2027-10-27T19:00:00+05:00",
    registrationEndsAt: "2027-10-20T23:59:00+05:00",
    rules: [
      "Команда состоит из пяти участников",
      "Результаты двух этапов суммируются",
      "Честная игра обязательна",
    ],
  },
  {
    id: "digital-battle",
    publicNumber: "#002",
    name: "Digital Battle",
    discipline: "Киберспорт",
    format: "LAN",
    city: "Москва",
    venue: "Cyber Arena",
    shortDescription: "Командный цифровой турнир.",
    description: "Соревнование по командной цифровой дисциплине.",
    startAt: "2026-09-01T09:00:00+03:00",
    endAt: "2026-09-30T19:00:00+03:00",
    registrationEndsAt: "2026-08-25T23:59:00+03:00",
    rules: ["Состав из пяти игроков"],
  },
];
