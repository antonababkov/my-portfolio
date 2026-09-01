import PhotoSlider from "@/components/home/PhotoSlider";
import type { Profile } from "@/types";
import styles from "./AboutSection.module.scss";

type AboutSectionProps = {
  profile: Profile;
};

export default function AboutSection({ profile }: AboutSectionProps) {
  return (
    <section className={styles.about} id="about">
      <div className={styles.media}>
        <PhotoSlider photos={profile.photos} />
      </div>
      <div className={styles.content}>
        <h1 className={styles.name}>{profile.fullName}</h1>
        <h2 className={styles.position}>{profile.position}</h2>
        <p className={styles.description}>{profile.description}</p>
      </div>
    </section>
  );
}