import Image from "next/image";
import Slider from "@/components/ui/Slider";
import type { Project } from "@/types";
import styles from "./ProjectCard.module.scss";

type ProjectCardProps = {
  project: Project;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const slides =
    project.photos.length > 0
      ? project.photos.map((photo, i) => (
          <div key={photo.id} className={styles.slideItem}>
            <Image
              src={photo.url}
              alt={photo.alt}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              loading={i === 0 ? "eager" : "lazy"}
              className={styles.image}
            />
          </div>
        ))
      : null;

  return (
    <section className={styles.card} id={`project-${project.id}`} aria-labelledby={`project-title-${project.id}`}>
      <div className={styles.media}>
        {slides ? (
          <Slider
            items={slides}
            ariaLabel={`Фотографии проекта: ${project.title}`}
            slideDuration={400}
          />
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