import { type Team } from "./types";

export const teams: Team[] = [
  {
    id: "t1",
    name: "New Dimension",
    discipline: "",
    createdAt: "2026-09-27T12:00:00+05:00",
    members: [
      { id: "u2", name: "Иван Петров", captain: true },
      { id: "u3", name: "Мария Иванова" },
      { id: "u4", name: "Алексей Смирнов" },
      { id: "u5", name: "Никита Соколов" },
    ],
  },
  {
    id: "t2",
    name: "Второе дыхание",
    discipline: "",
    members: [
      { id: "u3", name: "Мария Иванова", captain: true },
      { id: "u2", name: "Иван Петров" },
      { id: "u4", name: "Алексей Смирнов" },
    ],
  },
  {
    id: "t3",
    name: "Impulse",
    discipline: "",
    members: [
      { id: "u4", name: "Алексей Смирнов", captain: true },
      { id: "u3", name: "Мария Иванова" },
    ],
  },
  {
    id: "t4",
    name: "Cyber Tigers",
    discipline: "",
    members: [
      { id: "u3", name: "Мария Иванова", captain: true },
      { id: "u4", name: "Алексей Смирнов" },
      { id: "u5", name: "Никита Соколов" },
    ],
  },
  {
    id: "t5",
    name: "Steel Mind",
    discipline: "",
    members: [{ id: "u4", name: "Алексей Смирнов", captain: true }],
  },
  {
    id: "t6",
    name: "Unity",
    discipline: "",
    members: [
      { id: "u3", name: "Мария Иванова", captain: true },
      { id: "u2", name: "Иван Петров" },
    ],
  },
];
