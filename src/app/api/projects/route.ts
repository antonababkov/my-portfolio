import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth";

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