/* Optimized local WebP assets are rendered directly for Vinext dev compatibility. */
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { ArrowRight, CalendarDays, Gamepad2, MapPin, RadioTower, ShieldCheck, Sparkles, Trophy, UsersRound, Zap } from "lucide-react";
import { tournaments } from "@/entities";
import { EmptyState, Reveal } from "@/shared/ui";

const benefits = [
  { icon: Trophy, number: "01", title: "Два этапа — один результат", text: "Физическая дисциплина и цифровая арена формируют общий итог команды." },
  { icon: UsersRound, number: "02", title: "Команда в центре", text: "Создавайте состав, выбирайте капитана и подавайте заявки без лишних шагов." },
  { icon: RadioTower, number: "03", title: "Всё под контролем", text: "Статусы турниров, составы и решения организаторов доступны в одном интерфейсе." },
];
const values = ["REAL SKILLS", "DIGITAL WINS", "ONE TEAM", "PHYGITAL CORE"];

export function HomePage() {
  const nearest = tournaments[0];
  return <>
    <section className="home-hero">
      <div className="hero-copy reveal"><p className="eyebrow">ФИЗИЧЕСКИЙ СПОРТ × DIGITAL</p><h1>Игра начинается<br/><span>за пределами экрана</span></h1><p>Phygital Core объединяет реальные дисциплины, киберспорт и командную стратегию в соревнованиях нового поколения.</p><div className="hero-actions"><Link className="primary" href="/tournaments">Найти турнир <ArrowRight/></Link><Link className="secondary" href="/teams">Собрать команду</Link></div><div className="hero-metrics"><span><b>12</b> турниров</span><span><b>86</b> команд</span><span><b>1 248</b> участников</span></div></div>
      <div className="hero-art" aria-hidden="true"/><div className="hero-orbit" aria-hidden="true"><i/><i/><i/></div>
      <div className="hero-signal signal-live" aria-hidden="true"><span/><small>LIVE SIGNAL</small><b>ARENA 01</b></div><div className="hero-signal signal-mode" aria-hidden="true"><Sparkles/><small>DUAL MODE</small><b>REAL + DIGITAL</b></div><div className="hero-coordinates" aria-hidden="true">56.83° N · 60.59° E</div>
    </section>
    <section className="home-marquee" aria-label="Ценности Phygital Core"><div className="marquee-track">{[0,1].map(copy=><div className="marquee-group" aria-hidden={copy===1} key={copy}>{values.map(value=><span key={value}>{value}<i>◆</i></span>)}</div>)}</div></section>
    <Reveal><section className="content-section signal-grid" aria-label="Платформа в цифрах"><article><small>01 / COMMUNITY</small><strong>1 248</strong><span>участников в общей экосистеме</span></article><article><small>02 / MATCH FLOW</small><strong>2×</strong><span>реальный и цифровой этап</span></article><article><small>03 / CONTROL</small><strong>24/7</strong><span>доступ к статусам и составам</span></article><article><small>04 / LOCATION</small><strong>EKB</strong><span>точка притяжения сообщества</span></article></section></Reveal>
    <Reveal><section className="content-section experience"><div className="section-heading"><div><p className="eyebrow">КАК ЭТО РАБОТАЕТ</p><h2>Одна платформа.<br/>Два мира.</h2></div><p>Всё, что нужно участнику: от знакомства с турниром до подтверждённой заявки команды.</p></div><div className="benefit-grid">{benefits.map(({icon:Icon,number,title,text})=><article className="benefit-card glass" key={number}><span>{number}</span><Icon/><h3>{title}</h3><p>{text}</p></article>)}</div></section></Reveal>
    <Reveal><section className="content-section arena-story"><div className="arena-image"><img src="/team-arena.webp" alt="Команда фиджитал-спортсменов на технологичной арене"/></div><div><p className="eyebrow">СИЛА КОМАНДЫ</p><h2>Побеждают те, кто действует вместе</h2><p>Пригласите зарегистрированных игроков, назначьте капитана и следите за участием команды из личного кабинета.</p><ul><li><ShieldCheck/>Прозрачные роли и состав</li><li><Gamepad2/>Физический и цифровой этапы</li><li><Zap/>Быстрая подача заявок</li></ul><Link className="secondary" href="/teams">Посмотреть команды <ArrowRight/></Link></div></section></Reveal>
    <Reveal><section className="content-section nearest"><div><p className="eyebrow">СЛЕДУЮЩАЯ ОСТАНОВКА</p><h2>Ближайший турнир</h2><p>Откройте страницу события, изучите формат и подайте заявку существующей командой.</p></div>{nearest?<article className="nearest-card glass"><div className="trophy-art"><img src="/trophy-arena.webp" alt="Футуристический кубок турнира"/></div><div><p className="facts"><span><CalendarDays/>25–27 октября 2027</span><span><MapPin/>{nearest.city}</span></p><h3>{nearest.name}</h3><p>{nearest.shortDescription}</p><Link className="primary" href={`/tournaments/${nearest.id}`}>Перейти к турниру <ArrowRight/></Link></div></article>:<EmptyState title="Ближайших турниров пока нет"/>}</section></Reveal>
    <Reveal><section className="content-section final-cta glass"><div><p className="eyebrow">ВАШ ХОД</p><h2>Готовы выйти на арену?</h2><p>Создайте аккаунт, соберите команду и выберите первое соревнование.</p></div><div><Link className="primary" href="/register">Начать участие <ArrowRight/></Link><Link className="secondary" href="/faq">Задать вопрос</Link></div></section></Reveal>
  </>;
}
