import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, unauthorizedResponse } from "@/lib/session";
import { assertSameOrigin } from "@/lib/csrf";
import { ProfileUpdateSchema } from "@/lib/validation";
import { readJson } from "@/lib/body";

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

  const body = await readJson(request);
  if (body instanceof NextResponse) {
    return body;
  }

  const parsed = ProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 }
    );
  }

  const {
    fullName,
    position,
    description,
    sliderAutoPlay,
    siteTitle,
    siteDescription,
    email,
    phone,
    aboutExtraTitle,
    aboutExtra,
    aboutExtraVisible,
    privacyPolicy,
    personalDataPolicy,
    operatorAddress,
  } = parsed.data;

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
        ...(aboutExtraTitle !== undefined ? { aboutExtraTitle } : {}),
        ...(aboutExtra !== undefined ? { aboutExtra } : {}),
        ...(aboutExtraVisible !== undefined ? { aboutExtraVisible } : {}),
        ...(privacyPolicy !== undefined ? { privacyPolicy } : {}),
        ...(personalDataPolicy !== undefined ? { personalDataPolicy } : {}),
        ...(operatorAddress !== undefined ? { operatorAddress } : {}),
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
        ...(aboutExtraTitle !== undefined ? { aboutExtraTitle } : {}),
        ...(aboutExtra !== undefined ? { aboutExtra } : {}),
        ...(aboutExtraVisible !== undefined ? { aboutExtraVisible } : {}),
        ...(privacyPolicy !== undefined ? { privacyPolicy } : {}),
        ...(personalDataPolicy !== undefined ? { personalDataPolicy } : {}),
        ...(operatorAddress !== undefined ? { operatorAddress } : {}),
      },
    });
  }

  return NextResponse.json(profile);
}