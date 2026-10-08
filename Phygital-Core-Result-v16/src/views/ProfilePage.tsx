"use client";
import {Button} from "@/shared/ui";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CalendarDays, CircleUserRound, LogOut, Mail, Save, ShieldCheck, Smartphone, UsersRound } from "lucide-react";
import type { Team } from "@/entities";
import { useAdminStore } from "@/features/admin-management";
import { ProtectedGate, useAuth } from "@/features/auth";
import { NotificationCenter } from "@/features/team-invitations";
import {TeamDialog} from "@/features/team-management";
import { useApp } from "@/shared/providers";
import { PageHeader } from "@/shared/ui";

export function ProfilePage(){return <ProtectedGate><ProfileDashboard/></ProtectedGate>}

function ProfileDashboard(){
  const {user,updateProfile,changePassword,logout}=useAuth();
  const {state}=useAdminStore();
  const {notify}=useApp();
  const router=useRouter();
  const[clockNow]=useState(()=>Date.now());
  const[tab,setTab]=useState<"overview"|"profile"|"security">("overview"),[busy,setBusy]=useState(false),[error,setError]=useState(""),[selectedTeam,setSelectedTeam]=useState<Team|null>(null);
  const[form,setForm]=useState(()=>({firstName:user?.firstName??"",lastName:user?.lastName??"",phone:user?.phone??"",telegram:user?.telegram??"",birthDate:user?.birthDate??"",bio:user?.bio??""}));
  if(!user)return null;
  const liveTeam=state.teams.find(team=>team.id===selectedTeam?.id)??null;
  const nearest=state.tournaments.filter(tournament=>new Date(tournament.endAt).getTime()>=clockNow).sort((a,b)=>new Date(a.startAt).getTime()-new Date(b.startAt).getTime())[0];
  const userTeams=state.teams.filter(team=>team.members.some(member=>member.id===user.id));
  const saveProfile=async(event:FormEvent)=>{event.preventDefault();if(busy)return;setBusy(true);setError("");try{await updateProfile(form);notify("Профиль сохранён");setTab("overview")}catch(reason){setError(reason instanceof Error?reason.message:"Не удалось сохранить профиль")}finally{setBusy(false)}};
  const savePassword=async(event:FormEvent<HTMLFormElement>)=>{event.preventDefault();if(busy)return;const formElement=event.currentTarget,data=new FormData(formElement),current=String(data.get("current")||""),next=String(data.get("next")||""),repeat=String(data.get("repeat")||"");setError("");if(next.length<8){setError("Новый пароль должен содержать не менее 8 символов");return}if(next!==repeat){setError("Пароли не совпадают");return}setBusy(true);try{await changePassword(current,next);formElement.reset();notify("Пароль изменён");setTab("overview")}catch(reason){setError(reason instanceof Error?reason.message:"Не удалось изменить пароль")}finally{setBusy(false)}};
  const signOut=async()=>{await logout();notify("Вы вышли из аккаунта");router.push("/")};
  return <>
    <PageHeader eyebrow="ЛИЧНОЕ ПРОСТРАНСТВО" title="Личный кабинет" description="Профиль, команды и настройки безопасности." visual={<CircleUserRound/>}/>
    <div className="profile-top-tools"><NotificationCenter/></div>
    <section className="content-section profile-dashboard">
      <aside className="profile-nav glass"><button className={tab==="overview"?"active":""} onClick={()=>setTab("overview")}>Обзор</button><button className={tab==="profile"?"active":""} onClick={()=>setTab("profile")}>Личные данные</button><button className={tab==="security"?"active":""} onClick={()=>setTab("security")}>Безопасность</button>{user.role==="ADMIN"&&<Link href="/admin"><ShieldCheck/>Админ-панель</Link>}<button className="logout-link" onClick={signOut}><LogOut/>Выйти</button></aside>
      <div className="profile-workspace">
        {tab==="overview"&&<><div className="profile-kpis"><article className="glass"><UsersRound/><small>Мои команды</small><b>{user.role==="ADMIN"?"—":userTeams.length}</b></article><article className="glass"><CalendarDays/><small>Ближайший турнир</small><b>{nearest?new Date(nearest.startAt).toLocaleDateString("ru-RU",{day:"numeric",month:"short"}):"Нет турниров"}</b></article><article className="glass"><ShieldCheck/><small>Статус аккаунта</small><b>Активен</b></article></div><div className="profile-overview-grid"><article className="glass profile-summary"><div className="section-heading"><div><p className="eyebrow">ПРОФИЛЬ</p><h2>{user.firstName} {user.lastName}</h2></div><Button variant="secondary" className="secondary" onClick={()=>setTab("profile")}>Редактировать</Button></div><p>{user.bio||"Добавьте пару слов о себе и своих спортивных интересах."}</p><div className="profile-contact"><span><Mail/>{user.email}</span><span><Smartphone/>{user.phone||"Телефон не указан"}</span></div></article><article className="glass profile-teams"><p className="eyebrow">КОМАНДЫ</p><h2>{user.role==="ADMIN"?"Организация":"Мои команды"}</h2>{user.role==="ADMIN"?<p>У вас есть доступ к управлению всеми командами платформы.</p>:userTeams.length?userTeams.map(team=><button key={team.id} onClick={()=>setSelectedTeam(team)}><span className="team-logo">{team.name.slice(0,2).toUpperCase()}</span><b>{team.name}</b><small>{team.members.find(member=>member.captain)?.id===user.id?"Капитан":"Участник"}</small><i>→</i></button>):<p>После принятия приглашения команда появится здесь.</p>}</article></div></>}
        {tab==="profile"&&<form className="profile-form glass" onSubmit={saveProfile}><p className="eyebrow">НАСТРОЙКИ</p><h2>Личные данные</h2><div className="form-split"><label>Имя<input value={form.firstName} onChange={event=>setForm({...form,firstName:event.target.value})} required/></label><label>Фамилия<input value={form.lastName} onChange={event=>setForm({...form,lastName:event.target.value})} required/></label></div><label>Email<input value={user.email} disabled/><small>Email используется для входа.</small></label><div className="form-split"><label>Телефон<input value={form.phone} onChange={event=>setForm({...form,phone:event.target.value})}/></label><label>Telegram<input value={form.telegram} onChange={event=>setForm({...form,telegram:event.target.value})}/></label></div><label>Дата рождения<input type="date" value={form.birthDate} onChange={event=>setForm({...form,birthDate:event.target.value})}/></label><label>О себе<textarea maxLength={300} value={form.bio} onChange={event=>setForm({...form,bio:event.target.value})}/><small>{form.bio.length}/300</small></label>{error&&<p className="form-error">{error}</p>}<div className="form-actions"><Button variant="secondary" type="button" className="secondary" onClick={()=>setTab("overview")}>Отмена</Button><Button variant="primary" className="primary" loading={busy}><Save/>{busy?"Сохраняем…":"Сохранить"}</Button></div></form>}
        {tab==="security"&&<form className="profile-form glass" onSubmit={savePassword}><p className="eyebrow">БЕЗОПАСНОСТЬ</p><h2>Изменение пароля</h2><label>Текущий пароль<input name="current" type="password" autoComplete="current-password" required/></label><div className="form-split"><label>Новый пароль<input name="next" type="password" minLength={8} required/></label><label>Повторите пароль<input name="repeat" type="password" minLength={8} required/></label></div>{error&&<p className="form-error">{error}</p>}<div className="form-actions"><Button variant="secondary" type="button" className="secondary" onClick={()=>setTab("overview")}>Отмена</Button><Button variant="primary" className="primary" loading={busy}>{busy?"Сохраняем…":"Изменить пароль"}</Button></div></form>}
      </div>
    </section>
    {liveTeam&&<TeamDialog team={liveTeam} close={()=>setSelectedTeam(null)}/>}
  </>;
}
