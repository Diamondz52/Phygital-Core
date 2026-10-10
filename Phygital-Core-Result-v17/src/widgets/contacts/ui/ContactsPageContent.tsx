"use client";

import { type ReactNode } from "react";
import { Clock3, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { CONTACTS } from "@/shared/config";
import { FeedbackForm } from "@/features/send-feedback";
function Contact({
  icon,
  label,
  value,
  detail,
  href,
  external = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  href?: string;
  external?: boolean;
}) {
  const body = (
    <>
      {icon}
      <span>
        <small>{label}</small>
        <b>{value}</b>
        <em>{detail}</em>
      </span>
      {external && <ExternalLink />}
    </>
  );
  return href ? (
    <a
      className={`contact-row ${external ? "contact-row-link" : ""}`}
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
    >
      {body}
    </a>
  ) : (
    <div className="contact-row">{body}</div>
  );
}

export function ContactsPageContent() {
  return (
    <>
      <section className="content-section contacts-workspace glass">
        <div className="contacts-list" aria-label="Контактная информация">
          <Contact
            icon={<Phone />}
            label="Позвонить"
            value={CONTACTS.phone}
            detail="Пн–Пт, 9:00–18:00"
            href="tel:+73431234567"
          />
          <Contact
            icon={<Mail />}
            label="Написать"
            value={CONTACTS.email}
            detail="Для вопросов и предложений"
            href={`mailto:${CONTACTS.email}`}
          />
          <Contact
            icon={<Clock3 />}
            label="Режим работы"
            value="Пн–Пт 9:00–18:00"
            detail="Сб–Вс — выходные"
          />
          <Contact
            icon={<MapPin />}
            label="Организаторы"
            value="Колледж Цифровых Технологий"
            detail={CONTACTS.address}
            href={CONTACTS.organizerUrl}
            external
          />
        </div>
        <div className="contact-divider" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="contact-form-compact">
          <p className="eyebrow">ОБРАТНАЯ СВЯЗЬ</p>
          <h2>Расскажите, чем помочь</h2>
          <p>Оставьте сообщение — мы ответим на указанный email.</p>
          <FeedbackForm />
        </div>
      </section>
    </>
  );
}
