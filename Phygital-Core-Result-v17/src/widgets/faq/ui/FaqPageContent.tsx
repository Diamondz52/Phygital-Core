"use client";

import { useState } from "react";
import { ChevronDown, MessageSquareText, Send } from "lucide-react";
import { GlowButton } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { FeedbackForm } from "@/features/send-feedback";
const questions = [
  [
    "Где проходят мероприятия?",
    "На базе Кампуса КЦТ в Екатеринбурге. Точная площадка указывается организаторами в информации о турнире.",
  ],
  [
    "Что нужно для участия?",
    "Зарегистрируйтесь, вступите в команду и подайте заявку на выбранный турнир.",
  ],
  [
    "Как создать команду?",
    "Создайте команду на странице «Команды», затем пригласите зарегистрированных игроков. Участники попадут в состав после принятия приглашения.",
  ],
  [
    "Как принять участие в турнире?",
    "Заявку от имени существующей команды подаёт её капитан. Команда выбирается из доступного списка.",
  ],
  [
    "Как определяется победитель?",
    "По сумме результатов реального и цифрового этапов в соответствии с правилами конкретного турнира.",
  ],
];

export function FaqPageContent() {
  const [open, setOpen] = useState<number | null>(null),
    [ask, setAsk] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <>
      <section className="content-section faq-shell faq-compact">
        <aside className="faq-aside glass">
          <MessageSquareText />
          <h2>Сформулируйте вопрос — мы разберёмся</h2>
          <p>Ответ придёт на указанный email.</p>
          <GlowButton onClick={() => setAsk(true)}>
            Задать свой вопрос <Send />
          </GlowButton>
        </aside>
        <div className="faq-list faq-modern">
          {questions.map(([q, a], i) => (
            <article className={`glass ${open === i ? "open" : ""}`} key={q}>
              <button aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                <span>0{i + 1}</span>
                <b>{q}</b>
                <ChevronDown />
              </button>
              <div className="faq-answer">
                <p>{a}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      {ask && (
        <Modal
          title="Задать вопрос"
          subtitle="Мы ответим на указанный email."
          busy={busy}
          onClose={() => setAsk(false)}
        >
          <FeedbackForm onBusyChange={setBusy} />
        </Modal>
      )}
    </>
  );
}
