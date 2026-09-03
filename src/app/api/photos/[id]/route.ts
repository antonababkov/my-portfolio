import { NextResponse } from "next/server";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

type Params = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  alt: z.string().min(0).max(200),
});

export async function PATCH(request: Request, { params }: Params) {
  if (!(await getSessionUser())) {
    return unauthorizedResponse();
  }
  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }
  const { id } = await params;

  const existing = await db.photo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  const parsed = PatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 }
    );
  }

  const photo = await db.photo.update({
    where: { id },
    data: { alt: parsed.data.alt || "Фото" },
  });

  return NextResponse.json(photo);
}

export async function DELETE(request: Request, { params }: Params) {
  if (!(await getSessionUser())) {
    return unauthorizedResponse();
  }
  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }
  const { id } = await params;

  const existing = await db.photo.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  }

  await db.photo.delete({ where: { id } });

  try {
    const filePath = path.join(process.cwd(), "public", existing.url);
    await unlink(filePath);
  } catch {
    // Файл может отсутствовать — это не ошибка удаления записи.
  }

  return NextResponse.json({ ok: true });
}