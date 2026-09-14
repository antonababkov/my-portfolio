import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

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
  if (!(await getSessionUser())) {
    return unauthorizedResponse();
  }

  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }

  const body: {
    fullName?: string;
    position?: string;
    description?: string;
    sliderAutoPlay?: boolean;
    siteTitle?: string;
    siteDescription?: string;
    email?: string;
    phone?: string;
  } = await request.json();

  const { fullName, position, description, sliderAutoPlay, siteTitle, siteDescription, email, phone } = body;

  if (!fullName || !position || !description) {
    return NextResponse.json(
      { error: "Fields fullName, position, description are required" },
      { status: 400 }
    );
  }

  if (sliderAutoPlay !== undefined && typeof sliderAutoPlay !== "boolean") {
    return NextResponse.json(
      { error: "Field sliderAutoPlay must be a boolean" },
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
        sliderAutoPlay: sliderAutoPlay ?? false,
        ...(siteTitle !== undefined ? { siteTitle } : {}),
        ...(siteDescription !== undefined ? { siteDescription } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
    });
  } else {
    profile = await db.profile.update({
      where: { id: profile.id },
      data: {
        fullName,
        position,
        description,
        ...(sliderAutoPlay !== undefined ? { sliderAutoPlay } : {}),
        ...(siteTitle !== undefined ? { siteTitle } : {}),
        ...(siteDescription !== undefined ? { siteDescription } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
      },
    });
  }

  return NextResponse.json(profile);
}