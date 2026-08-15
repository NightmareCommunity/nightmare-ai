import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { exportPresentation, isConfigured } from "@/lib/presenton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Presenton not configured" },
      { status: 503 }
    );
  }
  const body = (await req.json().catch(() => null)) as {
    presentation_id?: string;
    export_as?: "pptx" | "pdf";
  } | null;
  if (!body?.presentation_id) {
    return NextResponse.json(
      { error: "presentation_id required" },
      { status: 400 }
    );
  }
  const format = body.export_as === "pdf" ? "pdf" : "pptx";
  try {
    const result = await exportPresentation(body.presentation_id, format);
    return NextResponse.json({
      ok: true,
      url: result.url,
      download_url: result.download_url,
      path: result.path,
      format,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
