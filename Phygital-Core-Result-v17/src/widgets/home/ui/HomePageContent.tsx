"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Gamepad2,
  Headphones,
  MapPin,
  ShieldCheck,
  Trophy,
  UsersRound,
  Zap,
} from "lucide-react";
import { tournamentStatus } from "@/entities/tournament";
import { usePlatformStore } from "@/entities/platform";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Reveal } from "@/shared/ui";

const benefits = [
  {
    icon: Trophy,
    number: "01",
    title: "Два этапа — один результат",
    text: "Физическая дисциплина и цифровая арена формируют общий итог команды.",
  },
  {
    icon: UsersRound,
    number: "02",
    title: "Команда в центре",
    text: "Создавайте состав, выбирайте капитана и подавайте заявки без лишних шагов.",
  },
  {
    icon: Headphones,
    number: "03",
    title: "На связи 24/7",
    text: "Задавайте вопросы и получайте поддержку от организаторов в любое время.",
  },
];

export function HomePageContent() {
  const { state } = usePlatformStore();
  const nearest = state.tournaments
    .filter((item) => tournamentStatus(item) !== "completed")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())[0];
  return (
    <>
      <section className="home-hero home-hero-core">
        <div className="hero-grid" aria-hidden="true" />
        <div className="hero-glow hero-glow-one" aria-hidden="true" />
        <div className="hero-glow hero-glow-two" aria-hidden="true" />
        <div className="hero-particles" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} />
          ))}
        </div>
        <div className="hero-copy">
          <p className="eyebrow hero-step hero-step-one">ФИЗИЧЕСКИЙ СПОРТ × DIGITAL</p>
          <h1 className="hero-step hero-step-two">
            Игра начинается
            <br />
            <span>за пределами экрана</span>
          </h1>
          <p className="hero-step hero-step-three">
            Phygital Core объединяет реальные дисциплины, цифровую арену и командную стратегию в
            соревнованиях нового поколения.
          </p>
          <div className="hero-actions hero-step hero-step-four">
            <Link className="primary" href="/tournaments">
              Найти турнир <ArrowRight />
            </Link>
            <Link className="secondary white-hover" href="/teams">
              Собрать команду
            </Link>
          </div>
        </div>
        <div className="hero-core-visual" aria-hidden="true">
          <img src="/hero.webp" alt="" />
          <span className="hero-ring hero-ring-one" />
          <span className="hero-ring hero-ring-two" />
          <span className="hero-coordinate coordinate-one">56.8380° N</span>
          <span className="hero-coordinate coordinate-two">CORE / 2027</span>
          <span className="hero-visual-label">
            <b>REAL</b>
            <i />
            DIGITAL
          </span>
        </div>
      </section>
      <section className="phygital-system" aria-label="Формула Phygital Core">
        <div className="system-label">
          <span>PHYGITAL SYSTEM</span>
          <small>ACTIVE / 01</small>
        </div>
        <div className="system-sequence" aria-hidden="true">
          <span>REAL SPORT</span>
          <b>+</b>
          <span>DIGITAL</span>
          <b>=</b>
          <strong>PHYGITAL</strong>
        </div>
        <p className="sr-only">Реальный спорт плюс digital — это Phygital.</p>
        <div className="system-signal" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </div>
      </section>
      <Reveal>
        <section className="content-section experience compact-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">КАК ЭТО РАБОТАЕТ</p>
              <h2>Одна платформа. Два мира.</h2>
            </div>
          </div>
          <div className="benefit-grid">
            {benefits.map(({ icon: Icon, number, title, text }) => (
              <article className="benefit-card glass" key={number}>
                <span>{number}</span>
                <Icon />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>
      <Reveal>
        <section className="content-section arena-story compact-section">
          <div className="arena-image">
            <img src="/team-arena.webp" alt="Команда фиджитал-спортсменов на технологичной арене" />
          </div>
          <div>
            <p className="eyebrow">СИЛА КОМАНДЫ</p>
            <h2>Побеждают те, кто действует вместе</h2>
            <p>
              Пригласите зарегистрированных игроков, назначьте капитана и следите за участием
              команды из личного кабинета.
            </p>
            <ul>
              <li>
                <ShieldCheck />
                Прозрачные роли и состав
              </li>
              <li>
                <Gamepad2 />
                Физический и цифровой этапы
              </li>
              <li>
                <Zap />
                Быстрая подача заявок
              </li>
            </ul>
            <Link className="secondary white-hover" href="/teams">
              Посмотреть команды <ArrowRight />
            </Link>
          </div>
        </section>
      </Reveal>
      <Reveal>
        <section className="content-section nearest compact-section">
          <div>
            <p className="eyebrow">СЛЕДУЮЩАЯ ОСТАНОВКА</p>
            <h2>Ближайший турнир</h2>
            <p>Изучите формат и подайте заявку существующей командой.</p>
          </div>
          {nearest ? (
            <article className="nearest-card glass">
              <div className="trophy-art">
                <img
                  src={nearest.imageUrl || "/trophy-arena.webp"}
                  alt="Футуристический кубок турнира"
                />
              </div>
              <div>
                <p className="facts">
                  <span>
                    <CalendarDays />
                    {new Date(nearest.startAt).toLocaleDateString("ru-RU")}
                  </span>
                  <span>
                    <MapPin />
                    {nearest.city}
                  </span>
                </p>
                <h3>{nearest.name}</h3>
                <p>{nearest.shortDescription}</p>
                <div className="card-actions">
                  <Link className="primary" href="/tournaments">
                    Все турниры <ArrowRight />
                  </Link>
                </div>
              </div>
            </article>
          ) : (
            <EmptyState title="Ближайших турниров пока нет" />
          )}
        </section>
      </Reveal>
      <Reveal>
        <section className="content-section final-cta glass">
          <div>
            <p className="eyebrow">ВАШ ХОД</p>
            <h2>Готовы выйти на арену?</h2>
            <p>Войдите в аккаунт, соберите команду и выберите первое соревнование.</p>
          </div>
          <div>
            <Link className="primary" href="/teams">
              Начать участие <ArrowRight />
            </Link>
            <Link className="secondary white-hover" href="/faq">
              Задать вопрос
            </Link>
          </div>
        </section>
      </Reveal>
    </>
  );
}
