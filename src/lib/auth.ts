import jwt from "jsonwebtoken";

export const AUTH_COOKIE = "auth_token";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 дней

// iss/aud: токен, выписанный для других целей (или под чужим секретом
// с совпадающим алгоритмом), отвергается при верификации.
const ISSUER = "my-portfolio";
const AUDIENCE = "portfolio-admin";

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET не задан в переменных окружения");
  }
  // Плейсхолдер из .env.example или слишком короткие значения легко
  // подобрать/спасти — фейлим при старте, а не при первой сессии.
  if (secret === "replace-with-64-hex-chars") {
    throw new Error("AUTH_SECRET = replace-with-64-hex-chars (плейсхолдер из .env.example)");
  }
  if (secret.length < 32) {
    throw new Error("AUTH_SECRET слишком короткий: минимум 32 символа");
  }
  return secret;
}

export interface AuthPayload {
  login: string;
  id: string;
}

/** Подписать JWT-токен для администратора. */
export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, getSecret(), {
    algorithm: "HS256",
    expiresIn: SESSION_MAX_AGE,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

/** Проверить токен и вернуть payload либо null. */
export function verifyToken(
  token: string | undefined | null
): AuthPayload | null {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getSecret(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return decoded as AuthPayload;
  } catch {
    return null;
  }
}

/** Unauthorized-ответ для защищённых API-роутов. */
export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: "Не авторизован" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export { SESSION_MAX_AGE };
