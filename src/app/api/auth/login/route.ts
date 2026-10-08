import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { signToken, AUTH_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";
import {
  rateLimit,
  getClientIp,
  LOGIN_MAX_ATTEMPTS,
  LOGIN_WINDOW_MS,
  LOGIN_GLOBAL_MAX_ATTEMPTS,
  LOGIN_GLOBAL_WINDOW_MS,
} from "@/lib/rate-limit";
import { assertSameOrigin } from "@/lib/csrf";
import { readJson } from "@/lib/body";

const LoginSchema = z.object({
  login: z.string().min(1, "Введите логин").max(100),
  password: z.string().min(1, "Введите пароль").max(200),
});

// Хеш случайной строки (cost 12 — как у реальных админов в prisma/seed.ts):
// используется как заглушка, чтобы отсутствие пользователя и неверный пароль
// занимали сопоставимое время (защита от тайминг-перечисления). Если cost
// заглушки отличается от cost реальных хешей, время ответа «пользователь
// есть/нет» снова начинает различаться.
const DUMMY_HASH = "$2b$12$l1.6sZqRKycoz8MvilbedOFmbv8htBukWubLPVakQbF3SKh2bJO2.";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`login:${ip}`, LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS)) {
    return NextResponse.json(
      { error: "Слишком много попыток входа. Попробуйте позже." },
      {
        status: 429,
        headers: { "Retry-After": String(LOGIN_WINDOW_MS / 1000) },
      }
    );
  }

  // Глобальный кап: см. src/lib/rate-limit.ts — страховка от обхода
  // per-IP лимита подделкой заголовков IP и от распределённого перебора.
  if (
    !rateLimit(
      "login:global",
      LOGIN_GLOBAL_MAX_ATTEMPTS,
      LOGIN_GLOBAL_WINDOW_MS
    )
  ) {
    return NextResponse.json(
      { error: "Слишком много попыток входа. Попробуйте позже." },
      {
        status: 429,
        headers: { "Retry-After": String(LOGIN_GLOBAL_WINDOW_MS / 1000) },
      }
    );
  }

  const csrf = assertSameOrigin(request);
  if (csrf) {
    return csrf;
  }

  const body = await readJson(request);
  if (body instanceof NextResponse) {
    return body;
  }

  const parsed = LoginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Некорректные данные" },
      { status: 400 }
    );
  }

  const { login, password } = parsed.data;

  const admin = await db.admin.findUnique({ where: { login } });

  let passwordOk = false;
  if (admin) {
    passwordOk = await bcrypt.compare(password, admin.password);
  } else {
    // Выравнивание времени: сравниваем с фиктивным хешем.
    await bcrypt.compare(password, DUMMY_HASH);
  }

  if (!admin || !passwordOk) {
    return NextResponse.json(
      { error: "Неверный логин или пароль" },
      { status: 401 }
    );
  }

  const token = signToken({ login: admin.login, id: admin.id });

  const isSecure =
    process.env.NODE_ENV === "production" ||
    request.headers.get("x-forwarded-proto") === "https";

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return response;
}
