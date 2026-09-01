import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { id } = await params;
  const body: { title?: string; description?: string; link?: string } =
    await request.json();

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { title, description, link } = body;
  if (title === undefined && description === undefined && link === undefined) {
    return NextResponse.json(
      { error: "No fields to update provided" },
      { status: 400 }
    );
  }

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

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await db.project.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}