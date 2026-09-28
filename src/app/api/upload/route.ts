import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIME_CONF: Record<
  string,
  { ext: string; format: "jpeg" | "png" | "webp" }
> = {
  "image/jpeg": { ext: "jpg", format: "jpeg" },
  "image/png": { ext: "png", format: "png" },
  "image/webp": { ext: "webp", format: "webp" },
};

const PROFILE_MIN_SIZE = 500;

const publicDir = path.join(process.cwd(), "public");
const uploadsDir = path.join(publicDir, "uploads");

export async function POST(request: Request) {
  if (!(await getSessionUser())) {
    return unauthorizedResponse();
  }

  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided (expected a form field named 'file')" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG and WebP images are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File is too large (max 5MB)" },
      { status: 413 }
    );
  }

  const extension = MIME_CONF[file.type].ext;
  const fileName = `${randomUUID()}.${extension}`;

  const variant = formData.get("variant");
  const buffer = Buffer.from(await file.arrayBuffer());

  let output = buffer;
  let outputSize = file.size;

  if (variant === "profile") {
    const metadata = await sharp(buffer).metadata();
    const width = metadata.autoOrient?.width ?? metadata.width;
    const height = metadata.autoOrient?.height ?? metadata.height;

    if (!width || !height || width < PROFILE_MIN_SIZE || height < PROFILE_MIN_SIZE) {
      return NextResponse.json(
        { error: "Фото должно быть не меньше 500×500 px" },
        { status: 400 }
      );
    }

    const cropFields = {
      left: formData.get("cropLeft"),
      top: formData.get("cropTop"),
      width: formData.get("cropWidth"),
      height: formData.get("cropHeight"),
    };

    const hasCrop = Object.values(cropFields).every(
      (value) => value !== null && value !== ""
    );

    if (!hasCrop) {
      output = await sharp(buffer)
        .rotate()
        .resize(PROFILE_MIN_SIZE, PROFILE_MIN_SIZE, { fit: "cover" })
        .toFormat(MIME_CONF[file.type].format)
        .toBuffer();
      outputSize = output.length;
    } else {
      const crop = {
        left: Number(String(cropFields.left)),
        top: Number(String(cropFields.top)),
        width: Number(String(cropFields.width)),
        height: Number(String(cropFields.height)),
      };

      const invalid =
        ![crop.left, crop.top, crop.width, crop.height].every(Number.isInteger) ||
        crop.left < 0 ||
        crop.top < 0 ||
        crop.width !== crop.height ||
        crop.width < PROFILE_MIN_SIZE ||
        crop.left + crop.width > width ||
        crop.top + crop.height > height;

      if (invalid) {
        return NextResponse.json(
          { error: "Некорректные координаты области обрезки" },
          { status: 400 }
        );
      }

      output = await sharp(buffer)
        .rotate()
        .extract(crop)
        .resize(PROFILE_MIN_SIZE, PROFILE_MIN_SIZE)
        .toFormat(MIME_CONF[file.type].format)
        .toBuffer();
      outputSize = output.length;
    }
  }

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, fileName), output);

  return NextResponse.json({
    url: `/uploads/${fileName}`,
    name: file.name,
    size: outputSize,
    type: file.type,
  });
}