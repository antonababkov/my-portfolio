"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import styles from "./Slider.module.scss";

type SliderProps = {
  items: ReactNode[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  slideDuration?: number;
  ariaLabel?: string;
};

export default function Slider({
  items,
  autoPlay = false,
  autoPlayInterval = 4000,
  showArrows = true,
  showDots = true,
  slideDuration = 500,
  ariaLabel = "Слайдер",
}: SliderProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const touchX = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const count = items.length;

  const goTo = useCallback(
    (next: number, dir: "left" | "right") => {
      setDirection(dir);
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  const next = useCallback(() => goTo(index + 1, "right"), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1, "left"), [goTo, index]);

  useEffect(() => {
    if (!autoPlay || count <= 1) return;
    timer.current = setInterval(next, autoPlayInterval);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [autoPlay, autoPlayInterval, count, next]);

  const stopAuto = () => {
    if (timer.current) clearInterval(timer.current);
  };

  const startAuto = () => {
    if (autoPlay && count > 1) {
      timer.current = setInterval(next, autoPlayInterval);
    }
  };

  const handleTouchStart = (e: ReactTouchEvent) => {
    stopAuto();
    touchX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: ReactTouchEvent) => {
    if (touchX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(delta) > 50) {
      if (delta < 0) next();
      else prev();
    }
    touchX.current = null;
    startAuto();
  };

  if (count === 0) return null;

  return (
    <div
      className={styles.slider}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={stopAuto}
      onMouseLeave={startAuto}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={styles.viewport}
        style={{ ["--slide-duration" as string]: `${slideDuration}ms` }}
      >
        <div
          className={`${styles.track} ${styles[direction]}`}
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className={styles.slide}
              role="group"
              aria-roledescription="slide"
              aria-label={`Слайд ${i + 1} из ${count}`}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {showArrows && count > 1 && (
        <>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowLeft}`}
            onClick={prev}
            aria-label="Предыдущий слайд"
          >
            &lt;
          </button>
          <button
            type="button"
            className={`${styles.arrow} ${styles.arrowRight}`}
            onClick={next}
            aria-label="Следующий слайд"
          >
            &gt;
          </button>
        </>
      )}

      {showDots && count > 1 && (
        <div className={styles.dots} aria-label="Навигация по слайдам">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.dot} ${i === index ? styles.dotActive : ""}`}
              onClick={() => goTo(i, i > index ? "right" : "left")}
              aria-label={`Перейти к слайду ${i + 1}`}
              aria-current={i === index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
