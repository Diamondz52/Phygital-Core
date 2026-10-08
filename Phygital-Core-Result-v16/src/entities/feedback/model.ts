export const FEEDBACK_TOPICS = ["Участие в турнире", "Регистрация команды", "Правила турнира", "Предложение сотрудничества", "Технические вопросы", "Другое"] as const;
export type FeedbackStatus = "new" | "in_progress" | "closed";
export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = { new: "Новое", in_progress: "В работе", closed: "Закрыто" };
export interface FeedbackDraft { name: string; email: string; topic: string; message: string }
export interface Feedback extends FeedbackDraft { id: string; createdAt: string; updatedAt: string; status: FeedbackStatus; viewedAt?: string }
