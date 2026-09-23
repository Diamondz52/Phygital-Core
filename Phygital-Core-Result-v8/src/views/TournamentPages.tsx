"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { Badge, DemoForm, EmptyState, Field, GlowButton, Modal, PageHeader, TextareaField } from "@/shared/ui";
import { teams, tournaments, tournamentStatus, type Tournament } from "@/entities";
import { useAuth, useAuthModal } from "@/features/auth";
import { saveRecord } from "@/shared/storage";
import { useApp } from "@/shared/providers";

const statusLabel = { upcoming: "Предстоящий", active: "Идёт", completed: "Завершён" } as const;

export function TournamentsPage() {
  const [apply,setApply]=useState<Tournament|null>(null),[teamRequest,setTeamRequest]=useState(false);
  const {notify}=useApp();
  return <>
    <PageHeader eyebrow="СОРЕВНОВАНИЯ НОВОГО ПОКОЛЕНИЯ" title="Турниры" description="Все доступные турниры на одной странице." visual={<Trophy/>}/>
    <section className="content-section tournaments-list"><h2>ВСЕ ТУРНИРЫ</h2>{tournaments.length?tournaments.map(tournament=>{const status=tournamentStatus(tournament);return <article className="tournament-card glass" key={tournament.id}><div className="tournament-image"><img src="/trophy-arena.webp" alt="Кубок фиджитал-турнира"/></div><div><Badge tone={status==="active"?"green":status==="completed"?"red":"blue"}>{statusLabel[status]}</Badge><h3>{tournament.name}</h3><p className="facts"><span><CalendarDays/>{new Date(tournament.startAt).toLocaleDateString("ru-RU")}</span><span><MapPin/>{tournament.city}</span></p><p>{tournament.description}</p><div className="card-actions"><button className="secondary" disabled title="Страница турнира появится позже">Страница турнира — скоро</button>{status!=="completed"&&<GlowButton onClick={()=>setApply(tournament)}>Зарегистрировать команду →</GlowButton>}</div></div></article>}):<EmptyState/>}</section>
    {apply&&<TournamentApplication tournament={apply} close={()=>setApply(null)} createTeam={()=>{setApply(null);setTeamRequest(true)}} success={async(teamId)=>{await saveRecord("last-tournament-application",{teamId,tournamentId:apply.id,createdAt:new Date().toISOString()});setApply(null);notify("Заявка на турнир отправлена")}}/>}
    {teamRequest&&<TeamRequest close={()=>setTeamRequest(false)} success={async()=>{await saveRecord("last-team-application",{createdAt:new Date().toISOString()});setTeamRequest(false);notify("Заявка на создание команды отправлена")}}/>}
  </>;
}

function TournamentApplication({tournament,close,createTeam,success}:{tournament:Tournament;close:()=>void;createTeam:()=>void;success:(teamId:string)=>void|Promise<void>}){
  const{user}=useAuth();
  const{openAuth}=useAuthModal();
  const available=user?teams.filter(team=>team.members.some(member=>member.id===user.id&&member.captain)):[];
  const[selected,setSelected]=useState(available[0]?.id??"");
  return <Modal title="ЗАЯВКА НА ТУРНИР" subtitle={tournament.name} onClose={close}>{!user?<div className="form-empty"><h3>Требуется авторизация</h3><p>Войдите в аккаунт капитана, чтобы подать заявку от имени команды.</p><button className="primary" onClick={()=>{close();openAuth("login","/tournaments")}}>Войти</button></div>:!available.length?<div className="form-empty"><h3>У вас нет команд, от имени которых вы можете подать заявку.</h3><p>Подать заявку на турнир может только капитан команды.</p><button className="primary" onClick={createTeam}>Создать команду</button><button className="secondary" onClick={close}>Отмена</button></div>:<DemoForm onSuccess={()=>success(selected)} submit="Отправить заявку" cancel="Отмена" onCancel={close}><label>Команда <b className="required">*</b><select required value={selected} onChange={event=>setSelected(event.target.value)}>{available.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><TextareaField label="Дополнительная информация"/></DemoForm>}</Modal>
}

function TeamRequest({close,success}:{close:()=>void;success:()=>void|Promise<void>}){
  return <Modal title="Создание команды" subtitle="Все участники должны быть зарегистрированы на сайте." onClose={close}><DemoForm onSuccess={success} submit="Отправить" cancel="Отмена" onCancel={close}><Field label="Название команды" required/><TextareaField label="Участники команды" required/></DemoForm></Modal>
}
