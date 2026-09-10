import ProjectGallery from "./ProjectGallery";
import type { Project } from "@/types";
import styles from "./ProjectCard.module.scss";

type ProjectCardProps = {
  project: Project;
  reversed?: boolean;
};

export default function ProjectCard({ project, reversed = false }: ProjectCardProps) {
  const classes = reversed
    ? `${styles.card} ${styles.reversed}`
    : styles.card;

  return (
    <section className={classes} id={`project-${project.id}`} aria-labelledby={`project-title-${project.id}`}>
      <div className={styles.media}>
        {project.photos.length > 0 ? (
          <ProjectGallery photos={project.photos} />
        ) : (
          <div className={styles.placeholder}>Фото пока не добавлены</div>
        )}
      </div>

      <div className={styles.body}>
        <h3 id={`project-title-${project.id}`} className={styles.title}>
          {project.title}
        </h3>
        <p className={styles.description}>{project.description}</p>
        {project.link && (
          <a
            className={styles.link}
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
          >
            Открыть проект
          </a>
        )}
      </div>
    </section>
  );
}