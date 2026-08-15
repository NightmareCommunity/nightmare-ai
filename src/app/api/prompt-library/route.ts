import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    // Try the prompt_library table. If it doesn't exist (or RLS denies access),
    // the client transparently falls back to its local Zustand promptLibrary.
    const { data, error } = await supabase
      .from("prompt_library")
      .select("id, title, content, category, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.warn("[/api/prompt-library GET] error:", error.message);
      return NextResponse.json({ prompts: [] });
    }

    return NextResponse.json({
      prompts: (data || []).map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        category: p.category,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      })),
    });
  } catch (err) {
    console.error("[/api/prompt-library GET] unexpected error:", err);
    return NextResponse.json({ prompts: [] });
  }
}

export async function POST(req: Request) {
  const { supabase, userId } = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    title?: string;
    content?: string;
    category?: string;
  } | null;
  if (!body || !body.title || !body.content) {
    return NextResponse.json(
      { error: "title and content are required" },
      { status: 400 }
    );
  }

  const id = body.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const row = {
    id,
    user_id: userId,
    title: body.title,
    content: body.content,
    category: body.category || "General",
    created_at: now,
    updated_at: now,
  };

  try {
    const { data, error } = await supabase
      .from("prompt_library")
      .upsert(row, { onConflict: "id" })
      .select("id, title, content, category, created_at, updated_at")
      .single();

    if (error) {
      console.warn("[/api/prompt-library POST] error:", error.message);
      return NextResponse.json({ ok: true, syncError: true, id });
    }
    return NextResponse.json({
      ok: true,
      prompt: {
        id: data.id,
        title: data.title,
        content: data.content,
        category: data.category,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch (err) {
    console.error("[/api/prompt-library POST] unexpected error:", err);
    return NextResponse.json({ ok: true, syncError: true, id });
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
      .from("prompt_library")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) {
      console.warn("[/api/prompt-library DELETE] error:", error.message);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/prompt-library DELETE] unexpected error:", err);
    return NextResponse.json({ ok: true });
  }
}
