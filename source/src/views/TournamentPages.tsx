"use client";
/* Optimized local WebP assets are rendered directly for Vinext dev compatibility. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { Badge, DemoForm, EmptyState, GlowButton, Modal, PageHero, TextareaField } from "@/shared/ui";
import { teams, tournaments, tournamentStatus } from "@/entities";
import { saveRecord } from "@/shared/storage";
import { useApp } from "@/shared/providers";

const statusLabel = { upcoming: "Предстоящий", active: "Идёт", completed: "Завершён" } as const;

export function TournamentsPage() {
  const [apply, setApply] = useState(false);
  const { notify } = useApp();
  return <>
    <PageHero eyebrow="СОРЕВНОВАНИЯ НОВОГО ПОКОЛЕНИЯ" title="ТУРНИРЫ" description="Все доступные турниры на одной странице. Изучай дисциплины, правила и формат." visual={<Trophy/>}/>
    <section className="content-section"><h2>ВСЕ ТУРНИРЫ</h2>{tournaments.length ? tournaments.map(tournament => {
      const status = tournamentStatus(tournament);
      return <article className="tournament-card glass" key={tournament.id}><div className="tournament-image"><img src="/trophy-arena.webp" alt="Кубок фиджитал-турнира"/></div><div><Badge tone={status === "active" ? "green" : status === "completed" ? "red" : "blue"}>{statusLabel[status]}</Badge><small>{tournament.publicNumber}</small><h3>{tournament.name}</h3><p className="facts"><span><CalendarDays/>{new Date(tournament.startAt).toLocaleDateString("ru-RU")}</span><span><MapPin/>{tournament.city}</span></p><p>{tournament.description}</p><div className="card-actions"><Link className="secondary" href={`/tournaments/${tournament.id}`}>Страница турнира</Link>{status !== "completed" && <GlowButton onClick={() => setApply(true)}>Зарегистрировать команду →</GlowButton>}</div></div></article>;
    }) : <EmptyState/>}</section>
    {apply && <TournamentApplication close={() => setApply(false)} success={async () => { await saveRecord("last-tournament-application", { teamId: teams[0].id, createdAt: new Date().toISOString() }); setApply(false); notify("Заявка на турнир отправлена"); }}/>} 
  </>;
}

export function TournamentDetail({ id }: { id: string }) {
  const tournament = tournaments.find(item => item.id === id) ?? tournaments[0];
  const [apply, setApply] = useState(false);
  const { notify } = useApp();
  const status = tournamentStatus(tournament);
  return <><PageHero eyebrow={tournament.publicNumber} title={tournament.name.toUpperCase()} description={tournament.shortDescription} visual={<Trophy/>}/><section className="content-section detail-grid"><article className="panel glass"><Badge tone={status === "completed" ? "red" : "green"}>{statusLabel[status]}</Badge><h2>О турнире</h2><p>{tournament.description}</p><h3>Правила и требования</h3><ul>{tournament.rules.map(rule => <li key={rule}>{rule}</li>)}</ul></article><aside className="panel glass"><h3>{new Date(tournament.startAt).toLocaleDateString("ru-RU")} — {new Date(tournament.endAt).toLocaleDateString("ru-RU")}</h3><p><MapPin/> {tournament.city}, {tournament.venue}</p><p>Дисциплина: {tournament.discipline}</p><p>Формат: {tournament.format}</p>{status === "completed" ? <p className="notice">Регистрация завершена</p> : <GlowButton onClick={() => setApply(true)}>Подать заявку →</GlowButton>}</aside></section>{apply && <TournamentApplication close={() => setApply(false)} success={() => { setApply(false); notify("Заявка на турнир отправлена"); }}/>}</>;
}

function TournamentApplication({ close, success }: { close: () => void; success: () => void }) {
  const [selected, setSelected] = useState(teams[0]?.id ?? "");
  const team = teams.find(item => item.id === selected);
  return <Modal title="ЗАЯВКА НА ТУРНИР" subtitle="Капитан определяется автоматически по составу выбранной команды." onClose={close}><DemoForm onSuccess={success} submit="Отправить заявку" cancel="Отмена" onCancel={close}><label>Команда<select required value={selected} onChange={event => setSelected(event.target.value)}>{teams.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>{team && <p className="form-hint">Заявку отправляет капитан: <b>{team.members.find(member => member.captain)?.name}</b></p>}<TextareaField label="Дополнительная информация"/></DemoForm></Modal>;
}
