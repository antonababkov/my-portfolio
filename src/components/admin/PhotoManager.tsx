"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import ImageUploader from "./ImageUploader";
import { photoUrl } from "@/lib/photoUrl";
import styles from "./PhotoManager.module.scss";

type Photo = {
  id: string;
  url: string;
  alt: string;
  description: string | null;
  order: number;
};

type Owner =
  | { profileId: string }
  | { projectId: string };

type PhotoManagerProps = {
  photos: Photo[];
  owner: Owner;
  onChange: Dispatch<SetStateAction<Photo[]>>;
  onPhotosChange?: (photos: Photo[]) => void;
};

export default function PhotoManager({ photos, owner, onChange, onPhotosChange }: PhotoManagerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const sorted = [...photos].sort((a, b) => a.order - b.order);

  async function attach(url: string, name: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, alt: name, ...owner }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось добавить фото");
        return;
      }
      const next = [...photos, data];
      onChange(next);
      onPhotosChange?.(next);
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setBusy(false);
    }
  }

  async function remove(photo: Photo) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" });
      if (!res.ok) {
        setError("Не удалось удалить фото");
        return;
      }
      const next = photos.filter((p) => p.id !== photo.id);
      onChange(next);
      onPhotosChange?.(next);
    } finally {
      setBusy(false);
    }
  }

  async function updateDescription(photo: Photo, description: string) {
    setSaving(photo.id);
    setError(null);
    try {
      const res = await fetch(`/api/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось сохранить описание");
        return;
      }
      const next = photos.map((p) =>
        p.id === photo.id ? { ...p, description: data.description } : p
      );
      onChange(next);
      onPhotosChange?.(next);
    } catch {
      setError("Ошибка сохранения описания");
    } finally {
      setSaving(null);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const list = [...sorted];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;

    const [item] = list.splice(index, 1);
    list.splice(target, 0, item);

    const items = list.map((p, i) => ({ id: p.id, order: i }));
    const byId = new Map(photos.map((p) => [p.id, p]));
    const next = list.map((p, i) => ({ ...(byId.get(p.id) ?? p), order: i }));
    onChange(next);
    onPhotosChange?.(next);
    setError(null);

    try {
      const res = await fetch("/api/photos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        setError("Не удалось сохранить порядок");
      }
    } catch {
      setError("Ошибка сохранения порядка");
    }
  }

  return (
    <div className={styles.wrapper}>
      <ImageUploader
        onUploaded={attach}
        disabled={busy}
        variant={"profileId" in owner ? "profile" : "project"}
      />

      {error && <p className={styles.error} role="alert">{error}</p>}

      {sorted.length > 0 && (
        <ul className={styles.list}>
          {sorted.map((photo, index) => (
            <li key={photo.id} className={styles.item}>
              <div className={styles.thumb}>
                <Image
                  src={photoUrl(photo.url)}
                  alt={photo.alt}
                  width={96}
                  height={96}
                  className={styles.image}
                />
              </div>

              <div className={styles.meta}>
                <span className={styles.name} title={photo.alt}>
                  {photo.alt || "Без подписи"}
                </span>

                {"projectId" in owner && (
                  <form
                    className={styles.descForm}
                    onSubmit={(e) => {
                      e.preventDefault();
                      const input = e.currentTarget.elements.namedItem("description") as
                        | HTMLInputElement
                        | HTMLTextAreaElement;
                      updateDescription(photo, input.value.trim());
                    }}
                  >
                    <textarea
                      name="description"
                      className={styles.descInput}
                      placeholder="Описание фото"
                      rows={2}
                      maxLength={1000}
                      defaultValue={photo.description ?? ""}
                    />
                    <button
                      type="submit"
                      className={styles.descSave}
                      disabled={saving === photo.id}
                    >
                      {saving === photo.id ? "…" : "Сохранить"}
                    </button>
                  </form>
                )}

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Переместить выше"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => move(index, 1)}
                    disabled={index === sorted.length - 1}
                    aria-label="Переместить ниже"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.danger}`}
                    onClick={() => remove(photo)}
                    aria-label="Удалить фото"
                  >
                    ×
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}