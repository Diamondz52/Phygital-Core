"use client";
import { useRef, useState, type FormEvent } from "react";
import { Send } from "lucide-react";
import { FEEDBACK_TOPICS, feedbackService, type FeedbackDraft } from "@/entities/feedback";
import { useApp } from "@/shared/providers";

const empty: FeedbackDraft = { name: "", email: "", topic: "", message: "" };
export function FeedbackForm({ onBusyChange }: { onBusyChange?: (busy: boolean) => void }) {
  const { notify } = useApp();
  const [draft, setDraft] = useState(empty), [busy, setBusy] = useState(false), [sent, setSent] = useState(false), [error, setError] = useState("");
  const locked = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (locked.current) return;
    locked.current = true; setBusy(true); onBusyChange?.(true); setError("");
    try { await feedbackService.createFeedback(draft); setDraft(empty); setSent(true); notify("Сообщение отправлено"); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось отправить сообщение. Попробуйте ещё раз."); }
    finally { locked.current = false; setBusy(false); onBusyChange?.(false); }
  };
  if (sent) return <div className="form-success" role="status"><Send/><h3>Сообщение отправлено</h3><p>Мы получили ваше обращение и свяжемся с вами по указанному email.</p><button className="secondary" onClick={() => setSent(false)}>Отправить ещё одно</button></div>;
  return <form onSubmit={submit} aria-busy={busy} className="feedback-form">
    <label><span>Ваше имя <b className="required">*</b></span><input name="name" minLength={2} maxLength={100} autoComplete="name" required disabled={busy} value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })}/></label>
    <label><span>Email <b className="required">*</b></span><input name="email" type="email" autoComplete="email" maxLength={254} required disabled={busy} value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })}/></label>
    <label><span>Тема <b className="required">*</b></span><select name="topic" required disabled={busy} value={draft.topic} onChange={event => setDraft({ ...draft, topic: event.target.value })}><option value="" disabled>Выберите тему</option>{FEEDBACK_TOPICS.map(topic => <option key={topic}>{topic}</option>)}</select></label>
    <label><span>Сообщение <b className="required">*</b></span><textarea name="message" required maxLength={500} disabled={busy} value={draft.message} onChange={event => setDraft({ ...draft, message: event.target.value })}/><small>{draft.message.length}/500</small></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button className="primary" disabled={busy}>{busy ? "Отправляем…" : "Отправить сообщение →"}</button></div>
  </form>;
}
