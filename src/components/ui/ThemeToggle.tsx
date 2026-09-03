"use client";

import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getAppliedTheme,
  subscribeTheme,
  type Theme,
} from "@/lib/theme";
import styles from "./ThemeToggle.module.scss";

export default function ThemeToggle() {
  const theme = useSyncExternalStore<Theme>(
    subscribeTheme,
    getAppliedTheme,
    () => "light"
  );
  const isDark = theme === "dark";

  const handleToggle = () => {
    applyTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={handleToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Выключить тёмную тему" : "Включить тёмную тему"}
      title={isDark ? "Светлая тема" : "Тёмная тема"}
    >
      <span className={styles.icon} aria-hidden="true">
        {isDark ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}