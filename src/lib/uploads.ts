import { unlink } from "node:fs/promises";
import path from "node:path";

/** Папка, куда сохраняются загруженные файлы. */
export const uploadsDir = path.join(process.cwd(), "public", "uploads");

/** Ожидаемый формат публичного url файла: /uploads/<name>.<ext>. */
export const UPLOAD_URL_PATTERN =
  /^\/uploads\/[A-Za-z0-9][A-Za-z0-9._-]{0,63}\.(jpe?g|png|webp)$/;

/**
 * Резолвит публичный url в абсолютный путь внутри uploadsDir.
 * Возвращает null, если url не соответствует ожидаемому формату —
 * такие файлы нельзя читать/удалять (защита от path traversal).
 */
export function filePathFromUploadUrl(url: string): string | null {
  if (!UPLOAD_URL_PATTERN.test(url)) {
    return null;
  }
  return path.join(uploadsDir, path.basename(url));
}

/** Удаляет файл по публичному url. Отсутствие файла ошибкой не считается. */
export async function removeUploadedFile(url: string): Promise<void> {
  const filePath = filePathFromUploadUrl(url);
  if (!filePath) {
    return;
  }

  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error(`Failed to delete uploaded file ${url}:`, error);
    }
  }
}