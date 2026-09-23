"use client";
/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, CalendarDays, Gamepad2, Headphones, MapPin, ShieldCheck, Trophy, UsersRound, Zap } from "lucide-react";
import { tournaments } from "@/entities";
import { useAuth } from "@/features/auth";
import { EmptyState, Modal, Reveal } from "@/shared/ui";
import { useApp } from "@/shared/providers";

const benefits = [
  { icon: Trophy, number: "01", title: "Два этапа — один результат", text: "Физическая дисциплина и цифровая арена формируют общий итог команды." },
  { icon: UsersRound, number: "02", title: "Команда в центре", text: "Создавайте состав, выбирайте капитана и подавайте заявки без лишних шагов." },
  { icon: Headphones, number: "03", title: "На связи 24/7", text: "Задавайте вопросы и получайте поддержку от организаторов в любое время." },
];
const values = ["REAL SKILLS", "DIGITAL WINS", "ONE TEAM", "PHYGITAL CORE"];

export function HomePage() {
  const nearest = tournaments[0];
  const [loginOpen,setLoginOpen]=useState(false);
  return <>
    <section className="home-hero home-hero-final"><div className="hero-copy reveal"><p className="eyebrow">ФИЗИЧЕСКИЙ СПОРТ × DIGITAL</p><h1>Игра начинается<br/><span>за пределами экрана</span></h1><p>Phygital Core объединяет реальные дисциплины, киберспорт и командную стратегию в соревнованиях нового поколения.</p><div className="hero-actions"><Link className="primary" href="/tournaments">Найти турнир <ArrowRight/></Link><Link className="secondary" href="/teams">Собрать команду</Link></div></div><div className="hero-art" aria-hidden="true"/><div className="hero-orbit" aria-hidden="true"><i/><i/><i/></div></section>
    <section className="home-marquee" aria-label="Ценности Phygital Core"><div className="marquee-track">{[0,1].map(copy=><div className="marquee-group" aria-hidden={copy===1} key={copy}>{values.map(value=><span key={value}>{value}<i>◆</i></span>)}</div>)}</div></section>
    <Reveal><section className="content-section experience compact-section"><div className="section-heading"><div><p className="eyebrow">КАК ЭТО РАБОТАЕТ</p><h2>Одна платформа. Два мира.</h2></div></div><div className="benefit-grid">{benefits.map(({icon:Icon,number,title,text})=><article className="benefit-card glass" key={number}><span>{number}</span><Icon/><h3>{title}</h3><p>{text}</p></article>)}</div></section></Reveal>
    <Reveal><section className="content-section arena-story compact-section"><div className="arena-image"><img src="/team-arena.webp" alt="Команда фиджитал-спортсменов на технологичной арене"/></div><div><p className="eyebrow">СИЛА КОМАНДЫ</p><h2>Побеждают те, кто действует вместе</h2><p>Пригласите зарегистрированных игроков, назначьте капитана и следите за участием команды из личного кабинета.</p><ul><li><ShieldCheck/>Прозрачные роли и состав</li><li><Gamepad2/>Физический и цифровой этапы</li><li><Zap/>Быстрая подача заявок</li></ul><Link className="secondary" href="/teams">Посмотреть команды <ArrowRight/></Link></div></section></Reveal>
    <Reveal><section className="content-section nearest compact-section"><div><p className="eyebrow">СЛЕДУЮЩАЯ ОСТАНОВКА</p><h2>Ближайший турнир</h2><p>Изучите формат и подайте заявку существующей командой.</p></div>{nearest?<article className="nearest-card glass"><div className="trophy-art"><img src="/trophy-arena.webp" alt="Футуристический кубок турнира"/></div><div><p className="facts"><span><CalendarDays/>25–27 октября 2027</span><span><MapPin/>{nearest.city}</span></p><h3>{nearest.name}</h3><p>{nearest.shortDescription}</p><button className="secondary" disabled title="Страница турнира появится позже">Страница турнира — скоро</button></div></article>:<EmptyState title="Ближайших турниров пока нет"/>}</section></Reveal>
    <Reveal><section className="content-section final-cta glass"><div><p className="eyebrow">ВАШ ХОД</p><h2>Готовы выйти на арену?</h2><p>Войдите в аккаунт, соберите команду и выберите первое соревнование.</p></div><div><button className="primary" onClick={()=>setLoginOpen(true)}>Начать участие <ArrowRight/></button><Link className="secondary" href="/faq">Задать вопрос</Link></div></section></Reveal>
    {loginOpen&&<LoginModal close={()=>setLoginOpen(false)}/>} 
  </>;
}

function LoginModal({close}:{close:()=>void}){
  const {login}=useAuth(),{notify}=useApp(),router=useRouter();
  const[busy,setBusy]=useState(false),[error,setError]=useState("");
  const submit=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(busy)return;const data=new FormData(event.currentTarget),email=String(data.get("email")||"").trim(),password=String(data.get("password")||"");setError("");if(!/^\S+@\S+\.\S+$/.test(email))return setError("Введите корректный email");if(password.length<8)return setError("Пароль должен содержать не менее 8 символов");setBusy(true);try{const user=await login(email,password);notify("Вход выполнен");close();router.push(user.role==="ADMIN"?"/admin":"/profile")}catch(reason){setError(reason instanceof Error?reason.message:"Не удалось выполнить вход")}finally{setBusy(false)}};
  return <Modal title="Вход" subtitle="Войдите, чтобы управлять командами и заявками." onClose={close} busy={busy}><form onSubmit={submit}><label>Email <b className="required">*</b><input name="email" type="email" autoComplete="email" required/></label><label>Пароль <b className="required">*</b><input name="password" type="password" minLength={8} autoComplete="current-password" required/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button className="primary modal-submit" disabled={busy}>{busy?"Проверяем…":"Войти"}</button><Link className="text-link" href="/register" onClick={close}>Нет аккаунта? Зарегистрироваться</Link></form></Modal>
}
