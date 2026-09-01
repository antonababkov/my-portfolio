"use client";

import { useEffect, useState } from "react";
import type { Profile, Project } from "@/types";
import EditAbout from "./EditAbout";
import EditProjects from "./EditProjects";
import LogoutButton from "./LogoutButton";
import styles from "./AdminDashboard.module.scss";

type Tab = "about" | "projects";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("about");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetch("/api/profile", { signal: controller.signal }),
      fetch("/api/projects", { signal: controller.signal }),
    ])
      .then(async ([profileRes, projectsRes]) => {
        const [profileData, projectsData] = await Promise.all([
          profileRes.ok ? profileRes.json() : null,
          projectsRes.ok ? projectsRes.json() : [],
        ]);
        setProfile(profileData);
        setProjects(projectsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>Админ-панель</h1>
        <LogoutButton />
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "about" ? styles.active : ""}`}
          type="button"
          onClick={() => setTab("about")}
        >
          О себе
        </button>
        <button
          className={`${styles.tab} ${tab === "projects" ? styles.active : ""}`}
          type="button"
          onClick={() => setTab("projects")}
        >
          Проекты
        </button>
      </nav>

      <div className={styles.content}>
        {loading && <p className={styles.muted}>Загрузка…</p>}

        {!loading && tab === "about" && profile && (
          <EditAbout profile={profile} onSaved={setProfile} />
        )}

        {!loading && tab === "about" && !profile && (
          <p className={styles.muted}>Профиль не найден</p>
        )}

        {!loading && tab === "projects" && (
          <EditProjects projects={projects} onChange={setProjects} />
        )}
      </div>
    </main>
  );
}