"use client";
import{createContext,useContext,useEffect,useMemo,useState,type ReactNode}from"react";
import{dictionary,type Language}from"@/shared/i18n";
type Theme="dark"|"light"|"system";
type AppState={language:Language;setLanguage:(v:Language)=>void;theme:Theme;setTheme:(v:Theme)=>void;t:Record<keyof typeof dictionary.ru,string>;toast:string;notify:(v:string)=>void};
const Context=createContext<AppState|null>(null);
export function AppProvider({children}:{children:ReactNode}){const[language,setLanguageState]=useState<Language>("ru"),[theme,setThemeState]=useState<Theme>("dark"),[toast,setToast]=useState("");
useEffect(()=>{queueMicrotask(()=>{const lang=localStorage.getItem("pc-language")as Language|null,the=localStorage.getItem("pc-theme")as Theme|null;if(lang)setLanguageState(lang);if(the)setThemeState(the)})},[]);
useEffect(()=>{const actual=theme==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):theme;document.documentElement.dataset.theme=actual},[theme]);
const setLanguage=(v:Language)=>{setLanguageState(v);localStorage.setItem("pc-language",v)},setTheme=(v:Theme)=>{setThemeState(v);localStorage.setItem("pc-theme",v)},notify=(v:string)=>{setToast(v);window.setTimeout(()=>setToast(""),2600)};
const value=useMemo(()=>({language,setLanguage,theme,setTheme,t:dictionary[language],toast,notify}),[language,theme,toast]);return <Context.Provider value={value}>{children}{toast&&<div className="toast" role="status">✓ {toast}</div>}</Context.Provider>}
export function useApp(){const value=useContext(Context);if(!value)throw new Error("useApp requires AppProvider");return value}
