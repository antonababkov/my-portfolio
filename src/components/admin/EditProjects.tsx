"use client";

import { useState } from "react";
import type { Project } from "@/types";
import Modal from "@/components/ui/Modal";
import ProjectForm from "./ProjectForm";
import styles from "./EditProjects.module.scss";

type EditProjectsProps = {
  projects: Project[];
  onChange: (projects: Project[]) => void;
};

type ModalState =
  | { mode: "new" }
  | { mode: "edit"; projectId: string };

export default function EditProjects({ projects, onChange }: EditProjectsProps) {
  const [modal, setModal] = useState<null | ModalState>(null);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const editing =
    modal?.mode === "edit" && modal.projectId
      ? projects.find((p) => p.id === modal.projectId)
      : null;

  async function handleDelete(project: Project) {
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onChange(projects.filter((p) => p.id !== project.id));
        setDeleting(null);
      }
    } finally {
      setBusy(false);
    }
  }

  function handleSaved(project: Project) {
    if (projects.find((p) => p.id === project.id)) {
      onChange(
        projects.map((p) => (p.id === project.id ? { ...p, ...project } : p))
      );
    } else {
      onChange([...projects, project]);
    }
    setModal(null);
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= projects.length) return;

    const list = [...projects];
    const [item] = list.splice(index, 1);
    list.splice(target, 0, item);

    const byId = new Map(projects.map((p) => [p.id, p]));
    const next = list.map((p, i) => ({ ...(byId.get(p.id) ?? p), order: i }));
    onChange(next);
    setReorderError(null);

    try {
      const res = await fetch("/api/projects", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: next.map((p) => ({ id: p.id, order: p.order })),
        }),
      });
      if (!res.ok) {
        setReorderError("Не удалось сохранить порядок проектов");
      }
    } catch {
      setReorderError("Ошибка сохранения порядка проектов");
    }
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.heading}>Проекты</h2>
        <button
          className={styles.addBtn}
          type="button"
          onClick={() => setModal({ mode: "new" })}
        >
          Добавить проект
        </button>
      </header>

      {projects.length === 0 && (
        <p className={styles.muted}>Проектов пока нет</p>
      )}

      <ul className={styles.list}>
        {projects.map((project, index) => (
          <li key={project.id} className={styles.item}>
            <div className={styles.itemContent}>
              <span className={styles.itemTitle}>{project.title}</span>
              <span className={styles.itemMeta}>
                {project.photos.length} фото
                {project.link && (
                  <> · <a href={project.link} target="_blank" rel="noopener noreferrer" className={styles.link}>ссылка</a></>
                )}
              </span>
            </div>
            <div className={styles.itemActions}>
              <span className={styles.moveGroup}>
                <button
                  className={styles.moveBtn}
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Переместить выше"
                >
                  ↑
                </button>
                <button
                  className={styles.moveBtn}
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === projects.length - 1}
                  aria-label="Переместить ниже"
                >
                  ↓
                </button>
              </span>
              <button
                className={styles.editBtn}
                type="button"
                onClick={() => setModal({ mode: "edit", projectId: project.id })}
              >
                Редактировать
              </button>
              <button
                className={styles.deleteBtn}
                type="button"
                onClick={() => setDeleting(project)}
              >
                Удалить
              </button>
            </div>
          </li>
        ))}
      </ul>

      {reorderError && <p className={styles.error} role="alert">{reorderError}</p>}

      {modal && (
        <ProjectForm
          project={modal.mode === "edit" ? editing : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onPhotosChange={(updatedPhotos) => {
            if (modal.mode === "edit" && modal.projectId) {
              onChange(
                projects.map((p) =>
                  p.id === modal.projectId
                    ? { ...p, photos: updatedPhotos }
                    : p
                )
              );
            }
          }}
        />
      )}

      {deleting && (
        <Modal
          open
          title="Удаление проекта"
          onClose={() => setDeleting(null)}
          footer={
            <div className={styles.footer}>
              <button
                className={styles.cancelBtn}
                type="button"
                onClick={() => setDeleting(null)}
              >
                Отмена
              </button>
              <button
                className={styles.confirmDeleteBtn}
                type="button"
                disabled={busy}
                onClick={() => handleDelete(deleting)}
              >
                {busy ? "Удаление…" : "Удалить"}
              </button>
            </div>
          }
        >
          <p className={styles.muted}>
            Удалить проект «{deleting.title}»? Это действие необратимо.
          </p>
        </Modal>
      )}
    </section>
  );
}