/**
 * Простой in-memory rate limiter (без внешних зависимостей).
 * Подходит для одного экземпляра приложения. Для горизонтального
 * масштабирования замените на Redis/распределённое хранилище.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

/** Очистка просроченных записей, вызывается периодически. */
function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * Проверить лимит запросов для ключа (обычно IP адрес).
 * @returns true, если запрос разрешён; false, если лимит превышен.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();

  if (buckets.size > 10_000) {
    sweep(now);
  }

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

/** Извлекает клиентский IP из заголовков (за reverse-proxy/Caddy). */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // берём первый адрес — исходный клиент
    return forwarded.split(",")[0].trim();
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-host") ||
    "unknown"
  );
}

/** Максимальное число неуспешных попыток входа на IP. */
export const LOGIN_MAX_ATTEMPTS = 5;
/** Окно сброса счётчика попыток входа, мс (1 минута). */
export const LOGIN_WINDOW_MS = 60_000;