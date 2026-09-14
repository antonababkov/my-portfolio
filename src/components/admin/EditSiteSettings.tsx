"use client";

import { useState } from "react";
import type { Profile } from "@/types";
import styles from "./EditSiteSettings.module.scss";

type EditSiteSettingsProps = {
  profile: Profile;
  onSaved?: (profile: Profile) => void;
};

export default function EditSiteSettings({ profile: initial, onSaved }: EditSiteSettingsProps) {
  const [profile] = useState(initial);
  const [siteTitle, setSiteTitle] = useState(initial.siteTitle);
  const [siteDescription, setSiteDescription] = useState(initial.siteDescription);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  const changed =
    siteTitle !== profile.siteTitle ||
    siteDescription !== profile.siteDescription ||
    email !== profile.email ||
    phone !== profile.phone;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: profile.fullName,
          position: profile.position,
          description: profile.description,
          sliderAutoPlay: profile.sliderAutoPlay,
          siteTitle,
          siteDescription,
          email,
          phone,
        }),
      });
      if (!res.ok) {
        setStatus("error");
        return;
      }
      setStatus("ok");
      onSaved?.({
        ...profile,
        siteTitle,
        siteDescription,
        email,
        phone,
      });
    } catch {
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>Настройки сайта</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.label}>Title (заголовок сайта)</span>
          <input
            className={styles.input}
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            required
          />
          <span className={styles.hint}>
            Отображается в&nbsp;закладке браузера и&nbsp;в&nbsp;результатах поиска. Рекомендуется 50–60&nbsp;символов.
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Description (описание сайта)</span>
          <textarea
            className={styles.textarea}
            value={siteDescription}
            onChange={(e) => setSiteDescription(e.target.value)}
            rows={3}
            required
          />
          <span className={styles.hint}>
            Краткое описание для поисковых систем (meta-тег description). Отображается под&nbsp;заголовком в&nbsp;выдаче Google. Рекомендуется 150–160&nbsp;символов.
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Email</span>
          <input
            className={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Телефон</span>
          <input
            className={styles.input}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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
    </section>
  );
}
