import { NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/auth";
import { assertSameOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }

  const isSecure =
    process.env.NODE_ENV === "production" ||
    request.headers.get("x-forwarded-proto") === "https";

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 0,
  });
  return response;
}
