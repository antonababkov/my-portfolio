"use client";

import { useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type TouchEvent as ReactTouchEvent } from "react";
import Image from "next/image";
import Slider from "@/components/ui/Slider";
import Lightbox from "@/components/ui/Lightbox";
import { photoUrl } from "@/lib/photoUrl";
import type { Photo } from "@/types";
import styles from "./ProjectGallery.module.scss";

type ProjectGalleryProps = {
  photos: Photo[];
};

export default function ProjectGallery({ photos }: ProjectGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  if (photos.length === 0) return null;

  const activePhoto = openIndex !== null ? photos[openIndex] : null;
  const navigable = photos.length > 1;

  const openSlide = (index: number) => {
    if (swiped.current) {
      swiped.current = false;
      return;
    }
    setOpenIndex(index);
  };

  const onSlideTouchStart = (e: ReactTouchEvent) => {
    swiped.current = false;
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onSlideTouchEnd = (e: ReactTouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.hypot(dx, dy) > 10) swiped.current = true;
    touchStart.current = null;
  };

  const onSlideKeyDown = (e: ReactKeyboardEvent, index: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpenIndex(index);
    }
  };

  const slides = photos.map((photo, index) => (
    <div
      key={photo.id}
      className={
        photos.length > 1
          ? `${styles.slideItem} ${styles.withDots}`
          : styles.slideItem
      }
      role="button"
      tabIndex={0}
      aria-label="Увеличить фото"
      onClick={() => openSlide(index)}
      onKeyDown={(e) => onSlideKeyDown(e, index)}
      onTouchStart={onSlideTouchStart}
      onTouchEnd={onSlideTouchEnd}
    >
      <div className={styles.imageWrap}>
        <Image
          src={photoUrl(photo.url)}
          alt={photo.alt}
          fill
          quality={90}
          sizes="(max-width: 768px) 100vw, 50vw"
          loading={index === 0 ? "eager" : "lazy"}
          className={styles.image}
        />
      </div>
      {photo.description && (
        <p className={styles.caption}>{photo.description}</p>
      )}
    </div>
  ));

  return (
    <>
      <Slider
        items={slides}
        ariaLabel="Фотографии проекта"
        slideDuration={400}
      />

      <Lightbox
        open={openIndex !== null}
        src={activePhoto ? photoUrl(activePhoto.url) : ""}
        alt={activePhoto?.alt ?? ""}
        description={activePhoto?.description}
        hasPrev={navigable}
        hasNext={navigable}
        onPrev={() =>
          setOpenIndex((i) =>
            i === null ? i : (i - 1 + photos.length) % photos.length
          )
        }
        onNext={() =>
          setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length))
        }
        onClose={() => setOpenIndex(null)}
      />
    </>
  );
}