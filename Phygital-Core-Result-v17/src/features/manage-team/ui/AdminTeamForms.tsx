"use client";

import { Button } from "@/shared/ui/Button";
import { useState } from "react";
import { type Team } from "@/entities/team";
import { type User } from "@/entities/user";
import { Modal } from "@/shared/ui/Modal";
import { SecondaryButton } from "@/shared/ui/Button";

export function RenameTeam({
  team,
  close,
  save,
  busy,
}: {
  team: Team;
  close: () => void;
  save: (name: string) => void;
  busy: boolean;
}) {
  const [name, setName] = useState(team.name);
  return (
    <Modal title="Изменить название" onClose={close} busy={busy}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save(name);
        }}
      >
        <label>
          Название
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <div className="form-actions">
          <SecondaryButton type="button" onClick={close}>
            Отмена
          </SecondaryButton>
          <Button variant="primary" className="primary" loading={busy}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function AddMemberModal({
  team,
  users,
  close,
  save,
  busy,
}: {
  team: Team;
  users: User[];
  close: () => void;
  save: (userId: string) => void;
  busy: boolean;
}) {
  const [query, setQuery] = useState(""),
    [userId, setUserId] = useState("");
  const available = users.filter(
    (user) =>
      user.role !== "ADMIN" &&
      !team.members.some((member) => member.id === user.id) &&
      `${user.firstName} ${user.lastName} ${user.email}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <Modal
      title="Добавить участника"
      subtitle="Поиск по имени, фамилии или email."
      onClose={close}
      busy={busy}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save(userId);
        }}
      >
        <label>
          Поиск
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Введите данные пользователя"
          />
        </label>
        <label>
          Пользователь
          <select value={userId} onChange={(event) => setUserId(event.target.value)} required>
            <option value="">Выберите пользователя</option>
            {available.map((user) => (
              <option value={user.id} key={user.id}>
                {user.firstName} {user.lastName} — {user.email}
              </option>
            ))}
          </select>
        </label>
        {!available.length && <p className="form-hint">Подходящие пользователи не найдены.</p>}
        <div className="form-actions">
          <SecondaryButton type="button" onClick={close}>
            Отмена
          </SecondaryButton>
          <Button variant="primary" className="primary" loading={busy}>
            {busy ? "Добавление…" : "Добавить участника"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
