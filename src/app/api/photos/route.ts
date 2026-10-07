import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { UPLOAD_URL_PATTERN } from "@/lib/uploads";

const AttachSchema = z.object({
  url: z.string().regex(UPLOAD_URL_PATTERN, "Некорректный url файла"),
  alt: z.string().min(0).max(200).optional(),
  description: z.string().min(0).max(1000).nullable().optional(),
  profileId: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/, "Некорректный id профиля").optional(),
  projectId: z.string().cuid().optional(),
}).refine((v) => {
  const ownerCount = [v.profileId, v.projectId].filter(Boolean).length;
  return ownerCount === 1;
}, "Фото должно принадлежать профилю или проекту");

const ReorderSchema = z.object({
  items: z.array(z.object({ id: z.string().cuid(), order: z.number().int() })).max(200),
});

export async function POST(request: Request) {
  if (!(await getSessionUser())) {
    return unauthorizedResponse();
  }

  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }

  const parsed = AttachSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 }
    );
  }

  const { url, alt, description, profileId, projectId } = parsed.data;

  const ownerFilter = projectId ? { projectId } : { profileId };

  const ownerId = profileId ?? projectId;
  if (!ownerId) {
    return NextResponse.json(
      { error: "Фото должно принадлежать профилю или проекту" },
      { status: 400 }
    );
  }

  const ownerExists = profileId
    ? await db.profile.findUnique({ where: { id: ownerId }, select: { id: true } })
    : await db.project.findUnique({ where: { id: ownerId }, select: { id: true } });
  if (!ownerExists) {
    return NextResponse.json(
      { error: "Профиль или проект не найден" },
      { status: 404 }
    );
  }

  const last = await db.photo.findFirst({
    where: ownerFilter,
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const photo = await db.photo.create({
    data: {
      url,
      alt: alt || "Фото",
      description: description || null,
      order: (last?.order ?? -1) + 1,
      ...(profileId ? { profileId } : {}),
      ...(projectId ? { projectId } : {}),
    },
  });

  return NextResponse.json(photo, { status: 201 });
}

export async function PUT(request: Request) {
  if (!(await getSessionUser())) {
    return unauthorizedResponse();
  }

  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }

  const parsed = ReorderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 }
    );
  }

  await db.$transaction(
    parsed.data.items.map(({ id, order }) =>
      db.photo.update({ where: { id }, data: { order } })
    )
  );

  return NextResponse.json({ ok: true });
}