"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Plus, RefreshCw, Search, UserRound, X } from "lucide-react";
import { currentUser } from "@/entities";
import { Modal, SecondaryButton } from "@/shared/ui";
import { useAdminStore } from "../model/AdminStore";

type SearchState = "idle" | "loading" | "results" | "empty" | "error";

export function TeamBuilderModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { state, createTeam } = useAdminStore();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [captainId, setCaptainId] = useState("");
  const [query, setQuery] = useState("");
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const results = useMemo(() => state.users.filter(user => {
    const haystack = `${user.firstName} ${user.lastName} ${user.email} ${user.phone}`.toLowerCase();
    return user.id !== currentUser.id && !selectedIds.includes(user.id) && haystack.includes(query.trim().toLowerCase());
  }), [query, selectedIds, state.users]);

  const search = (value: string) => {
    setQuery(value);
    if (!value.trim()) { setSearchState("idle"); return }
    setSearchState("loading");
    window.setTimeout(() => {
      const normalized = value.trim().toLowerCase();
      if (normalized === "ошибка") { setSearchState("error"); return }
      const found = state.users.some(user => user.id !== currentUser.id && !selectedIds.includes(user.id) && `${user.firstName} ${user.lastName} ${user.email} ${user.phone}`.toLowerCase().includes(normalized));
      setSearchState(found ? "results" : "empty");
    }, 450);
  };

  const choose = (id: string) => {
    if (selectedIds.includes(id)) return;
    setSelectedIds(previous => [...previous, id]);
    setPickerOpen(false);
    setQuery("");
  };
  const remove = (id: string) => {
    setSelectedIds(previous => previous.filter(value => value !== id));
    if (captainId === id) setCaptainId("");
  };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try { await createTeam({ name, playerIds: selectedIds, captainId }); onCreated(); onClose() }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Не удалось создать команду") }
    finally { setBusy(false) }
  };

  return <Modal title="Создание команды" subtitle="Добавьте зарегистрированных игроков и назначьте капитана." onClose={onClose} busy={busy}>
    <form onSubmit={submit} className="team-builder">
      <label>Название команды <b className="required">*</b><input value={name} onChange={event => setName(event.target.value)} required maxLength={80}/></label>
      <fieldset><legend>Свободные слоты игроков <b className="required">*</b></legend><div className="dynamic-players">{Array.from({length:5},(_,index)=>{const id=selectedIds[index];if(!id)return <button type="button" className="player-slot empty" key={`empty-${index}`} onClick={()=>{setPickerOpen(true);setSearchState("idle");setQuery("")}}><Plus/><span>Свободный слот {index+1}</span></button>;const user=state.users.find(item=>item.id===id)!;return <div className="player-slot filled" key={id}><span><UserRound/><span><b>{user.firstName} {user.lastName}</b><small>{user.email}</small></span></span><button type="button" className="slot-remove" onClick={()=>remove(id)} aria-label={`Удалить ${user.firstName} ${user.lastName}`}><X/></button></div>})}</div></fieldset>
      {pickerOpen && <section className="user-search glass"><button type="button" className="search-close" onClick={()=>setPickerOpen(false)} aria-label="Закрыть поиск"><X/></button><label><Search/><input aria-label="Поиск зарегистрированных пользователей" autoFocus value={query} onChange={event => search(event.target.value)} placeholder="Имя, фамилия, email или телефон"/></label>
        {searchState === "idle" && <p>Начните вводить данные пользователя.</p>}
        {searchState === "loading" && <p className="loading-line">Поиск пользователей…</p>}
        {searchState === "empty" && <p>Ничего не найдено.</p>}
        {searchState === "error" && <div><p className="form-error">Не удалось загрузить пользователей.</p><button type="button" className="secondary" onClick={() => { setQuery(""); setSearchState("idle") }}><RefreshCw/> Повторить</button></div>}
        {searchState === "results" && <div className="search-results">{results.map(user => <button type="button" key={user.id} onClick={() => choose(user.id)}><UserRound/><span><b>{user.firstName} {user.lastName}</b><small>{user.email}</small></span></button>)}</div>}
      </section>}
      <label>Капитан команды <b className="required">*</b><select value={captainId} onChange={event => setCaptainId(event.target.value)} required><option value="">Выберите игрока из состава</option>{selectedIds.map(id => { const user = state.users.find(item => item.id === id)!; return <option value={id} key={id}>{user.firstName} {user.lastName}</option> })}</select></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions"><SecondaryButton type="button" onClick={onClose} disabled={busy}>Отмена</SecondaryButton><button className="primary" type="submit" disabled={busy}>{busy ? "Создание…" : "Создать команду"}</button></div>
    </form>
  </Modal>;
}
