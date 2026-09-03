import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

const AttachSchema = z.object({
  url: z.string().min(1),
  alt: z.string().optional(),
  profileId: z.string().optional(),
  projectId: z.string().optional(),
}).refine((v) => {
  const ownerCount = [v.profileId, v.projectId].filter(Boolean).length;
  return ownerCount === 1;
}, "Фото должно принадлежать профилю или проекту");

const ReorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), order: z.number().int() })),
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

  const { url, alt, profileId, projectId } = parsed.data;

  const ownerFilter = projectId ? { projectId } : { profileId };
  const last = await db.photo.findFirst({
    where: ownerFilter,
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const photo = await db.photo.create({
    data: {
      url,
      alt: alt || "Фото",
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

  for (const { id, order } of parsed.data.items) {
    await db.photo.update({ where: { id }, data: { order } });
  }

  return NextResponse.json({ ok: true });
}