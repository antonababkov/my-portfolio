import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

const isDev = process.env.NODE_ENV !== "production";

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // В проде инлайн-код разрешён только с действующим nonce; без него
    // script-src блокирует и инлайн-скрипты, и 'unsafe-eval'.
    // strict-dynamic позволяет nonce-скриптам подгружать остальные
    // (в т.ч. Яндекс.Метрику после согласия).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://mc.yandex.ru https://yastatic.net${isDev ? " 'unsafe-eval'" : ""}`,
    // nonce разрешает только <style>-элементы, но НЕ атрибуты style="" —
    // а их активно использует next/image (fill) и слайдеры, поэтому
    // инлайн-стили разрешаем целиком; XSS-защиту даёт script-src.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://mc.yandex.ru",
    "font-src 'self'",
    "connect-src 'self' https://mc.yandex.ru",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API-эндпоинты никогда не должны индексироваться.
  if (pathname.startsWith("/api")) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  // Nonce для CSP: генерируется на каждый запрос и пробрасывается
  // рендереру через заголовок x-nonce (см. next/headers в layout).
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const routeCsp = buildCsp(nonce);

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthed = Boolean(verifyToken(token));

  if (isAuthed) {
    return respond(NextResponse.next({ request: { headers: requestHeaders } }), routeCsp);
  }

  if (pathname === "/admin/login") {
    return respond(NextResponse.next({ request: { headers: requestHeaders } }), routeCsp);
  }

  if (pathname.startsWith("/admin")) {
    const loginUrl = new URL("/admin/login", request.url);
    return respond(NextResponse.redirect(loginUrl), routeCsp);
  }

  return respond(NextResponse.next({ request: { headers: requestHeaders } }), routeCsp);
}

function respond(response: NextResponse, csp: string): NextResponse {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|uploads|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    "/api/:path*",
  ],
};