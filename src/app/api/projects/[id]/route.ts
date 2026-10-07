import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";
import { ProjectUpdateSchema } from "@/lib/validation";

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

  const parsed = ProjectUpdateSchema.safeParse(await request.json());
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

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await db.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}