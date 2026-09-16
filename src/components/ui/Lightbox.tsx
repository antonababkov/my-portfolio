"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, type MouseEvent as ReactMouseEvent } from "react";
import styles from "./Lightbox.module.scss";

type LightboxProps = {
  open: boolean;
  src: string;
  alt: string;
  description?: string | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
};

export default function Lightbox({
  open,
  src,
  alt,
  description,
  onClose,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
}: LightboxProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
        return;
      }
      if (e.key === "ArrowRight" && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    frameRef.current?.focus();

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, onPrev, onNext, hasPrev, hasNext]);

  const handleBackdrop = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open || !src) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={handleBackdrop}
      role="presentation"
    >
      <div
        ref={frameRef}
        className={styles.frame}
        role="dialog"
        aria-modal="true"
        aria-label={alt || "Увеличенное фото"}
        tabIndex={-1}
      >
        <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
          ×
        </button>

        {hasPrev && (
          <button
            type="button"
            className={`${styles.nav} ${styles.navPrev}`}
            onClick={onPrev}
            aria-label="Предыдущее фото"
          >
            ‹
          </button>
        )}

        <div className={styles.imageWrap}>
          <Image className={styles.image} src={src} alt={alt} fill quality={90} sizes="100vw" priority />
        </div>

        {hasNext && (
          <button
            type="button"
            className={`${styles.nav} ${styles.navNext}`}
            onClick={onNext}
            aria-label="Следующее фото"
          >
            ›
          </button>
        )}

        {description && <p className={styles.caption}>{description}</p>}
      </div>
    </div>
  );
}