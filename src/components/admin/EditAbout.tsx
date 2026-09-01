"use client";

import { useState } from "react";
import type { Profile, Photo } from "@/types";
import PhotoManager from "./PhotoManager";
import styles from "./EditAbout.module.scss";

type EditAboutProps = {
  profile: Profile;
  onSaved?: (profile: Profile) => void;
};

export default function EditAbout({ profile: initial, onSaved }: EditAboutProps) {
  const [profile] = useState(initial);
  const [fullName, setFullName] = useState(initial.fullName);
  const [position, setPosition] = useState(initial.position);
  const [description, setDescription] = useState(initial.description);
  const [photos, setPhotos] = useState<Photo[]>(initial.photos);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const changed =
    fullName !== profile.fullName ||
    position !== profile.position ||
    description !== profile.description;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, position, description }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("ok");
      onSaved?.({ ...profile, fullName, position, description, photos });
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>О себе</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>ФИО</span>
          <input
            className={styles.input}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Должность</span>
          <input
            className={styles.input}
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Описание</span>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />
        </label>

        {status === "ok" && (
          <p className={styles.ok}>Сохранено</p>
        )}
        {status === "error" && (
          <p className={styles.error}>Не удалось сохранить</p>
        )}

        <button
          className={styles.save}
          type="submit"
          disabled={saving || !changed}
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
      </form>

      <div className={styles.photos}>
        <h3 className={styles.subheading}>Фотографии профиля</h3>
        <PhotoManager
          photos={photos}
          owner={{ profileId: profile.id }}
          onChange={setPhotos}
        />
      </div>
    </section>
  );
}