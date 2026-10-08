"use client";
import {Button} from "@/shared/ui";
import { useId, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarCheck, ChevronDown, Clock3, ExternalLink, Gamepad2, Mail, MapPin, MessageSquareText, Phone, RadioTower, Scale, Send, ShieldCheck, Trophy, UsersRound } from "lucide-react";
import { CONTACTS } from "@/shared/config";
import { GlowButton, Modal, PageHeader, Reveal } from "@/shared/ui";
import { FeedbackForm } from "@/features/feedback";

const rules = [
  { icon: ShieldCheck, title: "Общие положения", text: "Фиджитал-турниры проводятся с целью популяризации здорового образа жизни, развития командного духа и объединения любителей спорта и киберспорта. Организатором выступает студенческий совет при поддержке администрации и спортивного клуба колледжа. Конкретные даты и дисциплины публикуются в разделе «Турниры». Регистрируясь на турнир, участник подтверждает, что ознакомился с настоящими правилами и согласен их соблюдать. Организаторы оставляют за собой право вносить изменения в регламент конкретного турнира, уведомляя участников заранее." },
  { icon: Gamepad2, title: "Формат турнира", text: "Каждый турнир состоит из двух этапов: физического и киберспортивного. Формат проведения, количество этапов, состав команд и система начисления очков определяются индивидуально для каждого турнира и публикуются на его странице. Как правило, победитель определяется по сумме баллов, набранных за оба этапа. Точная формула расчёта и критерии победы указываются в регламенте конкретного турнира. Команда обязана участвовать в обоих этапах, если иное не указано в описании турнира." },
  { icon: UsersRound, title: "Требования к участникам", text: "К участию допускаются студенты колледжа всех курсов и специальностей. Состав команды определяется дисциплиной, в составе должен быть капитан. Капитан подаёт заявку, представляет команду перед организаторами и несёт ответственность за соблюдение правил всеми участниками. Для участия в физическом этапе требуется медицинский допуск или отметка врача об отсутствии противопоказаний. Один игрок может участвовать в нескольких турнирах, если они не пересекаются по времени. Замена игроков после начала турнира возможна только по согласованию с организаторами." },
  { icon: CalendarCheck, title: "Проведение матчей", text: "Расписание матчей публикуется на странице турнира и в личном кабинете капитана. В случае опоздания более чем на 10 минут команда может быть дисквалифицирована. Матчи проводятся по правилам конкретной дисциплины, которые публикуются на странице турнира. Судейство обеспечивают организаторы или приглашённые судьи, их решения обязательны для исполнения. Спорные ситуации решаются через организаторов, а не самостоятельно. При технических сбоях, не зависящих от участников, организаторы могут перенести матч или изменить формат." },
  { icon: Scale, title: "Поведение и честная игра", text: "Все участники обязаны уважительно относиться к соперникам, судьям, организаторам и зрителям. Запрещены оскорбления, агрессия, нецензурная лексика, провокации и любое давление на других участников. На турнире запрещено употребление алкоголя и запрещённых веществ. В киберспортивном этапе запрещено использование читов, стороннего ПО, эксплойтов и любых средств, дающих нечестное преимущество. Запрещены подставные игроки. За нарушение правил предусмотрены санкции: предупреждение, снятие с текущего турнира или временный бан на участие в следующих турнирах. Решение о санкциях принимают организаторы." },
  { icon: RadioTower, title: "Изменения в правилах", text: "Организаторы оставляют за собой право вносить изменения в настоящие правила и в регламент конкретного турнира. Все изменения публикуются на этой странице и на странице соответствующего турнира не позднее чем за 3 дня до его начала. Если участник не согласен с изменениями, он может отказаться от участия не позднее чем за 24 часа до старта турнира. Актуальная версия правил всегда доступна на этой странице." },
];
const questions = [
  ["Где проходят мероприятия?", "На базе Кампуса КЦТ в Екатеринбурге. Точная площадка указывается организаторами в информации о турнире."],
  ["Что нужно для участия?", "Зарегистрируйтесь, вступите в команду и подайте заявку на выбранный турнир."],
  ["Как создать команду?", "Создайте команду на странице «Команды», затем пригласите зарегистрированных игроков. Участники попадут в состав после принятия приглашения."],
  ["Как принять участие в турнире?", "Заявку от имени существующей команды подаёт её капитан. Команда выбирается из доступного списка."],
  ["Как определяется победитель?", "По сумме результатов реального и цифрового этапов в соответствии с правилами конкретного турнира."],
];

function RuleText({text}:{text:string}){
  const sentences=text.match(/[^.!?]+[.!?]+(?:\s|$)/g)??[text];
  const paragraphs:string[]=[];for(let index=0;index<sentences.length;index+=2)paragraphs.push(sentences.slice(index,index+2).join("").trim());
  return <div className="rule-text">{paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>;
}
export function RulesPage(){
  const[selected,setSelected]=useState(0),[mobileOpen,setMobileOpen]=useState<number|null>(0),prefix=useId();
  const active=rules[selected],Icon=active.icon;
  const select=(index:number)=>{setSelected(index);setMobileOpen(index)};
  return <><PageHeader eyebrow="Кодекс участника" title="Правила" description="Всё важное перед выходом на арену." visual={<ShieldCheck/>} variant="rules"/>
    <section className="content-section rules-workspace">
      <div className="rules-desktop">
        <nav className="rules-navigation" aria-label="Разделы правил"><p className="eyebrow">ШЕСТЬ ПРИНЦИПОВ ИГРЫ</p><div role="tablist" aria-orientation="vertical" aria-label="Правила турнира">{rules.map((rule,index)=><button key={rule.title} id={`${prefix}-tab-${index}`} role="tab" aria-selected={selected===index} aria-controls={`${prefix}-panel`} tabIndex={selected===index?0:-1} className={selected===index?"active":""} onClick={()=>select(index)} onKeyDown={event=>{let next:number|undefined;if(event.key==="ArrowDown")next=(index+1)%rules.length;if(event.key==="ArrowUp")next=(index+rules.length-1)%rules.length;if(event.key==="Home")next=0;if(event.key==="End")next=rules.length-1;if(next!==undefined){event.preventDefault();select(next);document.getElementById(`${prefix}-tab-${next}`)?.focus({preventScroll:true})}}}><span>0{index+1}</span><b>{rule.title}</b><ArrowRight/></button>)}</div></nav>
        <article className="rule-panel" id={`${prefix}-panel`} role="tabpanel" aria-labelledby={`${prefix}-tab-${selected}`} tabIndex={0}>
          <div className="rule-panel-meta"><span>0{selected+1} / 06</span><span className="rule-progress" aria-hidden="true">{rules.map((_,index)=><i key={index} className={index<=selected?"complete":""}/>)}</span></div>
          <div className="rule-panel-content" key={selected}><span className="rule-panel-icon"><Icon/></span><h2>{active.title}</h2><RuleText text={active.text}/></div>
          <div className="rule-pagination"><Button variant="secondary" className="secondary" disabled={selected===0} onClick={()=>select(selected-1)}><ArrowLeft/>Назад</Button><Button variant="secondary" className="secondary" disabled={selected===rules.length-1} onClick={()=>select(selected+1)}>Далее<ArrowRight/></Button></div>
          <ShieldCheck className="rule-panel-watermark" aria-hidden="true"/>
        </article>
      </div>
      <div className="rules-mobile">{rules.map((rule,index)=><article key={rule.title} className={mobileOpen===index?"active":""}><button aria-expanded={mobileOpen===index} aria-controls={`${prefix}-mobile-${index}`} onClick={()=>{setMobileOpen(mobileOpen===index?null:index);setSelected(index)}}><span>0{index+1}</span><b>{rule.title}</b><ChevronDown/></button><div id={`${prefix}-mobile-${index}`} hidden={mobileOpen!==index}><RuleText text={rule.text}/></div></article>)}</div>
    </section><Reveal><section className="content-section rules-banner glass"><Trophy/><div><p className="eyebrow">ГЛАВНЫЙ ПРИНЦИП</p><h2>Победа ценна, когда она честная</h2><p>Сомневаетесь в трактовке пункта? Задайте вопрос до начала матча.</p></div><a className="secondary" href="/faq">Перейти в FAQ <ArrowRight/></a></section></Reveal></>;
}

export function FaqPage(){const[open,setOpen]=useState<number|null>(null),[ask,setAsk]=useState(false),[busy,setBusy]=useState(false);return <><PageHeader eyebrow="ЦЕНТР ПОМОЩИ" title="FAQ" description="Ответы на основные вопросы." visual={<MessageSquareText/>} variant="faq"/><section className="content-section faq-shell faq-compact"><aside className="faq-aside glass"><MessageSquareText/><h2>Сформулируйте вопрос — мы разберёмся</h2><p>Ответ придёт на указанный email.</p><GlowButton onClick={()=>setAsk(true)}>Задать свой вопрос <Send/></GlowButton></aside><div className="faq-list faq-modern">{questions.map(([q,a],i)=><article className={`glass ${open===i?"open":""}`} key={q}><button aria-expanded={open===i} onClick={()=>setOpen(open===i?null:i)}><span>0{i+1}</span><b>{q}</b><ChevronDown/></button><div className="faq-answer"><p>{a}</p></div></article>)}</div></section>{ask&&<Modal title="Задать вопрос" subtitle="Мы ответим на указанный email." busy={busy} onClose={()=>setAsk(false)}><FeedbackForm onBusyChange={setBusy}/></Modal>}</>}

export function ContactsPage(){return <>
  <PageHeader eyebrow="ОБРАТНАЯ СВЯЗЬ" title="Контакты" description="Свяжитесь с организаторами удобным способом или оставьте сообщение." visual={<Phone/>} variant="contacts"/>
  <section className="content-section contacts-workspace glass">
    <div className="contacts-list" aria-label="Контактная информация">
      <Contact icon={<Phone/>} label="Позвонить" value={CONTACTS.phone} detail="Пн–Пт, 9:00–18:00" href="tel:+73431234567"/>
      <Contact icon={<Mail/>} label="Написать" value={CONTACTS.email} detail="Для вопросов и предложений" href={`mailto:${CONTACTS.email}`}/>
      <Contact icon={<Clock3/>} label="Режим работы" value="Пн–Пт 9:00–18:00" detail="Сб–Вс — выходные"/>
      <Contact icon={<MapPin/>} label="Организаторы" value="Колледж Цифровых Технологий" detail={CONTACTS.address} href={CONTACTS.organizerUrl} external/>
    </div>
    <div className="contact-divider" aria-hidden="true"><i/><i/><i/></div>
    <div className="contact-form-compact">
      <p className="eyebrow">ОБРАТНАЯ СВЯЗЬ</p><h2>Расскажите, чем помочь</h2><p>Оставьте сообщение — мы ответим на указанный email.</p>
      <FeedbackForm/>
    </div>
  </section>
</>}

function Contact({icon,label,value,detail,href,external=false}:{icon:ReactNode;label:string;value:string;detail:string;href?:string;external?:boolean}){const body=<>{icon}<span><small>{label}</small><b>{value}</b><em>{detail}</em></span>{external&&<ExternalLink/>}</>;return href?<a className={`contact-row ${external?"contact-row-link":""}`} href={href} target={external?"_blank":undefined} rel={external?"noreferrer":undefined}>{body}</a>:<div className="contact-row">{body}</div>}
export function PrivacyPage(){return <><PageHeader eyebrow="ИНФОРМАЦИЯ" title="Политика конфиденциальности" description="Как мы обрабатываем и защищаем персональные данные."/><article className="content-section legal glass"><h2>Общие положения</h2><p>Демонстрационная редакция. Перед публикацией текст должен быть утверждён владельцем платформы.</p><h2>Обрабатываемые данные</h2><p>Имя, email, телефон, сведения профиля и данные, необходимые для участия в турнирах.</p><h2>Ваши права</h2><p>Вы можете запросить уточнение или удаление данных, если их хранение не требуется законодательством.</p></article></>}
