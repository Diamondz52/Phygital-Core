import { type AdminLog } from "@/entities/admin-log/@x/feedback";
import { type User } from "@/entities/user/@x/feedback";
import { loadRecord, updateRecord } from "@/shared/storage";
import { PLATFORM_STORAGE_KEY } from "@/shared/config";
import { FEEDBACK_TOPICS, type Feedback, type FeedbackDraft, type FeedbackStatus } from "./model";

type Document = { feedback?: Feedback[]; logs?: AdminLog[] };

function requireAdmin(actor: User | null) {
  if (actor?.role !== "ADMIN")
    throw new Error("Просматривать и обрабатывать обращения может только администратор");
  return actor;
}

function validate(draft: FeedbackDraft) {
  const cleaned = {
    name: draft.name.trim(),
    email: draft.email.trim().toLowerCase(),
    topic: draft.topic,
    message: draft.message.trim(),
  };
  if (cleaned.name.length < 2 || cleaned.name.length > 100)
    throw new Error("Имя должно содержать от 2 до 100 символов");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned.email) || cleaned.email.length > 254)
    throw new Error("Укажите корректный email");
  if (!(FEEDBACK_TOPICS as readonly string[]).includes(cleaned.topic))
    throw new Error("Выберите тему обращения");
  if (!cleaned.message || cleaned.message.length > 500)
    throw new Error("Сообщение должно содержать от 1 до 500 символов");
  return cleaned;
}

/** Replace this adapter with HTTP later; forms and admin UI use the same API. */
export const feedbackService = {
  async createFeedback(draft: FeedbackDraft): Promise<Feedback> {
    const now = new Date().toISOString();
    const feedback: Feedback = {
      ...validate(draft),
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      status: "new",
    };
    await updateRecord<Document>(PLATFORM_STORAGE_KEY, {}, (previous) => ({
      ...previous,
      feedback: [feedback, ...(previous.feedback ?? [])],
    }));
    return feedback;
  },
  async getFeedbackList(actor: User | null): Promise<Feedback[]> {
    requireAdmin(actor);
    return (await loadRecord<Document>(PLATFORM_STORAGE_KEY, {})).feedback ?? [];
  },
  async getFeedbackById(id: string, actor: User | null): Promise<Feedback> {
    const feedback = (await this.getFeedbackList(actor)).find((item) => item.id === id);
    if (!feedback) throw new Error("Обращение не найдено");
    return feedback;
  },
  async markViewed(id: string, actor: User | null): Promise<void> {
    requireAdmin(actor);
    await updateRecord<Document>(PLATFORM_STORAGE_KEY, {}, (previous) => {
      if (!previous.feedback?.some((item) => item.id === id))
        throw new Error("Обращение не найдено");
      return {
        ...previous,
        feedback: previous.feedback.map((item) =>
          item.id === id && !item.viewedAt ? { ...item, viewedAt: new Date().toISOString() } : item,
        ),
      };
    });
  },
  async updateFeedbackStatus(
    id: string,
    status: FeedbackStatus,
    actor: User | null,
  ): Promise<void> {
    const admin = requireAdmin(actor);
    if (!["new", "in_progress", "closed"].includes(status)) throw new Error("Некорректный статус");
    await updateRecord<Document>(PLATFORM_STORAGE_KEY, {}, (previous) => {
      const current = previous.feedback?.find((item) => item.id === id);
      if (!current) throw new Error("Обращение не найдено");
      if (current.status === status) return previous;
      const now = new Date().toISOString();
      const log: AdminLog = {
        id: crypto.randomUUID(),
        date: now,
        admin: `${admin.firstName} ${admin.lastName}`,
        action: "Изменение",
        entityType: "Обращение",
        entityId: id,
        details: `Статус обращения: ${current.status} → ${status}`,
      };
      return {
        ...previous,
        feedback: previous.feedback!.map((item) =>
          item.id === id
            ? { ...item, status, viewedAt: item.viewedAt ?? now, updatedAt: now }
            : item,
        ),
        logs: [log, ...(previous.logs ?? [])],
      };
    });
  },
};
