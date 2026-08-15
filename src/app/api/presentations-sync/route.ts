import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PresentationInput {
  id?: string;
  title?: string;
  topic?: string;
  audience?: string | null;
  language?: string;
  style?: string | null;
  theme?: string | null;
  slideCount?: number;
  prompt?: string;
  content?: unknown;
  pptxPath?: string | null;
  pdfPath?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

async function getUserId() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id };
}

export async function GET() {
  const { supabase, userId } = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabase
      .from("presentations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("[/api/presentations-sync GET] error:", error.message);
      return NextResponse.json({ presentations: [] });
    }

    return NextResponse.json({
      presentations: (data || []).map((r) => ({
        id: r.id,
        title: r.title,
        topic: r.topic,
        audience: r.audience,
        language: r.language,
        style: r.style,
        theme: r.theme,
        slideCount: r.slide_count,
        prompt: r.prompt,
        content: r.content,
        pptxPath: r.pptx_path,
        pdfPath: r.pdf_path,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  } catch (err) {
    console.error("[/api/presentations-sync GET] unexpected error:", err);
    return NextResponse.json({ presentations: [] });
  }
}

export async function POST(req: Request) {
  const { supabase, userId } = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { presentation?: PresentationInput }
    | null;
  if (!body?.presentation) {
    return NextResponse.json(
      { error: "presentation is required" },
      { status: 400 }
    );
  }
  const p = body.presentation;
  const id = p.id || crypto.randomUUID();
  const now = new Date().toISOString();

  const row = {
    id,
    user_id: userId,
    title: p.title || "Untitled Presentation",
    topic: p.topic || "",
    audience: p.audience ?? null,
    language: p.language || "en",
    style: p.style ?? null,
    theme: p.theme ?? null,
    slide_count: p.slideCount ?? 0,
    prompt: p.prompt || "",
    content: (p.content ?? {}) as Record<string, unknown>,
    pptx_path: p.pptxPath ?? null,
    pdf_path: p.pdfPath ?? null,
    created_at: p.createdAt || now,
    updated_at: p.updatedAt || now,
  };

  try {
    const { error } = await supabase
      .from("presentations")
      .upsert(row, { onConflict: "id" });

    if (error) {
      console.warn("[/api/presentations-sync POST] error:", error.message);
      return NextResponse.json({ ok: true, id, syncError: true });
    }
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("[/api/presentations-sync POST] unexpected error:", err);
    return NextResponse.json({ ok: true, id, syncError: true });
  }
}

export async function DELETE(req: Request) {
  const { supabase, userId } = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  try {
    const { error } = await supabase
      .from("presentations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.warn("[/api/presentations-sync DELETE] error:", error.message);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/presentations-sync DELETE] unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
