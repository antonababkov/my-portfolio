import { NextResponse } from "next/server";

/**
 * Чтение тела запроса с жёстким ограничением размера.
 *
 * Проверка только по Content-Length ненадёжна: при chunked-передаче
 * заголовок отсутствует, и буферизация пошла бы в память без верхней
 * границы (nginx-лимит защищает только запросы, идущие через него).
 * Поэтому читаем поток и обрываем его по превышении лимита.
 *
 * Возвращает Buffer либо готовый 413-ответ.
 */
export async function readBodyWithLimit(
  request: Request,
  maxBytes: number
): Promise<Buffer | NextResponse> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) {
    return tooLarge(maxBytes);
  }

  const stream = request.body;
  if (!stream) {
    return Buffer.alloc(0);
  }

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // поток уже закрыт — не критично
      }
      return tooLarge(maxBytes);
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks, total);
}

/** Лимит тела для JSON-эндпоинтов (максимум полей профиля ≈ 120 КБ). */
export const MAX_JSON_BYTES = 1024 * 1024; // 1MB

/**
 * Прочитать и распарсить JSON-тело с ограничением размера.
 *
 * Возвращает parsed-значение (дальше идёт в Zod safeParse) либо
 * готовый ответ-ошибку: 413 при превышении лимита, 400 при битом JSON
 * (раньше request.json() бросал SyntaxError и клиент получал 500).
 */
export async function readJson(
  request: Request,
  maxBytes: number = MAX_JSON_BYTES
): Promise<unknown> {
  const body = await readBodyWithLimit(request, maxBytes);
  if (body instanceof NextResponse) {
    return body;
  }
  try {
    return JSON.parse(body.toString("utf8"));
  } catch {
    return NextResponse.json({ error: "Некорректный JSON" }, { status: 400 });
  }
}

/** Явный отказ по размеру тела (413 Payload Too Large). */
export function tooLarge(maxBytes: number): NextResponse {
  return NextResponse.json(
    { error: `Тело запроса превышает лимит ${maxBytes} байт` },
    { status: 413 }
  );
}
