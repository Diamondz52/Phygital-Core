"use client";

import {useEffect,useId,useRef,useState,type KeyboardEvent} from "react";
import {Check,ChevronDown} from "lucide-react";

export interface SelectOption {value:string;label:string}
export function optionIndex(key:string,current:number,count:number){
  if(!count)return -1;
  if(key==="Home")return 0;
  if(key==="End")return count-1;
  if(key==="ArrowDown")return (current+1+count)%count;
  if(key==="ArrowUp")return (current-1+count)%count;
  return current;
}
export function SelectField({options,value,onChange,labelId,disabled=false,required=false,name}:{options:SelectOption[];value:string;onChange:(value:string)=>void;labelId:string;disabled?:boolean;required?:boolean;name?:string}){
  const[open,setOpen]=useState(false),[active,setActive]=useState(0),listId=useId();
  const root=useRef<HTMLDivElement>(null),trigger=useRef<HTMLButtonElement>(null),list=useRef<HTMLDivElement>(null);
  const selected=options.findIndex(option=>option.value===value),expanded=open&&!disabled;
  const activeIndex=active<options.length?active:Math.max(selected,0);
  useEffect(()=>{if(!expanded)return;const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false)};document.addEventListener("pointerdown",outside);return()=>document.removeEventListener("pointerdown",outside)},[expanded]);
  useEffect(()=>{if(expanded)list.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)?.scrollIntoView({block:"nearest"})},[expanded,activeIndex]);
  const choose=(index:number)=>{const option=options[index];if(disabled||!option)return;onChange(option.value);setOpen(false);trigger.current?.focus({preventScroll:true})};
  const keyDown=(event:KeyboardEvent<HTMLButtonElement>)=>{
    if(disabled)return;
    if(event.key==="Escape"&&expanded){event.preventDefault();event.stopPropagation();setOpen(false);return}
    if(event.key==="Tab"){setOpen(false);return}
    if(["ArrowDown","ArrowUp","Home","End"].includes(event.key)){event.preventDefault();if(!expanded){setActive(event.key==="Home"?0:event.key==="End"?options.length-1:Math.max(selected,0));setOpen(true)}else setActive(optionIndex(event.key,activeIndex,options.length));return}
    if((event.key==="Enter"||event.key===" ")&&expanded){event.preventDefault();choose(activeIndex)}
  };
  return <div className={`select-field ${expanded?"is-open":""}`} ref={root}>
    {name&&<input type="hidden" name={name} value={value} disabled={disabled}/>}
    <button type="button" className="select-trigger" role="combobox" aria-labelledby={labelId} aria-haspopup="listbox" aria-expanded={expanded} aria-controls={expanded?listId:undefined} aria-activedescendant={expanded?`${listId}-${activeIndex}`:undefined} aria-required={required||undefined} disabled={disabled} ref={trigger} onKeyDown={keyDown} onClick={()=>{setActive(Math.max(selected,0));setOpen(!expanded)}}><span>{options[selected]?.label??"Выберите команду"}</span><ChevronDown aria-hidden="true"/></button>
    {expanded&&<div className="select-options" id={listId} role="listbox" aria-labelledby={labelId} ref={list}>{options.map((option,index)=><button key={option.value} id={`${listId}-${index}`} data-index={index} type="button" role="option" tabIndex={-1} aria-selected={option.value===value} className={index===activeIndex?"is-highlighted":""} onPointerMove={()=>setActive(index)} onClick={()=>choose(index)}><span>{option.label}</span>{option.value===value&&<Check aria-hidden="true"/>}</button>)}</div>}
  </div>;
}
