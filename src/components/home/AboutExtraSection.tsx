import type { Profile } from "@/types";
import styles from "./AboutExtraSection.module.scss";

type AboutExtraSectionProps = {
  profile: Profile;
};

export default function AboutExtraSection({ profile }: AboutExtraSectionProps) {
  if (!profile.aboutExtraVisible || !profile.aboutExtra.trim()) return null;

  return (
    <section className={styles.section} id="about-extra" aria-labelledby="about-extra-title">
      <header className={styles.header}>
        <h2 id="about-extra-title" className={styles.heading}>
          {profile.aboutExtraTitle}
        </h2>
      </header>
      <div className={styles.content}>{profile.aboutExtra}</div>
    </section>
  );
}