"use client";

import { useCallback, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import styles from "./PhotoCropper.module.scss";

export type CropRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

const TARGET_SIZE = 500;

type View = {
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
  minFrame: number;
};

type Frame = {
  left: number;
  top: number;
  size: number;
};

type Drag = {
  mode: "move" | "resize";
  startX: number;
  startY: number;
  left: number;
  top: number;
  size: number;
  view: View;
};

type PhotoCropperProps = {
  src: string;
  onCancel: () => void;
  onConfirm: (crop: CropRect) => void;
};

function clamp(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

export default function PhotoCropper({
  src,
  onCancel,
  onConfirm,
}: PhotoCropperProps) {
  const [view, setView] = useState<View | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [ready, setReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const lastRectRef = useRef<{ width: number; height: number } | null>(null);

  const measure = useCallback((naturalWidth: number, naturalHeight: number) => {
    const stage = stageRef.current;
    if (!stage) return false;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;

    const scaleX = naturalWidth / rect.width;
    const scaleY = naturalHeight / rect.height;
    const minFrame = Math.min(
      rect.width,
      rect.height,
      Math.max(
        Math.ceil(TARGET_SIZE / scaleX),
        Math.ceil(TARGET_SIZE / scaleY),
      ),
    );

    const prevRect = lastRectRef.current;
    const rectChanged =
      !prevRect ||
      Math.abs(prevRect.width - rect.width) > 1 ||
      Math.abs(prevRect.height - rect.height) > 1;
    lastRectRef.current = { width: rect.width, height: rect.height };

    setView({
      width: rect.width,
      height: rect.height,
      scaleX,
      scaleY,
      minFrame,
    });
    setFrame((prev) => {
      if (
        prev &&
        !rectChanged &&
        prev.left + prev.size <= rect.width + 1 &&
        prev.top + prev.size <= rect.height + 1
      ) {
        return prev;
      }
      const box = Math.min(rect.width, rect.height);
      return {
        left: Math.max(0, (rect.width - box) / 2),
        top: Math.max(0, (rect.height - box) / 2),
        size: box,
      };
    });
    return true;
  }, []);

  function handleImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    measure(naturalWidth, naturalHeight);
    window.setTimeout(() => {
      const ok = measure(naturalWidth, naturalHeight);
      if (ok) setReady(true);
    }, 350);
  }

  function onFramePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!frame || !view) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      mode: "move",
      startX: e.clientX,
      startY: e.clientY,
      left: frame.left,
      top: frame.top,
      size: frame.size,
      view,
    };
  }

  function onFramePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d || d.mode !== "move") return;
    setFrame((prev) => {
      if (!prev) return prev;
      const left = clamp(
        d.left + (e.clientX - d.startX),
        0,
        Math.max(0, d.view.width - d.size),
      );
      const top = clamp(
        d.top + (e.clientY - d.startY),
        0,
        Math.max(0, d.view.height - d.size),
      );
      return { ...prev, left, top };
    });
  }

  function onHandlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!frame || !view) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      mode: "resize",
      startX: e.clientX,
      startY: e.clientY,
      left: frame.left,
      top: frame.top,
      size: frame.size,
      view,
    };
  }

  function onHandlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = dragRef.current;
    if (!d || d.mode !== "resize") return;
    const delta = Math.max(e.clientX - d.startX, e.clientY - d.startY);
    const size = clamp(
      d.size + delta,
      d.view.minFrame,
      Math.min(d.view.width, d.view.height),
    );
    setFrame((prev) => {
      if (!prev) return prev;
      const left = clamp(d.left, 0, Math.max(0, d.view.width - size));
      const top = clamp(d.top, 0, Math.max(0, d.view.height - size));
      return { left, top, size };
    });
  }

  function onPointerRelease() {
    dragRef.current = null;
  }

  function handleConfirm() {
    if (!frame || !view) return;
    const size = Math.round(frame.size * view.scaleX);
    onConfirm({
      left: Math.round(frame.left * view.scaleX),
      top: Math.round(frame.top * view.scaleY),
      width: size,
      height: size,
    });
  }

  const resultWidth =
    frame && view ? Math.round(frame.size * view.scaleX) : null;
  const resultHeight =
    frame && view ? Math.round(frame.size * view.scaleY) : null;

  return (
    <Modal
      open
      title="Обрезка фото"
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Отмена
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={!view}
          >
            Обрезать и загрузить
          </Button>
        </>
      }
    >
      <div className={styles.preview}>
        <div ref={stageRef} className={styles.stage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className={styles.image}
            draggable={false}
            onLoad={handleImageLoad}
          />
          {ready && frame && view && (
            <>
              <div
                className={styles.shade}
                style={{
                  left: 0,
                  top: 0,
                  width: frame.left,
                  height: view.height,
                }}
              />
              <div
                className={styles.shade}
                style={{
                  left: frame.left + frame.size,
                  top: 0,
                  width: view.width - frame.left - frame.size,
                  height: view.height,
                }}
              />
              <div
                className={styles.shade}
                style={{
                  left: frame.left,
                  top: 0,
                  width: frame.size,
                  height: frame.top,
                }}
              />
              <div
                className={styles.shade}
                style={{
                  left: frame.left,
                  top: frame.top + frame.size,
                  width: frame.size,
                  height: view.height - frame.top - frame.size,
                }}
              />
              <div
                className={styles.frame}
                style={{
                  left: frame.left,
                  top: frame.top,
                  width: frame.size,
                  height: frame.size,
                }}
                onPointerDown={onFramePointerDown}
                onPointerMove={onFramePointerMove}
                onPointerUp={onPointerRelease}
                onPointerCancel={onPointerRelease}
              >
                <div className={styles.grid} />
                <div
                  className={styles.handle}
                  onPointerDown={onHandlePointerDown}
                  onPointerMove={onHandlePointerMove}
                  onPointerUp={onPointerRelease}
                  onPointerCancel={onPointerRelease}
                />
              </div>
            </>
          )}
        </div>
        <p className={styles.size}>
          {resultWidth && resultHeight
            ? `${resultWidth} × ${resultHeight} px`
            : ""}
        </p>
        <p className={styles.hint}>
          Перетащите рамку, чтобы выбрать область, потяните за кружок для
          масштаба. Готовое фото будет ровно 500 × 500 px.
        </p>
      </div>
    </Modal>
  );
}
