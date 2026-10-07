"use client";

import { useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { useAdminStore } from "@/features/admin-management";
import { useAuth } from "@/features/auth";
import { useApp } from "@/shared/providers";

export function NotificationCenter(){
  const {user}=useAuth();
  const store=useAdminStore();
  const {notify}=useApp();
  const[open,setOpen]=useState(false),[busy,setBusy]=useState("");
  if(!user)return null;
  const items=store.state.notifications.filter(item=>item.userId===user.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  const unread=items.filter(item=>!item.read).length;
  const toggle=()=>{const next=!open;setOpen(next);if(next&&unread)store.markNotificationsRead()};
  const respond=async(id:string,response:"accepted"|"declined")=>{if(busy)return;setBusy(id);try{await store.respondInvitation(id,response);notify(response==="accepted"?"Вы присоединились к команде":"Приглашение отклонено")}catch(reason){notify(reason instanceof Error?reason.message:"Не удалось обработать приглашение")}finally{setBusy("")}};
  return <div className="notification-center"><button className="notification-bell" onClick={toggle} aria-expanded={open} aria-label={`Уведомления${unread?`: ${unread} непрочитанных`:""}`}><Bell/>{unread>0&&<span>{unread>9?"9+":unread}</span>}</button>{open&&<section className="notification-popup glass" aria-label="Уведомления"><header><div><p className="eyebrow">ЛИЧНЫЙ ЦЕНТР</p><h2>Уведомления</h2></div><button onClick={()=>setOpen(false)} aria-label="Закрыть"><X/></button></header>{items.length===0?<div className="notification-empty"><Bell/><b>Пока тихо</b><p>Здесь появятся приглашения и ответы игроков.</p></div>:<div className="notification-list">{items.slice(0,12).map(item=>{const invitation=item.invitationId?store.state.invitations.find(entry=>entry.id===item.invitationId):undefined;const actionable=item.type==="team_invitation"&&invitation?.status==="pending";return <article className={!item.read?"unread":""} key={item.id}><div><b>{item.title}</b><time>{new Date(item.createdAt).toLocaleString("ru-RU")}</time></div><p>{item.message}</p>{actionable&&<div className="notification-actions"><button className="primary" disabled={Boolean(busy)} onClick={()=>void respond(invitation.id,"accepted")}><Check/>{busy===invitation.id?"Обработка…":"Принять"}</button><button className="secondary" disabled={Boolean(busy)} onClick={()=>void respond(invitation.id,"declined")}><X/>Отклонить</button></div>}</article>})}</div>}</section>}</div>;
}
