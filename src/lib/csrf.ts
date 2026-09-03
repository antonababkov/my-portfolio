/**
 * CSRF-защита: проверка Origin / Referer для мутирующих запросов.
 * Кука AUTH_COOKIE уже имеет SameSite=Lax, что блокирует кросс-сайтные
 * POST. Дополнительно сверяем Origin/Referer с доверенным источником.
 */

import { NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Допустимый источник (scheme://host) — из SITE_URL или пробуем заголовки.
 */
function getAllowedOrigins(request: Request, siteUrl: string | undefined): string[] {
  const origins = new Set<string>();

  if (siteUrl) {
    try {
      origins.add(new URL(siteUrl).origin);
    } catch {
      // игнорируем некорректный SITE_URL
    }
  }

  // Для локальной разработки и когда SITE_URL не задан — хост по умолчанию
  const host = request.headers.get("host");
  if (host) {
    const proto = process.env.NODE_ENV === "production" ? "https" : "http";
    origins.add(`${proto}://${host}`);
    // localhost тоже допустим на время разработки
    origins.add(`http://${host}`);
  }

  return [...origins];
}

/**
 * Убедиться, что мутирующий запрос пришёл с доверенного Origin/Referer.
 * Возвращает null, если всё в порядке, либо готовый 403-ответ.
 */
export function assertSameOrigin(
  request: Request,
  siteUrl: string | undefined = process.env.SITE_URL
): NextResponse | null {
  const method = request.method.toUpperCase();
  if (!MUTATING_METHODS.has(method)) {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Разрешаем, когда не применимо (например, серверные вызовы без Origin,
  // или запросы из curl при ручном тестировании) — см. политику ниже.
  if (!origin && !referer) {
    return null;
  }

  const allowed = getAllowedOrigins(request, siteUrl);

  if (origin) {
    try {
      if (allowed.includes(new URL(origin).origin)) {
        return null;
      }
    } catch {
      // некорректный origin — отклоняем ниже
    }
  } else if (referer) {
    try {
      if (allowed.includes(new URL(referer).origin)) {
        return null;
      }
    } catch {
      // некорректный referer — отклоняем ниже
    }
  }

  return NextResponse.json(
    { error: "Недопустимый источник запроса" },
    { status: 403 }
  );
}