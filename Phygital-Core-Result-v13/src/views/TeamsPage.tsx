"use client";

import { useDeferredValue, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, CircleUserRound, Crown, Plus, RefreshCw, Search, Send, Trash2, UsersRound } from "lucide-react";
import type { Team, User } from "@/entities";
import { useAdminStore } from "@/features/admin-management";
import { useAuth, useAuthModal } from "@/features/auth";
import { useApp } from "@/shared/providers";
import { Badge, GlowButton, Modal, PageHeader, SecondaryButton } from "@/shared/ui";

function participants(count:number){const mod10=count%10,mod100=count%100;return `${count} ${mod10===1&&mod100!==11?"участник":mod10>=2&&mod10<=4&&(mod100<12||mod100>14)?"участника":"участников"}`}
function maskPhone(phone:string){const digits=phone.replace(/\D/g,"");if(digits.length<6)return phone||"Телефон не указан";return `+${digits[0]} ${digits.slice(1,4)} *** ** ${digits.slice(-2)}`}
function normalized(value:string){return value.toLocaleLowerCase("ru-RU").replace(/\s+/g," ").trim()}
function phoneDigits(value:string){return value.replace(/\D/g,"")}
function initials(name:string){return name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join("").toLocaleUpperCase("ru-RU")}

export function TeamsPage(){
  const store=useAdminStore();
  const {user}=useAuth();
  const {openAuth}=useAuthModal();
  const {notify}=useApp();
  const[selectedId,setSelectedId]=useState<string|null>(null),[create,setCreate]=useState(false),[inviteTeamId,setInviteTeamId]=useState<string|null>(null),[teamQuery,setTeamQuery]=useState("");
  const selected=store.state.teams.find(team=>team.id===selectedId)??null;
  const inviteTeam=store.state.teams.find(team=>team.id===inviteTeamId)??null;
  const filtered=store.state.teams.filter(team=>normalized(team.name).includes(normalized(teamQuery)));
  const startCreate=()=>{if(!user){openAuth("login");return}setCreate(true)};
  return <><PageHeader eyebrow="Соберите состав. Найдите своих." title="Команды" description="Выходите на арену вместе. Создавайте команды и приглашайте игроков." variant="teams"/>
    <section className="content-section teams-workspace">
      <div className="teams-toolbar"><div className="teams-toolbar-title"><h2>Все команды</h2><span>{store.state.teams.length} команд</span></div><div className="teams-toolbar-actions"><label className="teams-search"><Search/><input aria-label="Поиск команды" placeholder="Поиск команды" value={teamQuery} onChange={event=>setTeamQuery(event.target.value)}/></label><GlowButton onClick={startCreate}><Plus/>Создать команду</GlowButton></div></div>
      {filtered.length?<div className="team-card-grid">{filtered.map(team=><button className="team-tile" key={team.id} onClick={()=>setSelectedId(team.id)} aria-label={`Открыть команду ${team.name}`}><span className="team-tile-top"><span className="team-monogram">{initials(team.name)}</span><span className="team-tile-count"><UsersRound/>{participants(team.members.length)}</span></span><h3>{team.name}</h3><p>Капитан: <span>{team.members.find(member=>member.captain)?.name??"Не назначен"}</span></p><span className="team-tile-bottom">Открыть команду<ArrowRight/></span></button>)}</div>:<div className="teams-empty"><span className="team-monogram"><UsersRound/></span><h3>{teamQuery?"Команды не найдены":"Команд пока нет"}</h3><p>{teamQuery?"Попробуйте другое название или сбросьте поиск.":"Создайте первую команду и пригласите участников."}</p>{teamQuery?<SecondaryButton onClick={()=>setTeamQuery("")}>Сбросить поиск</SecondaryButton>:<GlowButton onClick={startCreate}><Plus/>Создать команду</GlowButton>}</div>}
      {teamQuery&&filtered.length>0&&<p className="teams-search-summary" role="status">Найдено команд: {filtered.length}</p>}
    </section>
    {selected&&!inviteTeam&&!create&&<TeamProfileModal team={selected} close={()=>setSelectedId(null)} invite={()=>setInviteTeamId(selected.id)}/>}
    {create&&<CreateTeamModal close={()=>setCreate(false)} create={async name=>{const team=await store.createCaptainTeam(name);setCreate(false);setSelectedId(team.id);setInviteTeamId(team.id);notify("Команда создана. Теперь пригласите игроков")}}/>}
    {inviteTeam&&<InvitePlayersModal team={inviteTeam} close={()=>setInviteTeamId(null)} notify={notify}/>}</>;
}

function TeamProfileModal({team,close,invite}:{team:Team;close:()=>void;invite:()=>void}){
  const store=useAdminStore(),{user}=useAuth(),{notify}=useApp();
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[captainId,setCaptainId]=useState(""),[changeCaptain,setChangeCaptain]=useState(false);
  const [confirm,setConfirm]=useState<{kind:"delete"|"remove"|"captain";id?:string;name:string}|null>(null);
  const canManage=Boolean(user&&team.members.some(member=>member.id===user.id&&member.captain));
  const run=async()=>{
    if(!confirm||busy||!canManage)return;setBusy(true);setError("");
    try{
      if(confirm.kind==="delete"){await store.deleteTeam(team.id);notify("Команда удалена");close()}
      if(confirm.kind==="remove"){await store.removeTeamMember(team.id,confirm.id!);notify("Участник удалён из команды")}
      if(confirm.kind==="captain"){await store.assignCaptain(team.id,confirm.id!);notify("Капитан команды изменён");setChangeCaptain(false)}
      setConfirm(null);
    }catch(reason){setError(reason instanceof Error?reason.message:"Не удалось сохранить изменения")}finally{setBusy(false)}
  };
  return <Modal title={team.name} subtitle={participants(team.members.length)} onClose={close} busy={busy}>
    <div className="team-profile-summary"><span className="team-monogram">{initials(team.name)}</span><div><span className="eyebrow">СОСТАВ КОМАНДЫ</span><p>Одна команда. Общая цель.</p></div></div>
    <div className="team-roster">{team.members.map(member=><div className="roster-member" key={member.id}><span className="roster-avatar">{initials(member.name)}</span><span className="roster-name"><b>{member.name}</b><small>{member.captain?"Капитан команды":"Участник"}</small></span>{member.captain?<Badge><Crown/>Капитан</Badge>:canManage&&<button className="icon-button danger-icon" disabled={busy} aria-label={`Удалить игрока ${member.name}`} onClick={()=>{setError("");setConfirm({kind:"remove",id:member.id,name:member.name})}}><Trash2/></button>}</div>)}</div>
    {canManage&&<div className="team-management"><GlowButton onClick={invite} disabled={busy}><Plus/>Пригласить игрока</GlowButton><SecondaryButton onClick={()=>setChangeCaptain(!changeCaptain)} disabled={busy||team.members.length<2}><Crown/>Изменить капитана</SecondaryButton><button className="text-button team-delete" disabled={busy} onClick={()=>{setError("");setConfirm({kind:"delete",name:team.name})}}><Trash2/>Удалить команду</button></div>}
    {changeCaptain&&canManage&&<form className="captain-transfer" onSubmit={event=>{event.preventDefault();const member=team.members.find(item=>item.id===captainId);if(member)setConfirm({kind:"captain",id:member.id,name:member.name})}}><label>Новый капитан<select required value={captainId} onChange={event=>setCaptainId(event.target.value)}><option value="" disabled>Выберите участника</option>{team.members.filter(member=>!member.captain).map(member=><option value={member.id} key={member.id}>{member.name}</option>)}</select></label><button className="secondary" disabled={busy}>Назначить капитана</button></form>}
    {confirm&&canManage&&<div className="team-confirm" role="alert"><h3>{confirm.kind==="delete"?"Удалить команду?":confirm.kind==="remove"?"Удалить участника?":"Передать капитанство?"}</h3><p>{confirm.kind==="delete"?"Команда будет удалена, а ожидающие приглашения отменены.":confirm.kind==="remove"?`${confirm.name} будет удалён из состава.`:`${confirm.name} получит управление командой. Вы останетесь участником.`}</p><div className="form-actions"><SecondaryButton disabled={busy} onClick={()=>{setConfirm(null);setError("")}}>Отмена</SecondaryButton><button className={confirm.kind==="captain"?"primary":"danger"} disabled={busy} onClick={()=>void run()}>{busy?"Сохраняем…":"Подтвердить"}</button></div></div>}
    {error&&<p className="form-error" role="alert">{error}</p>}
  </Modal>;
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
  const statusFor=(candidate:User)=>{if(team.members.some(member=>member.id===candidate.id))return"member";const latest=store.state.invitations.find(item=>item.teamId===team.id&&item.recipientId===candidate.id);return latest?.status==="accepted"?"available":latest?.status??"available"};
  const invite=async(candidate:User)=>{if(busy)return;setBusy(candidate.id);try{await store.sendInvitation(team.id,candidate.id);notify(`Приглашение для ${candidate.firstName} отправлено`)}catch(reason){notify(reason instanceof Error?reason.message:"Не удалось отправить приглашение")}finally{setBusy("")}};
  const invitations=store.state.invitations.filter(item=>item.teamId===team.id);
  const cancel=async(id:string)=>{if(busy)return;setBusy(id);try{await store.cancelInvitation(id);notify("Приглашение отменено")}catch(reason){notify(reason instanceof Error?reason.message:"Не удалось отменить приглашение")}finally{setBusy("")}};
  const retry=()=>setFailed(false);
  return <Modal title={`Пригласить в ${team.name}`} subtitle="Игрок войдёт в состав только после принятия приглашения." onClose={close} busy={Boolean(busy)}><section className="player-search"><label className="search-field"><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Поиск игрока по имени или телефону" autoFocus/></label>{loading&&<p className="loading-line">Ищем зарегистрированных пользователей…</p>}{failed&&<div className="search-state"><p className="form-error">Не удалось загрузить результаты.</p><button className="secondary" onClick={retry}><RefreshCw/>Повторить</button></div>}{!loading&&!failed&&query.trim()&&!results.length&&<p className="search-state">Ничего не найдено. Проверьте имя или номер телефона.</p>}<div className="invite-results">{!loading&&results.map(candidate=>{const status=statusFor(candidate);return <div className="invite-result" key={candidate.id}><CircleUserRound/><span><b>{candidate.firstName} {candidate.lastName}</b><small>{maskPhone(candidate.phone)}</small></span>{status==="available"||status==="declined"||status==="cancelled"?<button className="secondary" disabled={Boolean(busy)} onClick={()=>void invite(candidate)}><Send/>{busy===candidate.id?"Отправка…":"Пригласить"}</button>:<Badge tone={status==="member"?"green":"blue"}>{status==="member"?"Уже в составе":"Уже приглашён"}</Badge>}</div>})}</div>{invitations.length>0&&<div className="invitation-history"><h3>Приглашения</h3>{invitations.map(invitation=>{const recipient=store.state.users.find(item=>item.id===invitation.recipientId);return <div key={invitation.id}><span>{recipient?`${recipient.firstName} ${recipient.lastName}`:"Пользователь"}</span><Badge tone={invitation.status==="accepted"?"green":invitation.status==="declined"||invitation.status==="cancelled"?"red":"blue"}>{invitation.status==="pending"?"Ожидает ответа":invitation.status==="accepted"?"Принято":invitation.status==="declined"?"Отклонено":"Отменено"}</Badge>{invitation.status==="pending"&&<button className="text-button" disabled={Boolean(busy)} onClick={()=>void cancel(invitation.id)}>{busy===invitation.id?"Отмена…":"Отменить"}</button>}</div>})}</div>}</section></Modal>;
}
