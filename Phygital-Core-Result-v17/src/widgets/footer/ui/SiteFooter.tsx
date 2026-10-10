"use client";

import Link from "next/link";
import { CONTACTS } from "@/shared/config";
import { useApp } from "@/shared/providers";

import { paths } from "@/shared/config";
import { Logo } from "@/shared/ui/Logo";
import { TelegramIcon } from "@/shared/ui/SocialIcon";
import { VkIcon } from "@/shared/ui/SocialIcon";
export function SiteFooter() {
  const { t } = useApp();
  const labels = {
    home: t.home,
    tournaments: t.tournaments,
    teams: t.teams,
    rules: t.rules,
    faq: t.faq,
    contacts: t.contacts,
  };
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Logo variant="footer" />
        <p>Физический спорт, цифровая стратегия и одна команда.</p>
      </div>
      <nav className="footer-navigation" aria-label="Разделы сайта">
        <h3>Разделы</h3>
        <div>
          {paths.map(([, key, href]) => (
            <Link href={href} key={key}>
              {labels[key]}
            </Link>
          ))}
        </div>
        <Link href="/privacy">Политика конфиденциальности</Link>
      </nav>
      <div className="footer-social">
        <h3>Мы в соцсетях</h3>
        <div className="socials">
          <a
            href={CONTACTS.telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
          >
            <TelegramIcon />
          </a>
          <a href={CONTACTS.vk} target="_blank" rel="noopener noreferrer" aria-label="VK">
            <VkIcon />
          </a>
        </div>
        <Link href="/contacts">Связаться с нами →</Link>
      </div>
      <small>
        <span>© 2026 Phygital Core</span>
        <b>СОЕДИНЯЕМ РЕАЛЬНОСТЬ И ЦИФРОВОЙ МИР ///</b>
      </small>
    </footer>
  );
}
