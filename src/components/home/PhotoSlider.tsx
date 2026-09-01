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

  const slides = photos.map((photo) => (
    <div className={styles.slideItem} key={photo.id} style={{ aspectRatio }}>
      <Image
        src={photo.url}
        alt={photo.alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className={styles.image}
      />
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