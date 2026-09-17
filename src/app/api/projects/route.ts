import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

const ReorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), order: z.number().int() })),
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

  const body: { title?: string; description?: string; link?: string } =
    await request.json();

  const { title, description, link } = body;

  if (!title || !description) {
    return NextResponse.json(
      { error: "Fields title, description are required" },
      { status: 400 }
    );
  }

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

  for (const { id, order } of parsed.data.items) {
    await db.project.update({ where: { id }, data: { order } });
  }

  return NextResponse.json({ ok: true });
}