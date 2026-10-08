"use client";
import {Button} from "@/shared/ui";

import { useState } from "react";
import { Search } from "lucide-react";
import { useAdminStore } from "@/features/admin-management";
import { Badge, DataTable } from "@/shared/ui";
import { AdminPageHeader } from "@/widgets";

const labels={pending:"Ожидает",accepted:"Принято",declined:"Отклонено",cancelled:"Отменено"} as const;
export function InvitationsAdmin(){
  const {state}=useAdminStore();
  const[query,setQuery]=useState(""),[status,setStatus]=useState("all");
  const rows=state.invitations.filter(item=>{
    const team=state.teams.find(team=>team.id===item.teamId),sender=state.users.find(user=>user.id===item.senderId),recipient=state.users.find(user=>user.id===item.recipientId);
    const haystack=`${team?.name??""} ${sender?.firstName??""} ${sender?.lastName??""} ${recipient?.firstName??""} ${recipient?.lastName??""}`.toLowerCase();
    return(status==="all"||item.status===status)&&haystack.includes(query.toLowerCase());
  });
  return <><AdminPageHeader title="ПРИГЛАШЕНИЯ" description="Связь команды, капитана и приглашённого игрока обновляется автоматически."/><div className="admin-tools"><label><Search/><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Команда, капитан или игрок"/></label><select value={status} onChange={event=>setStatus(event.target.value)}><option value="all">Все статусы</option><option value="pending">Ожидает</option><option value="accepted">Принято</option><option value="declined">Отклонено</option><option value="cancelled">Отменено</option></select><Button variant="secondary" className="secondary" onClick={()=>{setQuery("");setStatus("all")}}>Сбросить</Button></div>{rows.length?<DataTable headers={["Команда","Капитан","Приглашённый игрок","Дата отправки","Статус"]} rows={rows.map(item=>{const team=state.teams.find(team=>team.id===item.teamId),sender=state.users.find(user=>user.id===item.senderId),recipient=state.users.find(user=>user.id===item.recipientId);return[team?.name??"Удалённая команда",sender?`${sender.firstName} ${sender.lastName}`:"—",recipient?`${recipient.firstName} ${recipient.lastName}`:"—",new Date(item.createdAt).toLocaleString("ru-RU"),<Badge key={item.id} tone={item.status==="accepted"?"green":item.status==="declined"||item.status==="cancelled"?"red":"blue"}>{labels[item.status]}</Badge>]})}/>:<div className="admin-empty glass"><h2>Приглашений пока нет</h2><p>После отправки приглашения запись появится здесь без перезагрузки страницы.</p></div>}</>;
}
