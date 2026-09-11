import { NextResponse } from "next/server";

/** Лёгкий health-эндпоинт для Docker healthcheck (без обращения к БД). */
export function GET() {
  return NextResponse.json({ ok: true, ts: Date.now() });
}