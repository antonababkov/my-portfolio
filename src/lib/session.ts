import { cookies } from "next/headers";
import { AUTH_COOKIE, verifyToken, type AuthPayload } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Сессия администратора для серверных компонентов и API-роутов.
 *
 * Вынесена из auth.ts отдельно: auth.ts импортирует proxy.ts
 * (middleware-рантайм), а в его графе не должно быть Prisma/БД —
 * прокси делает только «optimistic check» по JWT (см. docs
 * node_modules/next/dist/docs/.../proxy.md), а окончательная
 * проверка выполняется здесь, в Node.js-рантайме.
 */
export async function getSessionUser(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const payload = verifyToken(token);
  if (!payload) return null;

  // JWT самодостаточен, но администратор мог быть удалён или заменён
  // с другим логином — сверяем субъект с БД, чтобы старый токен
  // не действовал дольше жизни учётной записи.
  const admin = await db.admin.findUnique({
    where: { id: payload.id },
    select: { id: true, login: true },
  });
  if (!admin || admin.login !== payload.login) {
    return null;
  }

  return payload;
}

export { unauthorizedResponse } from "@/lib/auth";
