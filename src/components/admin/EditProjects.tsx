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

export default function EditProjects({ projects, onChange }: EditProjectsProps) {
  const [modal, setModal] = useState<
    | null
    | { mode: "new" }
    | { mode: "edit"; project: Project }
  >();
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);

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
        {projects.map((project) => (
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
              <button
                className={styles.editBtn}
                type="button"
                onClick={() => setModal({ mode: "edit", project })}
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

      {modal && (
        <ProjectForm
          project={modal.mode === "edit" ? modal.project : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
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