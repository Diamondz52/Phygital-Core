"use client";
/* eslint-disable @next/next/no-img-element */
import { Button } from "@/shared/ui/Button";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImageIcon, Plus, Upload, X } from "lucide-react";
import { type Tournament } from "@/entities/tournament";
import { type TournamentDraft } from "@/entities/platform";
import { Modal } from "@/shared/ui/Modal";
import { SecondaryButton } from "@/shared/ui/Button";
import { ActionError } from "@/shared/ui/ActionError";
export function TournamentForm({
  tournament,
  close,
  save,
  busy,
}: {
  tournament: Tournament | null;
  close: () => void;
  save: (draft: TournamentDraft) => void;
  busy: boolean;
}) {
  const initialStart = tournament?.startAt ?? "",
    initialEnd = tournament?.endAt ?? "";
  const [name, setName] = useState(tournament?.name ?? ""),
    [shortDescription, setShortDescription] = useState(tournament?.shortDescription ?? ""),
    [fullDescription, setFullDescription] = useState(tournament?.description ?? ""),
    [city, setCity] = useState(tournament?.city ?? ""),
    [startDate, setStartDate] = useState(initialStart.slice(0, 10)),
    [startTime, setStartTime] = useState(initialStart.slice(11, 16)),
    [endDate, setEndDate] = useState(initialEnd.slice(0, 10)),
    [endTime, setEndTime] = useState(initialEnd.slice(11, 16)),
    [showStartTime, setShowStartTime] = useState(true),
    [showEndDate, setShowEndDate] = useState(true),
    [showEndTime, setShowEndTime] = useState(true),
    [imageName, setImageName] = useState(tournament?.imageName ?? ""),
    [preview, setPreview] = useState(tournament?.imageUrl ?? ""),
    [reading, setReading] = useState(false),
    [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (
      file.size > 5 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp", "image/avif"].includes(file.type)
    ) {
      setError("Выберите PNG, JPG, WebP или AVIF размером до 5 МБ");
      event.target.value = "";
      return;
    }
    setError("");
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setImageName(file.name);
      setPreview(String(reader.result));
      setReading(false);
    };
    reader.onerror = () => {
      setError("Не удалось прочитать изображение");
      setReading(false);
    };
    reader.readAsDataURL(file);
  };
  const removeImage = () => {
    setPreview("");
    setImageName("");
    if (inputRef.current) inputRef.current.value = "";
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const startAt = `${startDate}T${startTime || "00:00"}`,
      endAt = endDate ? `${endDate}T${endTime || "23:59"}` : "";
    if (!endAt) {
      setError("Укажите дату и время окончания");
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setError("Дата и время окончания должны быть позднее начала");
      return;
    }
    setError("");
    if (reading) {
      setError("Дождитесь загрузки изображения");
      return;
    }
    save({
      name,
      shortDescription,
      fullDescription,
      city,
      startAt,
      endAt,
      imageName,
      imageUrl: preview,
    });
  };
  return (
    <Modal
      title={tournament ? "Редактирование турнира" : "Создание турнира"}
      subtitle="Статус рассчитывается автоматически по указанным датам."
      onClose={close}
      busy={busy}
    >
      <form onSubmit={submit} className="tournament-editor">
        <label>
          <span>
            Название турнира <b className="required">*</b>
          </span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label>
          <span>
            Краткое описание <b className="required">*</b>
          </span>
          <textarea
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
            required
            maxLength={500}
          />
          <small>{shortDescription.length}/500</small>
        </label>
        <label>
          <span>
            Полное описание <small>необязательно</small>
          </span>
          <textarea
            value={fullDescription}
            onChange={(event) => setFullDescription(event.target.value)}
            maxLength={4000}
          />
        </label>
        <label>
          <span>
            Город <b className="required">*</b>
          </span>
          <input value={city} onChange={(event) => setCity(event.target.value)} required />
        </label>
        <div className="file-picker">
          <input
            ref={inputRef}
            hidden
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif"
            onChange={selectImage}
          />
          {preview ? <img src={preview} alt="Предпросмотр изображения турнира" /> : <ImageIcon />}
          <div>
            <b>{imageName || "Изображение турнира"}</b>
            <small>PNG, JPG, WebP или AVIF, до 5 МБ</small>
          </div>
          <Button
            variant="secondary"
            type="button"
            className="secondary"
            onClick={() => inputRef.current?.click()}
          >
            <Upload /> {imageName ? "Заменить" : "Выбрать"}
          </Button>
          {imageName && (
            <button
              type="button"
              className="icon-button"
              aria-label="Удалить изображение"
              onClick={removeImage}
            >
              <X />
            </button>
          )}
        </div>
        <div className="date-builder">
          <label>
            <span>
              Дата начала <b className="required">*</b>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
            />
          </label>
          {showStartTime ? (
            <label className="optional-field">
              <span>
                Время начала{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowStartTime(false);
                    setStartTime("");
                  }}
                  aria-label="Удалить время начала"
                >
                  <X />
                </button>
              </span>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                required
              />
            </label>
          ) : (
            <button
              type="button"
              className="secondary add-optional"
              onClick={() => setShowStartTime(true)}
            >
              <Plus /> Добавить время начала
            </button>
          )}
          {showEndDate ? (
            <label className="optional-field">
              <span>
                Дата окончания{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowEndDate(false);
                    setShowEndTime(false);
                    setEndDate("");
                    setEndTime("");
                  }}
                  aria-label="Удалить дату окончания"
                >
                  <X />
                </button>
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </label>
          ) : (
            <button
              type="button"
              className="secondary add-optional"
              onClick={() => setShowEndDate(true)}
            >
              <Plus /> Добавить дату окончания
            </button>
          )}
          {showEndDate &&
            (showEndTime ? (
              <label className="optional-field">
                <span>
                  Время окончания{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEndTime(false);
                      setEndTime("");
                    }}
                    aria-label="Удалить время окончания"
                  >
                    <X />
                  </button>
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  required
                />
              </label>
            ) : (
              <button
                type="button"
                className="secondary add-optional"
                onClick={() => setShowEndTime(true)}
              >
                <Plus /> Добавить время окончания
              </button>
            ))}
        </div>
        <ActionError message={error} />
        <div className="form-actions">
          <SecondaryButton type="button" onClick={close}>
            Отмена
          </SecondaryButton>
          <Button variant="primary" className="primary" disabled={busy || reading}>
            {busy ? "Сохранение…" : tournament ? "Сохранить" : "Создать турнир"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
