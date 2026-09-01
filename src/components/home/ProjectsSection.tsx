import ProjectCard from "@/components/home/ProjectCard";
import type { Project } from "@/types";
import styles from "./ProjectsSection.module.scss";

type ProjectsSectionProps = {
  projects: Project[];
};

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  if (projects.length === 0) return null;

  return (
    <section className={styles.section} id="projects" aria-labelledby="projects-title">
      <header className={styles.header}>
        <h2 id="projects-title" className={styles.heading}>
          Проекты
        </h2>
      </header>

      <div className={styles.list}>
        {projects.map((project) => (
          <div key={project.id} className={styles.item}>
            <ProjectCard project={project} />
          </div>
        ))}
      </div>
    </section>
  );
}