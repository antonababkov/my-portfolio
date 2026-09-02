"use client";

import { useState } from "react";
import type { Project, Photo } from "@/types";
import PhotoManager from "./PhotoManager";
import Modal from "@/components/ui/Modal";
import styles from "./ProjectForm.module.scss";

type ProjectFormProps = {
  project?: Project | null;
  onClose: () => void;
  onSaved: (project: Project) => void;
};

export default function ProjectForm({
  project: initial,
  onClose,
  onSaved,
}: ProjectFormProps) {
  const isNew = !initial;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [photos, setPhotos] = useState<Photo[]>(initial?.photos ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed =
    isNew ||
    title !== initial!.title ||
    description !== initial!.description ||
    (link ?? "") !== (initial!.link ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: Record<string, string> = { title, description, link };

    try {
      const url = initial?.id
        ? `/api/projects/${initial.id}`
        : "/api/projects";
      const method = initial?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Не удалось сохранить");
        return;
      }

      onSaved({
        id: data.id,
        title: data.title,
        description: data.description,
        link: data.link ?? null,
        order: data.order,
        photos: initial?.photos ?? [],
      });
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={isNew ? "Новый проект" : "Редактирование проекта"}
      onClose={onClose}
      footer={
        <div className={styles.footer}>
          <button className={styles.cancelBtn} type="button" onClick={onClose}>
            Отмена
          </button>
          <button
            className={styles.saveBtn}
            type="submit"
            form="project-form"
            disabled={saving || (!isNew && !changed)}
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </button>
        </div>
      }
    >
      <form id="project-form" className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Название</span>
          <input
            className={styles.input}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Описание</span>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Ссылка (необязательно)</span>
          <input
            className={styles.input}
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://"
          />
        </label>

        {error && <p className={styles.error} role="alert">{error}</p>}
      </form>

      {initial?.id && (
        <div className={styles.photos}>
          <h3 className={styles.photosTitle}>Фотографии проекта</h3>
          <PhotoManager
            photos={photos}
            owner={{ projectId: initial.id }}
            onChange={setPhotos}
          />
        </div>
      )}

      {isNew && (
        <p className={styles.hint}>
          Фотографии можно добавить после сохранения проекта.
        </p>
      )}
    </Modal>
  );
}