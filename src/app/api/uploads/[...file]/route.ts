import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const MIME_BY_EXT: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  svg: "image/svg+xml",
  webp: "image/webp",
};

const SAFE_NAME = /^[A-Za-z0-9._-]+$/;

const uploadsDir = path.join(process.cwd(), "public", "uploads");

function mimeByFileName(name: string): string {
  const ext = path.extname(name).slice(1).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string[] }> }
) {
  const parts = (await params).file;

  if (!parts.length || parts.some((p) => !SAFE_NAME.test(p))) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const filePath = path.join(uploadsDir, ...parts);
  if (path.dirname(filePath) !== uploadsDir) {
    return new NextResponse("Bad request", { status: 400 });
  }

  let meta: Awaited<ReturnType<typeof stat>> | null = null;
  try {
    meta = await stat(filePath);
    if (!meta.isFile()) {
      return new NextResponse("Not found", { status: 404 });
    }
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(filePath);
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeByFileName(filePath),
        "Content-Length": String(meta.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": "inline",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}