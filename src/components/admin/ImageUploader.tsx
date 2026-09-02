"use client";

import { useRef, useState } from "react";
import styles from "./ImageUploader.module.scss";

type ImageUploaderProps = {
  onUploaded: (url: string, name: string) => void;
  label?: string;
  disabled?: boolean;
};

export default function ImageUploader({
  onUploaded,
  label = "Перетащите изображение сюда или нажмите для выбора",
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    setError(null);
    const imageFiles = Array.from(files).filter((f) =>
      ["image/jpeg", "image/png", "image/webp"].includes(f.type)
    );

    if (imageFiles.length === 0) {
      setError("Поддерживаются только JPEG, PNG и WebP");
      return;
    }

    setBusy(true);
    try {
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`«${file.name}» больше 5 МБ`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Не удалось загрузить файл");
          continue;
        }
        onUploaded(data.url, file.name);
      }
    } catch {
      setError("Ошибка соединения с сервером");
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (!disabled) uploadFiles(e.dataTransfer.files);
  }

  return (
    <div>
      <div
        className={`${styles.dropzone} ${dragging ? styles.dragging : ""} ${
          busy || disabled ? styles.busy : ""
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " "))
            inputRef.current?.click();
        }}
      >
        <span className={styles.text}>
          {busy ? "Загрузка…" : label}
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) uploadFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}