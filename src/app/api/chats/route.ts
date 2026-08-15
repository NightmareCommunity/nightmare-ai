import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatMessageInput {
  id?: string;
  role: string;
  content: string;
  tokens?: number;
  createdAt?: string;
}

interface ChatUpsertInput {
  id?: string;
  title?: string;
  pinned?: boolean;
  archived?: boolean;
  model?: string;
  messages?: ChatMessageInput[];
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

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("*, messages(*)")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    // Table missing or RLS denied — degrade gracefully so the client can
    // fall back to its local Zustand store.
    return NextResponse.json({ chats: [], syncError: true });
  }

  const chats = (conversations || []).map((c) => {
    const row = c as Record<string, unknown>;
    const messages = (Array.isArray(row.messages) ? row.messages : []) as Array<
      Record<string, unknown>
    >;
    return {
      id: row.id,
      title: row.title,
      pinned: row.pinned,
      archived: row.archived,
      model: null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      messages: messages
        .map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          tokens: m.tokens,
          createdAt: m.created_at,
        }))
        .sort((a, b) =>
          (a.createdAt as string) > (b.createdAt as string) ? 1 : -1
        ),
    };
  });

  return NextResponse.json({ chats });
}

export async function POST(req: Request) {
  const { supabase, userId } = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { chat?: ChatUpsertInput }
    | null;
  if (!body?.chat) {
    return NextResponse.json({ error: "chat is required" }, { status: 400 });
  }
  const c = body.chat;
  const chatId = c.id || crypto.randomUUID();
  const now = new Date().toISOString();

  const { error: upsertError } = await supabase
    .from("conversations")
    .upsert({
      id: chatId,
      user_id: userId,
      title: c.title || "New Chat",
      pinned: c.pinned ?? false,
      archived: c.archived ?? false,
      created_at: c.createdAt || now,
      updated_at: c.updatedAt || now,
    });

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message, syncError: true },
      { status: 200 }
    );
  }

  // Replace messages — delete existing, then insert new.
  await supabase.from("messages").delete().eq("conversation_id", chatId);

  if (Array.isArray(c.messages) && c.messages.length > 0) {
    const rows = c.messages.map((m) => ({
      id: m.id || crypto.randomUUID(),
      conversation_id: chatId,
      user_id: userId,
      role: m.role,
      content: m.content,
      tokens: m.tokens ?? 0,
      created_at: m.createdAt || now,
    }));
    const { error: insertError } = await supabase
      .from("messages")
      .insert(rows);
    if (insertError) {
      return NextResponse.json(
        { error: insertError.message, syncError: true, id: chatId },
        { status: 200 }
      );
    }
  }

  return NextResponse.json({ ok: true, id: chatId });
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
  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) {
    return NextResponse.json(
      { error: error.message, syncError: true },
      { status: 200 }
    );
  }
  return NextResponse.json({ ok: true });
}
