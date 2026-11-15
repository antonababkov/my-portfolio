import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/session";
import { assertSameOrigin } from "@/lib/csrf";
import { ProjectUpdateSchema } from "@/lib/validation";
import { readJson } from "@/lib/body";
import { removeUploadedFile } from "@/lib/uploads";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  if (!(await getSessionUser())) {
    return unauthorizedResponse();
  }
  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }
  const { id } = await params;

  const body = await readJson(request);
  if (body instanceof NextResponse) {
    return body;
  }

  const parsed = ProjectUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 }
    );
  }

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { title, description, link } = parsed.data;

  const project = await db.project.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(link !== undefined ? { link: link || null } : {}),
    },
  });

  return NextResponse.json(project);
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

  const existing = await db.project.findUnique({
    where: { id },
    select: { photos: { select: { url: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Photo.project имеет onDelete: Cascade — записи удалятся вместе с
  // проектом. Файлы нужно удалить отдельно, после успешного удаления из БД.
  await db.project.delete({ where: { id } });
  await Promise.all(
    existing.photos.map((photo) => removeUploadedFile(photo.url))
  );

  return NextResponse.json({ ok: true });
}