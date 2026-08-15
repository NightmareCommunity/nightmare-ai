import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Build the fallback user object directly from auth metadata — used when
  // the `profiles` table is missing or RLS denies access.
  const fallbackUser = {
    id: user.id,
    email: user.email || "",
    name:
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      (user.email || "").split("@")[0] ||
      "User",
    avatarUrl: user.user_metadata?.avatar_url as string | undefined,
    provider: (user.app_metadata?.provider as string | undefined) || "email",
    createdAt: user.created_at,
  };

  try {
    // Try to fetch the profile row (may not exist in fresh Supabase projects).
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, avatar_url, provider, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.warn("[/api/me GET] profiles query error:", error.message);
      return NextResponse.json({ user: fallbackUser });
    }

    return NextResponse.json({
      user: profile
        ? {
            id: profile.id,
            email: profile.email || user.email || "",
            name:
              profile.display_name ||
              (profile.email || user.email || "").split("@")[0],
            avatarUrl: profile.avatar_url || undefined,
            provider: profile.provider || "email",
            createdAt: profile.created_at,
          }
        : fallbackUser,
    });
  } catch (err) {
    console.error("[/api/me GET] unexpected error:", err);
    return NextResponse.json({ user: fallbackUser });
  }
}

export async function PUT(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    avatarUrl?: string;
  };

  // Update auth user_metadata so the change persists across sessions even
  // when the profiles table is missing.
  const updates: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) {
    updates.full_name = body.name.trim();
    updates.name = body.name.trim();
  }
  if (typeof body.avatarUrl === "string") {
    updates.avatar_url = body.avatarUrl.trim() || null;
  }

  if (Object.keys(updates).length > 0) {
    const { error: metaError } = await supabase.auth.updateUser({
      data: updates,
    });
    if (metaError) {
      return NextResponse.json(
        { error: metaError.message },
        { status: 400 }
      );
    }
  }

  // Best-effort upsert into profiles table (may fail silently if missing).
  if (body.name || body.avatarUrl) {
    try {
      await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email,
          display_name: body.name?.trim() || null,
          avatar_url: body.avatarUrl?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .then(() => undefined);
    } catch (err) {
      console.warn("[/api/me PUT] profiles upsert error:", err);
    }
  }

  const email = user.email || "";
  return NextResponse.json({
    user: {
      id: user.id,
      email,
      name:
        (updates.full_name as string | undefined) ||
        (user.user_metadata?.full_name as string | undefined) ||
        email.split("@")[0],
      avatarUrl:
        (updates.avatar_url as string | undefined) ||
        (user.user_metadata?.avatar_url as string | undefined) ||
        undefined,
      provider: (user.app_metadata?.provider as string | undefined) || "email",
      createdAt: user.created_at,
    },
  });
}
