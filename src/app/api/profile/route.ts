import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const profile = await db.profile.findFirst({
    include: { photos: { orderBy: { order: "asc" } } },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json(profile);
}

export async function PUT(request: Request) {
  const body: { fullName?: string; position?: string; description?: string } =
    await request.json();

  const { fullName, position, description } = body;

  if (!fullName || !position || !description) {
    return NextResponse.json(
      { error: "Fields fullName, position, description are required" },
      { status: 400 }
    );
  }

  let profile = await db.profile.findFirst();
  if (!profile) {
    profile = await db.profile.create({
      data: {
        fullName,
        position,
        description,
      },
    });
  } else {
    profile = await db.profile.update({
      where: { id: profile.id },
      data: { fullName, position, description },
    });
  }

  return NextResponse.json(profile);
}