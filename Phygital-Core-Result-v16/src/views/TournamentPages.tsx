"use client";
/* eslint-disable @next/next/no-img-element */
import {useId,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {CalendarDays,Clock3,MapPin,Trophy,UsersRound,Plus,ArrowRight} from "lucide-react";
import {tournamentStatus,type Tournament} from "@/entities";
import {useAdminStore} from "@/features/admin-management";
import {useAuth,useAuthModal} from "@/features/auth";
import {CreateTeamModal} from "@/features/team-management";
import {useApp} from "@/shared/providers";
import {Badge,Button,EmptyState,Modal,ModalFooter,PageHeader,SelectField} from "@/shared/ui";

const statusLabel={upcoming:"Предстоящий",active:"Идёт",completed:"Завершён"} as const;
const date=(value:string)=>new Date(value).toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"});
const time=(value:string)=>new Date(value).toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"});
export function TournamentsPage(){
  const store=useAdminStore(),{notify}=useApp();
  const[applyId,setApplyId]=useState<string|null>(null),[detailsId,setDetailsId]=useState<string|null>(null);
  const details=store.state.tournaments.find(item=>item.id===detailsId),apply=store.state.tournaments.find(item=>item.id===applyId);
  const approved=details?store.state.tournamentApplications.filter(item=>item.tournamentId===details.id&&item.status==="APPROVED").length:0;
  return <>
    <PageHeader eyebrow="СОРЕВНОВАНИЯ НОВОГО ПОКОЛЕНИЯ" title="Турниры" description="Все доступные турниры на одной странице." visual={<Trophy/>}/>
    <section className="content-section tournaments-list"><h2>ВСЕ ТУРНИРЫ</h2>
      {store.state.tournaments.length?store.state.tournaments.map(tournament=>{const status=tournamentStatus(tournament);return <article className="tournament-card glass" key={tournament.id}><div className="tournament-image"><img src={tournament.imageUrl||"/trophy-arena.webp"} alt="Кубок фиджитал-турнира"/></div><div><Badge tone={status==="active"?"green":status==="completed"?"red":"blue"}>{statusLabel[status]}</Badge><h3>{tournament.name}</h3><p className="facts"><span><CalendarDays/>{new Date(tournament.startAt).toLocaleDateString("ru-RU")}</span><span><MapPin/>{tournament.city}</span></p><p>{tournament.description}</p><div className="card-actions"><Button type="button" onClick={()=>setDetailsId(tournament.id)}>Подробнее о турнире</Button>{status!=="completed"&&<Button type="button" variant="primary" onClick={()=>setApplyId(tournament.id)}>Зарегистрировать команду <ArrowRight/></Button>}</div></div></article>}):<EmptyState/>}
    </section>
    {details&&<Modal title={details.name} subtitle={details.shortDescription||undefined} className="tournament-detail-modal" eyebrow={<Badge tone={tournamentStatus(details)==="active"?"green":tournamentStatus(details)==="completed"?"red":"blue"}>{statusLabel[tournamentStatus(details)]}</Badge>} onClose={()=>setDetailsId(null)} footer={<ModalFooter><Button type="button" onClick={()=>setDetailsId(null)}>Закрыть</Button>{tournamentStatus(details)!=="completed"&&<Button type="button" variant="primary" onClick={()=>{setApplyId(details.id);setDetailsId(null)}}>Зарегистрировать команду <ArrowRight/></Button>}</ModalFooter>}>
      <dl className="tournament-meta">
        {details.startAt&&<div><CalendarDays/><dt>Дата</dt><dd>{date(details.startAt)}{details.endAt&&date(details.endAt)!==date(details.startAt)&&<> — {date(details.endAt)}</>}</dd></div>}
        {details.startAt&&<div><Clock3/><dt>Время начала</dt><dd>{time(details.startAt)}</dd></div>}
        {(details.city||details.venue)&&<div><MapPin/><dt>Место</dt><dd>{[details.city,details.venue].filter(Boolean).join(" · ")}</dd></div>}
        <div><UsersRound/><dt>Подтверждённые команды</dt><dd>{approved}</dd></div>
      </dl>
      {details.description&&<section className="tournament-extra"><h3>О турнире</h3><p>{details.description}</p>{details.endAt&&<p>Окончание: {date(details.endAt)}, {time(details.endAt)}.</p>}</section>}
      <section className="tournament-extra"><Link href="/rules" onClick={()=>setDetailsId(null)}>Правила участия →</Link></section>
    </Modal>}
    {apply&&<TournamentApplication tournament={apply} close={()=>setApplyId(null)} success={()=>{setApplyId(null);notify("Заявка на турнир отправлена")}}/>}
  </>;
}
function TournamentApplication({tournament,close,success}:{tournament:Tournament;close:()=>void;success:()=>void}){
  const{user}=useAuth(),{openAuth}=useAuthModal(),store=useAdminStore(),{notify}=useApp();
  const available=user?store.state.teams.filter(team=>team.members.some(member=>member.id===user.id&&member.captain)):[];
  const[selected,setSelected]=useState(available[0]?.id??""),[info,setInfo]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[creating,setCreating]=useState(false);
  const formId=useId(),teamLabelId=useId(),messageId=useId(),locked=useRef(false);
  const selectedId=available.some(item=>item.id===selected)?selected:available[0]?.id??"";
  const submit=async(event:FormEvent)=>{event.preventDefault();if(locked.current)return;locked.current=true;setBusy(true);setError("");try{await store.submitTournamentApplication(selectedId,tournament.id,info);success()}catch(reason){setError(reason instanceof Error?reason.message:"Не удалось отправить заявку")}finally{locked.current=false;setBusy(false)}};
  if(creating&&user)return <CreateTeamModal close={()=>setCreating(false)} create={async name=>{const team=await store.createCaptainTeam(name);setSelected(team.id);setCreating(false);notify("Команда создана. Теперь можно подать заявку")}}/>;
  return <Modal title="Заявка на турнир" subtitle={tournament.name} className="tournament-application-modal" onClose={close} busy={busy} footer={<ModalFooter><Button type="button" onClick={close} disabled={busy}>Отмена</Button>{!user?<Button type="button" variant="primary" onClick={()=>{close();openAuth("login","/tournaments")}}>Войти</Button>:available.length>0&&<Button variant="primary" type="submit" form={formId} loading={busy}>Отправить заявку <ArrowRight/></Button>}</ModalFooter>}>
    {!user?<div className="application-empty"><UsersRound aria-hidden="true"/><h3>Требуется авторизация</h3><p>Войдите в аккаунт, чтобы система проверила право подачи заявки.</p></div>:!available.length?<div className="application-empty"><UsersRound aria-hidden="true"/><h3>У вас нет команд для подачи заявки</h3><p>Подать заявку на турнир может только капитан команды.</p><Button type="button" variant="primary" onClick={()=>setCreating(true)}><Plus/>Создать команду</Button></div>:<form id={formId} className="application-form" onSubmit={submit} aria-busy={busy}>
      <div className="application-field"><label id={teamLabelId}>Команда <b className="required">*</b></label><SelectField labelId={teamLabelId} name="teamId" required value={selectedId} disabled={busy} onChange={setSelected} options={available.map(item=>({value:item.id,label:item.name}))}/></div>
      <div className="application-field"><label htmlFor={messageId}>Дополнительная информация<span className="field-hint">Необязательно</span></label><textarea id={messageId} aria-describedby={`${messageId}-count`} name="additionalInfo" maxLength={500} disabled={busy} value={info} onChange={event=>setInfo(event.target.value)} placeholder="Сообщение организатору"/><small className="field-count" id={`${messageId}-count`}>{info.length}/500</small></div>
      {error&&<p className="form-error" role="alert">{error}</p>}
    </form>}
  </Modal>;
}
