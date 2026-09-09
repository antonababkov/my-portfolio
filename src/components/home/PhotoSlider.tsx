import Image from "next/image";
import Slider from "@/components/ui/Slider";
import type { Photo } from "@/types";
import styles from "./PhotoSlider.module.scss";

type PhotoSliderProps = {
  photos: Photo[];
  autoPlay?: boolean;
  aspectRatio?: string;
};

export default function PhotoSlider({
  photos,
  autoPlay = true,
  aspectRatio = "4 / 5",
}: PhotoSliderProps) {
  if (photos.length === 0) {
    return (
      <div className={styles.placeholder} style={{ aspectRatio }}>
        Фото пока не добавлены
      </div>
    );
  }

  const slides = photos.map((photo, index) => (
    <div
      className={photos.length > 1 ? `${styles.slideItem} ${styles.withDots}` : styles.slideItem}
      key={photo.id}
    >
      <div className={styles.imageWrap} style={{ aspectRatio }}>
        <Image
          src={photo.url}
          alt={photo.alt}
          fill
          priority={index === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
          className={styles.image}
        />
      </div>
      {photo.description && (
        <p className={styles.caption}>{photo.description}</p>
      )}
    </div>
  ));

  return (
    <Slider
      items={slides}
      autoPlay={autoPlay}
      ariaLabel="Фотографии профиля"
    />
  );
}