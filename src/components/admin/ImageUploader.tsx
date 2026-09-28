"use client";

import { useRef, useState } from "react";
import PhotoCropper, { type CropRect } from "./PhotoCropper";
import styles from "./ImageUploader.module.scss";

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PROFILE_MIN_SIZE = 500;

type ImageUploaderProps = {
  onUploaded: (url: string, name: string) => void | Promise<void>;
  label?: string;
  disabled?: boolean;
  variant?: "profile" | "project";
};

export default function ImageUploader({
  onUploaded,
  label = "Перетащите изображение сюда или нажмите для выбора",
  disabled = false,
  variant = "project",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropFile, setCropFile] = useState<{ file: File; previewUrl: string } | null>(
    null
  );
  const cropResolverRef = useRef<((crop: CropRect | null) => void) | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  function readImageSize(file: File) {
    return new Promise<{ width: number; height: number } | null>((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const size = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(url);
        resolve(size);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }

  function resolveCrop(crop: CropRect | null) {
    cropResolverRef.current?.(crop);
    cropResolverRef.current = null;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setCropFile(null);
  }

  async function startProfileQueue(files: File[]) {
    for (const file of files) {
      setError(null);

      if (file.size > 5 * 1024 * 1024) {
        setError(`«${file.name}» больше 5 МБ`);
        continue;
      }

      setBusy(true);
      let size: { width: number; height: number } | null = null;
      try {
        size = await readImageSize(file);
      } catch {
        size = null;
      }
      setBusy(false);

      if (!size || size.width < PROFILE_MIN_SIZE || size.height < PROFILE_MIN_SIZE) {
        setError(`«${file.name}»: фото должно быть не меньше 500×500 px`);
        continue;
      }

      const crop = await new Promise<CropRect | null>((resolve) => {
        cropResolverRef.current = resolve;
        const previewUrl = URL.createObjectURL(file);
        previewUrlRef.current = previewUrl;
        setCropFile({ file, previewUrl });
      });
      if (!crop) continue;

      setBusy(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("variant", variant);
        formData.append("cropLeft", String(crop.left));
        formData.append("cropTop", String(crop.top));
        formData.append("cropWidth", String(crop.width));
        formData.append("cropHeight", String(crop.height));

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Не удалось загрузить файл");
          continue;
        }
        await onUploaded(data.url, file.name);
      } catch {
        setError("Ошибка соединения с сервером");
      } finally {
        setBusy(false);
      }
    }
  }

  function handleFiles(files: FileList | File[]) {
    if (busy || cropFile) return;
    const imageFiles = Array.from(files).filter((f) => SUPPORTED_TYPES.includes(f.type));

    if (imageFiles.length === 0) {
      setError("Поддерживаются только JPEG, PNG и WebP");
      return;
    }

    if (variant === "profile") {
      void startProfileQueue(imageFiles);
      return;
    }

    void uploadProjectFiles(imageFiles);
  }

  async function uploadProjectFiles(imageFiles: File[]) {
    setError(null);
    setBusy(true);
    try {
      for (const file of imageFiles) {
        if (file.size > 5 * 1024 * 1024) {
          setError(`«${file.name}» больше 5 МБ`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("variant", variant);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Не удалось загрузить файл");
          continue;
        }
        await onUploaded(data.url, file.name);
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
    if (!disabled) handleFiles(e.dataTransfer.files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) handleFiles(e.target.files);
    e.target.value = "";
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
          onChange={handleChange}
        />
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {cropFile && (
        <PhotoCropper
          src={cropFile.previewUrl}
          onCancel={() => resolveCrop(null)}
          onConfirm={(crop) => resolveCrop(crop)}
        />
      )}
    </div>
  );
}