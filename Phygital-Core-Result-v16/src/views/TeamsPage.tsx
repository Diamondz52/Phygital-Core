"use client";

import {useState} from "react";
import { ArrowRight,Plus,Search,UsersRound } from "lucide-react";
import { useAdminStore } from "@/features/admin-management";
import { useAuth, useAuthModal } from "@/features/auth";
import { useApp } from "@/shared/providers";
import { GlowButton,PageHeader,SecondaryButton } from "@/shared/ui";

function normalized(value:string){return value.toLocaleLowerCase("ru-RU").replace(/\s+/g," ").trim()}
function participants(count:number){const mod10=count%10,mod100=count%100;return `${count} ${mod10===1&&mod100!==11?"участник":mod10>=2&&mod10<=4&&(mod100<12||mod100>14)?"участника":"участников"}`}
function initials(name:string){return name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join("").toLocaleUpperCase("ru-RU")}
import {TeamProfileModal,CreateTeamModal,InvitePlayersModal} from "@/features/team-management";

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
