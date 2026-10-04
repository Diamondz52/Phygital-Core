"use client";

import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { CircleUserRound, Flag, Plus, RefreshCw, Search, Send, X } from "lucide-react";
import type { Team, User } from "@/entities";
import { useAdminStore } from "@/features/admin-management";
import { useAuth, useAuthModal } from "@/features/auth";
import { useApp } from "@/shared/providers";
import { Badge, GlowButton, Modal, PageHeader, SecondaryButton } from "@/shared/ui";

function participants(count:number){const mod10=count%10,mod100=count%100;return `${count} ${mod10===1&&mod100!==11?"участник":mod10>=2&&mod10<=4&&(mod100<12||mod100>14)?"участника":"участников"}`}
function maskPhone(phone:string){const digits=phone.replace(/\D/g,"");if(digits.length<6)return phone||"Телефон не указан";return `+${digits[0]} ${digits.slice(1,4)} *** ** ${digits.slice(-2)}`}
function normalized(value:string){return value.toLocaleLowerCase("ru-RU").replace(/\s+/g," ").trim()}
function phoneDigits(value:string){return value.replace(/\D/g,"")}

export function TeamsPage(){
  const store=useAdminStore();
  const {user}=useAuth();
  const {openAuth}=useAuthModal();
  const {notify}=useApp();
  const[selectedId,setSelectedId]=useState<string|null>(null),[create,setCreate]=useState(false),[inviteTeamId,setInviteTeamId]=useState<string|null>(null);
  const selected=store.state.teams.find(team=>team.id===selectedId)??null;
  const inviteTeam=store.state.teams.find(team=>team.id===inviteTeamId)??null;
  const canInvite=Boolean(user&&selected?.members.some(member=>member.id===user.id&&member.captain));
  const startCreate=()=>{if(!user){openAuth("login");return}setCreate(true)};
  return <><PageHeader eyebrow="ЕДИНЫЙ РИТМ" title="Команды" description="Создавайте составы и приглашайте зарегистрированных игроков." visual={<Flag/>}/><section className="content-section teams-grid teams-grid-final"><div><div className="section-heading"><div><p className="eyebrow">СООБЩЕСТВО</p><h2>Команды платформы</h2></div><GlowButton onClick={startCreate}><Plus/>Создать команду</GlowButton></div><div className="team-list">{store.state.teams.map((team,index)=><button className={`team-card glass ${selected?.id===team.id?"selected":""}`} key={team.id} onClick={()=>setSelectedId(team.id)}><span className="team-logo">{String(index+1).padStart(2,"0")}</span><span><b>{team.name}</b><small>{participants(team.members.length)}</small></span><span>→</span></button>)}</div></div>{selected?<aside className="team-drawer glass"><button onClick={()=>setSelectedId(null)} aria-label="Закрыть"><X/></button><p className="eyebrow">ПРОФИЛЬ КОМАНДЫ</p><h2>{selected.name}</h2><p className="team-count">{participants(selected.members.length)}</p>{selected.members.map(member=><div className="member" key={member.id}><CircleUserRound/><span>{member.name}</span>{member.captain&&<Badge>Капитан</Badge>}</div>)}{canInvite&&<button className="primary invite-team-button" onClick={()=>setInviteTeamId(selected.id)}><Plus/> Пригласить игрока</button>}</aside>:<aside className="team-drawer team-empty glass"><Flag/><h3>Выберите команду</h3><p>Откроем профиль, участников и капитана.</p></aside>}</section>{create&&<CreateTeamModal close={()=>setCreate(false)} create={async name=>{const team=await store.createCaptainTeam(name);setCreate(false);setSelectedId(team.id);setInviteTeamId(team.id);notify("Команда создана. Теперь пригласите игроков")}}/>}{inviteTeam&&<InvitePlayersModal team={inviteTeam} close={()=>setInviteTeamId(null)} notify={notify}/>}</>;
}

function CreateTeamModal({close,create}:{close:()=>void;create:(name:string)=>Promise<void>}){
  const[name,setName]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const submit=async(event:FormEvent)=>{event.preventDefault();if(busy)return;setBusy(true);setError("");try{await create(name)}catch(reason){setError(reason instanceof Error?reason.message:"Не удалось создать команду")}finally{setBusy(false)}};
  return <Modal title="Создание команды" subtitle="Сначала создайте команду — затем приглашайте игроков из базы пользователей." onClose={close} busy={busy}><form onSubmit={submit}><label>Название команды <b className="required">*</b><input autoFocus value={name} onChange={event=>setName(event.target.value)} maxLength={80} required placeholder="Например, Neon Pulse"/></label>{error&&<p className="form-error" role="alert">{error}</p>}<div className="form-actions"><SecondaryButton type="button" onClick={close} disabled={busy}>Отмена</SecondaryButton><button className="primary" disabled={busy}>{busy?"Создание…":"Создать команду"}</button></div></form></Modal>;
}

function InvitePlayersModal({team,close,notify}:{team:Team;close:()=>void;notify:(message:string)=>void}){
  const store=useAdminStore();
  const {user}=useAuth();
  const[query,setQuery]=useState(""),[failed,setFailed]=useState(false),[busy,setBusy]=useState("");
  const debounced=useDeferredValue(query),loading=debounced!==query;
  const results=useMemo(()=>{
    const words=normalized(debounced),digits=phoneDigits(debounced);
    if(!words&&!digits)return [];
    return store.state.users.filter(candidate=>candidate.id!==user?.id&&candidate.role!=="ADMIN"&&(normalized(`${candidate.firstName} ${candidate.lastName}`).includes(words)||(digits.length>=2&&phoneDigits(candidate.phone).includes(digits))));
  },[debounced,store.state.users,user?.id]);
  const statusFor=(candidate:User)=>{if(team.members.some(member=>member.id===candidate.id))return"member";const latest=store.state.invitations.find(item=>item.teamId===team.id&&item.recipientId===candidate.id);return latest?.status??"available"};
  const invite=async(candidate:User)=>{if(busy)return;setBusy(candidate.id);try{await store.sendInvitation(team.id,candidate.id);notify(`Приглашение для ${candidate.firstName} отправлено`)}catch(reason){notify(reason instanceof Error?reason.message:"Не удалось отправить приглашение")}finally{setBusy("")}};
  const invitations=store.state.invitations.filter(item=>item.teamId===team.id);
  const retry=()=>setFailed(false);
  return <Modal title={`Пригласить в ${team.name}`} subtitle="Игрок войдёт в состав только после принятия приглашения." onClose={close} busy={Boolean(busy)}><section className="player-search"><label className="search-field"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск игрока по имени или телефону" autoFocus/></label>{loading&&<p className="loading-line">Ищем зарегистрированных пользователей…</p>}{failed&&<div className="search-state"><p className="form-error">Не удалось загрузить результаты.</p><button className="secondary" onClick={retry}><RefreshCw/>Повторить</button></div>}{!loading&&!failed&&query.trim()&&!results.length&&<p className="search-state">Ничего не найдено. Проверьте имя или номер телефона.</p>}<div className="invite-results">{!loading&&results.map(candidate=>{const status=statusFor(candidate);return <div className="invite-result" key={candidate.id}><CircleUserRound/><span><b>{candidate.firstName} {candidate.lastName}</b><small>{maskPhone(candidate.phone)}</small></span>{status==="available"||status==="declined"||status==="cancelled"?<button className="secondary" disabled={Boolean(busy)} onClick={()=>void invite(candidate)}><Send/>{busy===candidate.id?"Отправка…":"Пригласить"}</button>:<Badge tone={status==="accepted"||status==="member"?"green":"blue"}>{status==="member"||status==="accepted"?"Уже в составе":"Уже приглашён"}</Badge>}</div>})}</div>{invitations.length>0&&<div className="invitation-history"><h3>Приглашения</h3>{invitations.map(invitation=>{const recipient=store.state.users.find(item=>item.id===invitation.recipientId);return <div key={invitation.id}><span>{recipient?`${recipient.firstName} ${recipient.lastName}`:"Пользователь"}</span><Badge tone={invitation.status==="accepted"?"green":invitation.status==="declined"||invitation.status==="cancelled"?"red":"blue"}>{invitation.status==="pending"?"Ожидает ответа":invitation.status==="accepted"?"Принято":invitation.status==="declined"?"Отклонено":"Отменено"}</Badge>{invitation.status==="pending"&&<button className="text-button" onClick={()=>void store.cancelInvitation(invitation.id)}>Отменить</button>}</div>})}</div>}</section></Modal>;
}
