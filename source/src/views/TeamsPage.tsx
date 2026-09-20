"use client";
/* Optimized local WebP assets are rendered directly for Vinext dev compatibility. */
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import { CircleUserRound, Flag, Plus, X } from "lucide-react";
import { Badge, DemoForm, Field, GlowButton, Modal, PageHero } from "@/shared/ui";
import { teams, type Team } from "@/entities";
import { saveRecord } from "@/shared/storage";
import { useApp } from "@/shared/providers";

export function TeamsPage(){
  const[selected,setSelected]=useState<Team|null>(null),[create,setCreate]=useState(false),{notify}=useApp();
  return <><PageHero eyebrow="СООБЩЕСТВО БУДУЩЕГО СПОРТА" title="КОМАНДЫ" description="Ищи знакомые названия, открывай новые имена и становись частью фиджитал-семейства." visual={<Flag/>}/><section className="content-section teams-showcase glass"><div><p className="eyebrow">ЕДИНЫЙ РИТМ</p><h2>Команда сильнее суммы игроков</h2><p>Реальная площадка требует доверия. Цифровая арена — точной координации. В Phygital Core важны оба навыка.</p></div><div className="teams-showcase-image"><img src="/team-arena.webp" alt="Команда фиджитал-спортсменов"/></div></section><section className="content-section teams-grid"><div><div className="section-heading"><div><p className="eyebrow">СООБЩЕСТВО</p><h2>Команды платформы</h2></div><GlowButton onClick={()=>setCreate(true)}>Создать команду <Plus/></GlowButton></div><div className="team-list">{teams.map((team,index)=><button className={`team-card glass ${selected?.id===team.id?"selected":""}`} key={team.id} onClick={()=>setSelected(team)}><span className="team-logo">{String(index+1).padStart(2,"0")}</span><span><b>{team.name}</b><small>{team.discipline} · {team.members.length} игроков</small></span><span>→</span></button>)}</div></div>{selected?<aside className="team-drawer glass"><button onClick={()=>setSelected(null)} aria-label="Закрыть"><X/></button><p className="eyebrow">ПРОФИЛЬ КОМАНДЫ</p><h2>{selected.name}</h2><p>{selected.discipline}</p><h3>Состав команды</h3>{selected.members.map(member=><div className="member" key={member.id}><CircleUserRound/><span>{member.name}</span>{member.captain&&<Badge>Капитан</Badge>}</div>)}</aside>:<aside className="team-drawer team-empty glass"><Flag/><h3>Выберите команду</h3><p>Откроем состав и покажем капитана.</p></aside>}</section>{create&&<Modal title="Создание команды" subtitle="Все участники должны быть зарегистрированы на сайте" onClose={()=>setCreate(false)}><DemoForm onSuccess={async()=>{await saveRecord("last-team-application",{createdAt:new Date().toISOString()});setCreate(false);notify("Заявка отправлена и не создаёт команду автоматически")}} submit="Отправить" cancel="Отмена" onCancel={()=>setCreate(false)}><Field label="Название команды" required/><Field label="Имя и фамилия капитана" required/><label>Состав участников *<textarea required maxLength={500}/><small>До 500 символов</small></label></DemoForm></Modal>}</>;
}
