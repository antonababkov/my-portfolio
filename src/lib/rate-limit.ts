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

// Периодическая очистка, чтобы Map не росла бессрочно.
// unref() — таймер не держит процесс (важно для хелсчеков/коротких запросов).
setInterval(() => sweep(Date.now()), 60_000).unref();

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

/** Извлекает клиентский IP из заголовков (за reverse-proxy nginx). */
export function getClientIp(request: Request): string {
  // Доверяем только заголовку, который перезаписывается нашим nginx
  // (proxy_set_header X-Real-IP $remote_addr).
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Если отработал другой прокси — берём ПОСЛЕДНИЙ hop X-Forwarded-For:
  // его добавляет ближайший к приложению прокси, а подделать можно
  // только значения слева.
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const hops = forwarded
      .split(",")
      .map((hop) => hop.trim())
      .filter(Boolean);
    if (hops.length > 0) {
      return hops[hops.length - 1];
    }
  }

  // Нет обрамляющего прокси: отдельным клиентам не различаем, но
  // лимит всё равно действует (общий бакет). Порт не публикуется наружу.
  return "unknown";
}

/** Максимальное число неуспешных попыток входа на IP. */
export const LOGIN_MAX_ATTEMPTS = 5;
/** Окно сброса счётчика попыток входа, мс (1 минута). */
export const LOGIN_WINDOW_MS = 60_000;