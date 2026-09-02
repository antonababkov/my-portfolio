"use client";

import { useState } from "react";
import Image from "next/image";
import ImageUploader from "./ImageUploader";
import styles from "./PhotoManager.module.scss";

type Photo = {
  id: string;
  url: string;
  alt: string;
  order: number;
};

type Owner =
  | { profileId: string }
  | { projectId: string };

type PhotoManagerProps = {
  photos: Photo[];
  owner: Owner;
  onChange: (photos: Photo[]) => void;
};

export default function PhotoManager({ photos, owner, onChange }: PhotoManagerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onChange([...photos, data]);
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
      onChange(photos.filter((p) => p.id !== photo.id));
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const list = [...sorted];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;

    const [item] = list.splice(index, 1);
    list.splice(target, 0, item);

    const items = list.map((p, i) => ({ id: p.id, order: i }));
    onChange(
      list.map((p, i) => ({ ...p, order: i }))
    );
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
      <ImageUploader onUploaded={attach} disabled={busy} />

      {error && <p className={styles.error} role="alert">{error}</p>}

      {sorted.length > 0 && (
        <ul className={styles.list}>
          {sorted.map((photo, index) => (
            <li key={photo.id} className={styles.item}>
              <div className={styles.thumb}>
                <Image
                  src={photo.url}
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