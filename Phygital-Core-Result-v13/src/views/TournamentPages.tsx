"use client";
/* eslint-disable @next/next/no-img-element */

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { tournamentStatus, type Tournament } from "@/entities";
import { useAdminStore } from "@/features/admin-management";
import { useAuth, useAuthModal } from "@/features/auth";
import { useApp } from "@/shared/providers";
import { Badge, EmptyState, GlowButton, Modal, PageHeader, SecondaryButton } from "@/shared/ui";

const statusLabel={upcoming:"Предстоящий",active:"Идёт",completed:"Завершён"} as const;
export function TournamentsPage(){
  const store=useAdminStore();
  const[apply,setApply]=useState<Tournament|null>(null);
  const{notify}=useApp();
  return <><PageHeader eyebrow="СОРЕВНОВАНИЯ НОВОГО ПОКОЛЕНИЯ" title="Турниры" description="Все доступные турниры на одной странице." visual={<Trophy/>}/><section className="content-section tournaments-list"><h2>ВСЕ ТУРНИРЫ</h2>{store.state.tournaments.length?store.state.tournaments.map(tournament=>{const status=tournamentStatus(tournament);return <article className="tournament-card glass" key={tournament.id}><div className="tournament-image"><img src="/trophy-arena.webp" alt="Кубок фиджитал-турнира"/></div><div><Badge tone={status==="active"?"green":status==="completed"?"red":"blue"}>{statusLabel[status]}</Badge><h3>{tournament.name}</h3><p className="facts"><span><CalendarDays/>{new Date(tournament.startAt).toLocaleDateString("ru-RU")}</span><span><MapPin/>{tournament.city}</span></p><p>{tournament.description}</p><div className="card-actions"><button className="secondary" disabled>Страница турнира — скоро</button>{status!=="completed"&&<GlowButton onClick={()=>setApply(tournament)}>Зарегистрировать команду →</GlowButton>}</div></div></article>}):<EmptyState/>}</section>{apply&&<TournamentApplication tournament={apply} close={()=>setApply(null)} success={()=>{setApply(null);notify("Заявка на турнир отправлена")}}/>}</>;
}

function TournamentApplication({tournament,close,success}:{tournament:Tournament;close:()=>void;success:()=>void}){
  const{user}=useAuth(),{openAuth}=useAuthModal(),store=useAdminStore(),router=useRouter();
  const available=user?store.state.teams.filter(team=>team.members.some(member=>member.id===user.id&&member.captain)):[];
  const[selected,setSelected]=useState(available[0]?.id??""),[info,setInfo]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const submit=async(event:FormEvent)=>{event.preventDefault();if(busy)return;setBusy(true);setError("");try{await store.submitTournamentApplication(selected,tournament.id,info);success()}catch(reason){setError(reason instanceof Error?reason.message:"Не удалось отправить заявку")}finally{setBusy(false)}};
  return <Modal title="ЗАЯВКА НА ТУРНИР" subtitle={tournament.name} onClose={close} busy={busy}>{!user?<div className="form-empty"><h3>Требуется авторизация</h3><p>Войдите в аккаунт, чтобы система проверила право подачи заявки.</p><button className="primary" onClick={()=>{close();openAuth("login","/tournaments")}}>Войти</button></div>:!available.length?<div className="form-empty"><h3>Нет доступной команды</h3><p>Заявку может подать только капитан существующей команды.</p><button className="primary" onClick={()=>router.push("/teams")}>Перейти к командам</button><button className="secondary" onClick={close}>Отмена</button></div>:<form onSubmit={submit}><label>Команда <b className="required">*</b><select required value={selected} onChange={event=>setSelected(event.target.value)}>{available.map(item=><option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Дополнительная информация <small>необязательно</small><textarea maxLength={500} value={info} onChange={event=>setInfo(event.target.value)} placeholder="Сообщение организатору"/><small>{info.length}/500</small></label>{error&&<p className="form-error">{error}</p>}<div className="form-actions"><SecondaryButton type="button" onClick={close}>Отмена</SecondaryButton><button className="primary" disabled={busy}>{busy?"Отправка…":"Отправить заявку"}</button></div></form>}</Modal>;
}
