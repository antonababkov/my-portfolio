"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Profile, SocialLink } from "@/types";
import { PRIVACY_POLICY_TEXT, PERSONAL_DATA_POLICY_TEXT } from "@/lib/constants";
import { SOCIAL_LINKS_MAX } from "@/lib/socialLinks";
import styles from "./EditSiteSettings.module.scss";

type EditSiteSettingsProps = {
  profile: Profile;
  onSaved?: (profile: Profile) => void;
};

export default function EditSiteSettings({ profile: initial, onSaved }: EditSiteSettingsProps) {
  const router = useRouter();
  const [profile] = useState(initial);
  const [siteTitle, setSiteTitle] = useState(initial.siteTitle);
  const [siteDescription, setSiteDescription] = useState(initial.siteDescription);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [operatorAddress, setOperatorAddress] = useState(initial.operatorAddress);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(
    initial.socialLinks ?? []
  );
  const [privacyPolicy, setPrivacyPolicy] = useState(
    initial.privacyPolicy.trim() || PRIVACY_POLICY_TEXT,
  );
  const [personalDataPolicy, setPersonalDataPolicy] = useState(
    initial.personalDataPolicy.trim() || PERSONAL_DATA_POLICY_TEXT,
  );
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const changed =
    siteTitle !== profile.siteTitle ||
    siteDescription !== profile.siteDescription ||
    email !== profile.email ||
    phone !== profile.phone ||
    operatorAddress !== profile.operatorAddress ||
    privacyPolicy !== (profile.privacyPolicy.trim() || PRIVACY_POLICY_TEXT) ||
    personalDataPolicy !==
      (profile.personalDataPolicy.trim() || PERSONAL_DATA_POLICY_TEXT) ||
    JSON.stringify(socialLinks) !== JSON.stringify(profile.socialLinks ?? []);

  function addSocialLink() {
    setSocialLinks((current) => [
      ...current,
      { id: crypto.randomUUID(), label: "", url: "" },
    ]);
  }

  function updateSocialLink(index: number, patch: Partial<SocialLink>) {
    setSocialLinks((current) =>
      current.map((link, i) => (i === index ? { ...link, ...patch } : link))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatus("idle");
    setErrorMessage(null);

    const links = socialLinks
      .map((link) => ({
        ...link,
        label: link.label.trim(),
        url: link.url.trim(),
      }))
      .filter((link) => link.label !== "" || link.url !== "");

    if (links.some((link) => link.label === "" || link.url === "")) {
      setErrorMessage("Для каждой ссылки укажите название и URL");
      setStatus("error");
      setSaving(false);
      return;
    }

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
          operatorAddress,
          privacyPolicy,
          personalDataPolicy,
          socialLinks: links,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErrorMessage(data?.error || "Не удалось сохранить");
        setStatus("error");
        return;
      }
      const saved = (await res.json()) as Profile;
      setSocialLinks(saved.socialLinks ?? links);
      setStatus("ok");
      onSaved?.({
        ...profile,
        ...saved,
        socialLinks: saved.socialLinks ?? links,
        photos: profile.photos,
      });
      router.refresh();
    } catch {
      setErrorMessage("Не удалось сохранить");
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

        <label className={styles.field}>
          <span className={styles.label}>Адрес оператора</span>
          <input
            className={styles.input}
            type="text"
            value={operatorAddress}
            onChange={(e) => setOperatorAddress(e.target.value)}
            placeholder="Например: 123456, Москва, ул. Примерная, д. 1"
          />
          <span className={styles.hint}>
            Указывается в&nbsp;политиках в&nbsp;соответствии с&nbsp;152-ФЗ. Если поле пустое, подставляется «адрес уточняется по&nbsp;запросу».
          </span>
        </label>

        <h3 className={styles.subheading}>Соцсети</h3>
        <p className={styles.hint}>
          Название и&nbsp;ссылка появятся в&nbsp;футере и&nbsp;в&nbsp;данных для поисковых систем.
        </p>

        {socialLinks.map((link, index) => (
          <div key={link.id} className={styles.socialRow}>
            <div className={styles.socialFields}>
              <label className={styles.field}>
                <span className={styles.label}>Название</span>
                <input
                  className={styles.input}
                  value={link.label}
                  maxLength={100}
                  placeholder="GitHub"
                  onChange={(e) => updateSocialLink(index, { label: e.target.value })}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.label}>Ссылка</span>
                <input
                  className={styles.input}
                  type="url"
                  value={link.url}
                  maxLength={500}
                  placeholder="https://github.com/..."
                  onChange={(e) => updateSocialLink(index, { url: e.target.value })}
                />
              </label>
            </div>
            <button
              className={styles.removeBtn}
              type="button"
              aria-label={`Удалить ссылку ${link.label || index + 1}`}
              onClick={() =>
                setSocialLinks((current) => current.filter((_, i) => i !== index))
              }
            >
              Удалить
            </button>
          </div>
        ))}

        {socialLinks.length === 0 && (
          <p className={styles.hint}>Ссылок пока нет.</p>
        )}

        <button
          className={styles.addBtn}
          type="button"
          onClick={addSocialLink}
          disabled={socialLinks.length >= SOCIAL_LINKS_MAX}
        >
          Добавить ссылку
        </button>

        <h3 className={styles.subheading}>Документы</h3>

        <label className={styles.field}>
          <span className={styles.label}>Политика конфиденциальности</span>
          <textarea
            className={`${styles.textarea} ${styles.textareaLarge}`}
            value={privacyPolicy}
            onChange={(e) => setPrivacyPolicy(e.target.value)}
            rows={12}
          />
          <span className={styles.hint}>
            Отображается в&nbsp;модальном окне футера сайта. Плейсхолдеры {"{{fullName}}"}, {"{{email}}"}, {"{{phone}}"}, {"{{operatorAddress}}"} подставляются автоматически из&nbsp;настроек сайта.
          </span>
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Правила обработки ПДн</span>
          <textarea
            className={`${styles.textarea} ${styles.textareaLarge}`}
            value={personalDataPolicy}
            onChange={(e) => setPersonalDataPolicy(e.target.value)}
            rows={12}
          />
          <span className={styles.hint}>
            Отображается в&nbsp;модальном окне футера сайта. Плейсхолдеры {"{{fullName}}"}, {"{{email}}"}, {"{{phone}}"}, {"{{operatorAddress}}"} подставляются автоматически из&nbsp;настроек сайта.
          </span>
        </label>

        {status === "ok" && (
          <p className={styles.ok}>Сохранено</p>
        )}
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

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
