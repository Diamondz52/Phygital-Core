"use client";
import {Button} from "@/shared/ui";
import { useRef, useState } from "react";
import { Eye, Search } from "lucide-react";
import { FEEDBACK_STATUS_LABELS, feedbackService, type FeedbackStatus } from "@/entities/feedback";
import { useAdminStore } from "@/features/admin-management";
import { useAuth } from "@/features/auth";
import { useApp } from "@/shared/providers";
import { Badge, Modal } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets";

export function FeedbackAdmin() {
  const { state } = useAdminStore(), { user } = useAuth(), { notify } = useApp();
  const [query, setQuery] = useState(""), [status, setStatus] = useState("all"), [page, setPage] = useState(1), [selectedId, setSelectedId] = useState<string | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const lock = useRef(false);
  const filtered = state.feedback.filter(item => (status === "all" || item.status === status) && `${item.name} ${item.email} ${item.topic} ${item.message}`.toLowerCase().includes(query.trim().toLowerCase()));
  const pages = Math.max(1, Math.ceil(filtered.length / 8)), currentPage = Math.min(page, pages), rows = filtered.slice((currentPage - 1) * 8, currentPage * 8), selected = state.feedback.find(item => item.id === selectedId);
  const run = async (action: () => Promise<void>) => { if (lock.current) return; lock.current = true; setBusy(true); setError(""); try { await action(); } catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось обработать обращение"); } finally { lock.current = false; setBusy(false); } };
  const open = (id: string) => { setSelectedId(id); void run(() => feedbackService.markViewed(id, user)); };
  return <><AdminPageHeader title="ОБРАЩЕНИЯ" description="Сообщения из контактов и FAQ. Данные обновляются автоматически."/>
    <div className="admin-tools"><label><Search/><input aria-label="Поиск обращений" placeholder="Имя, email, тема или сообщение" value={query} onChange={event => { setQuery(event.target.value); setPage(1); }}/></label><select aria-label="Статус обращения" value={status} onChange={event => { setStatus(event.target.value); setPage(1); }}><option value="all">Все статусы</option>{Object.entries(FEEDBACK_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><Button variant="secondary" className="secondary" onClick={() => { setQuery(""); setStatus("all"); setPage(1); }}>Сбросить</Button></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {rows.length ? <div className="feedback-table glass"><table><thead><tr>{["Отправитель", "Email", "Тема", "Сообщение", "Дата и время", "Статус", "Просмотр"].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(item => <tr key={item.id}><td><button className="text-button" onClick={() => open(item.id)}>{!item.viewedAt && <span className="feedback-unread"/>}{item.name}</button></td><td><a href={`mailto:${item.email}`}>{item.email}</a></td><td>{item.topic}</td><td className="feedback-preview">{item.message.slice(0, 80)}{item.message.length > 80 ? "…" : ""}</td><td>{new Date(item.createdAt).toLocaleString("ru-RU")}</td><td><Badge tone={item.status === "new" ? "blue" : item.status === "closed" ? "green" : "purple"}>{FEEDBACK_STATUS_LABELS[item.status]}</Badge></td><td><button className="icon-button" aria-label={`Просмотреть обращение ${item.name}`} onClick={() => open(item.id)}><Eye/></button></td></tr>)}</tbody></table></div> : <div className="admin-empty glass"><h2>{state.feedback.length ? "Обращения не найдены" : "Обращений пока нет"}</h2><p>Отправленные сообщения появляются здесь без ручного переноса.</p></div>}
    <div className="pagination" aria-label="Страницы обращений"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Предыдущая страница">‹</button><span>{currentPage} / {pages}</span><button disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)} aria-label="Следующая страница">›</button></div>
    {selected && <Modal title="Обращение" onClose={() => setSelectedId(null)} busy={busy}><dl className="feedback-details"><dt>Имя</dt><dd>{selected.name}</dd><dt>Email</dt><dd><a href={`mailto:${selected.email}`}>{selected.email}</a></dd><dt>Тема</dt><dd>{selected.topic}</dd><dt>Дата и время</dt><dd>{new Date(selected.createdAt).toLocaleString("ru-RU")}</dd><dt>Сообщение</dt><dd className="feedback-message">{selected.message}</dd></dl><label>Статус<select aria-label="Изменить статус обращения" value={selected.status} disabled={busy} onChange={event => { const value = event.target.value as FeedbackStatus; void run(async () => { await feedbackService.updateFeedbackStatus(selected.id, value, user); notify("Статус обращения сохранён"); }); }}>{Object.entries(FEEDBACK_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>{error && <p className="form-error" role="alert">{error}</p>}{busy && <p role="status">Сохраняем…</p>}</Modal>}
  </>;
}
