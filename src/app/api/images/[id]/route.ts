import { NextResponse } from "next/server";
import { getImage, deleteImage } from "@/lib/storage/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const img = getImage(id);
  if (!img) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = new URL(_req.url);
  const download = url.searchParams.get("download") === "1";
  const headers: HeadersInit = {
    "Content-Type": img.mime,
    "Cache-Control": "private, max-age=3600",
  };
  if (download) {
    headers["Content-Disposition"] = `attachment; filename="nightmare-${id}.${img.mime.split("/")[1] || "png"}"`;
  } else {
    headers["Content-Disposition"] = `inline; filename="nightmare-${id}.${img.mime.split("/")[1] || "png"}"`;
  }
  return new Response(img.bytes, { headers });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ok = deleteImage(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
