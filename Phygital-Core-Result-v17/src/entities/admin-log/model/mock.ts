import { type AdminLog } from "./types";

export const logs: AdminLog[] = [
  {
    id: "1",
    date: "18.09.2025 14:32",
    admin: "Анна Сонина",
    action: "Создание",
    entityType: "Пользователь",
    entityId: "#1024",
    details: "Создан пользователь Иван Петров",
  },
  {
    id: "2",
    date: "18.09.2025 13:17",
    admin: "Анна Сонина",
    action: "Изменение",
    entityType: "Команда",
    entityId: "#56",
    details: "Изменено название команды",
  },
  {
    id: "3",
    date: "17.09.2025 16:21",
    admin: "Мария Котова",
    action: "Одобрение",
    entityType: "Заявка",
    entityId: "#87",
    details: "Одобрена заявка на турнир",
  },
];
