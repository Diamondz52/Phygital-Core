"use client";
import{useEffect,useEffectEvent,useId,useRef,useState,useSyncExternalStore,type ButtonHTMLAttributes,type InputHTMLAttributes,type ReactNode}from"react";import{createPortal}from"react-dom";import{Eye,EyeOff,X}from"lucide-react";
export function GlowButton({children,...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button className="primary" {...props}>{children}</button>}
export function SecondaryButton({children,...props}:ButtonHTMLAttributes<HTMLButtonElement>){return <button className="secondary" {...props}>{children}</button>}
export { PageDecoration, PageHeader } from "./PageHeader";
export function Badge({children,tone="purple"}:{children:ReactNode;tone?:"purple"|"green"|"blue"|"red"}){return <span className={`badge ${tone}`}>{children}</span>}
export function Modal({title,subtitle,children,onClose,busy=false}:{title:string;subtitle?:string;children:ReactNode;onClose:()=>void;busy?:boolean}){
  const ref=useRef<HTMLDivElement>(null),titleId=useId(),mounted=useSyncExternalStore(()=>()=>{},()=>true,()=>false);
  const dismiss=useEffectEvent(()=>{if(!busy)onClose()});
  useEffect(()=>{
    if(!mounted)return;
    const previous=document.activeElement as HTMLElement|null,body=document.body,overflow=body.style.overflow;
    body.style.overflow="hidden";
    const key=(event:KeyboardEvent)=>{
      if(event.key==="Escape")dismiss();
      if(event.key==="Tab"&&ref.current){
        const focusable=[...ref.current.querySelectorAll<HTMLElement>("button,input,select,textarea,a[href]")].filter(element=>!element.hasAttribute("disabled")&&element.getClientRects().length);
        const first=focusable[0],last=focusable.at(-1);if(!first||!last)return;
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus({preventScroll:true})}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus({preventScroll:true})}
      }
    };
    document.addEventListener("keydown",key);
    const frame=requestAnimationFrame(()=>ref.current?.querySelector<HTMLElement>("input,button")?.focus({preventScroll:true}));
    return()=>{cancelAnimationFrame(frame);document.removeEventListener("keydown",key);body.style.overflow=overflow;if(previous?.isConnected)previous.focus({preventScroll:true})};
  },[mounted]);
  if(!mounted)return null;
  return createPortal(<div className="modal-backdrop" onMouseDown={event=>{if(event.target===event.currentTarget&&!busy)onClose()}}><div className="modal glass" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={busy} ref={ref}><button className="close" onClick={onClose} disabled={busy} aria-label="Закрыть"><X/></button><h2 id={titleId}>{title}</h2>{subtitle&&<p>{subtitle}</p>}{children}</div></div>,document.body);
}
type PasswordFieldProps=Omit<InputHTMLAttributes<HTMLInputElement>,"type">&{label:string};
export function PasswordField({label,required=false,...inputProps}:PasswordFieldProps){const[visible,setVisible]=useState(false);return <label><span>{label}{required&&<b className="required"> *</b>}</span><span className="password-control"><input {...inputProps} type={visible?"text":"password"} required={required}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?"Скрыть пароль":"Показать пароль"}>{visible?<EyeOff/>:<Eye/>}</button></span></label>}
export function EmptyState({title="Данных пока нет"}:{title?:string}){return <div className="state glass"><h3>{title}</h3><p>Попробуйте обновить страницу позднее.</p></div>}
export function DataTable({headers,rows}:{headers:string[];rows:(string|ReactNode)[][]}){return <div className="data-table glass"><div className="table-row table-head">{headers.map(h=><span key={h}>{h}</span>)}</div>{rows.map((r,i)=><div className="table-row" key={i}>{r.map((c,j)=><span key={j}>{c}</span>)}</div>)}</div>}
