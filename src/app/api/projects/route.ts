import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { ProjectCreateSchema } from "@/lib/validation";

const ReorderSchema = z.object({
  items: z.array(z.object({ id: z.string().cuid(), order: z.number().int() })).max(200),
});

export async function GET() {
  const projects = await db.project.findMany({
    orderBy: { order: "asc" },
    include: { photos: { orderBy: { order: "asc" } } },
  });

  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  if (!(await getSessionUser())) {
    return unauthorizedResponse();
  }

  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }

  const parsed = ProjectCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 }
    );
  }

  const { title, description, link } = parsed.data;

  const last = await db.project.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  const project = await db.project.create({
    data: {
      title,
      description,
      link: link || null,
      order: (last?.order ?? -1) + 1,
    },
  });

  return NextResponse.json(project, { status: 201 });
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
      db.project.update({ where: { id }, data: { order } })
    )
  );

  return NextResponse.json({ ok: true });
}