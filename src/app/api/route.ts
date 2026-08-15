import { NextResponse } from "next/server";
import { BRAND } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    name: BRAND.name,
    version: BRAND.version,
    tagline: BRAND.tagline,
    studio: BRAND.studio,
    endpoints: [
      "GET /api",
      "GET/PUT /api/me",
      "POST /api/chat (streaming + JSON)",
      "GET/POST/DELETE /api/chats",
      "GET /api/models",
      "POST /api/images/generate",
      "GET /api/images/models",
      "GET/DELETE /api/images/[id]",
      "POST /api/presentations/generate",
      "GET /api/presentations/status/[taskId]",
      "GET /api/presentations/templates",
      "GET/POST/DELETE /api/presentations-sync",
      "POST /api/presentations/export",
      "GET/POST/DELETE /api/prompt-library",
      "GET /auth/callback (Supabase OAuth/email-confirm redirect)",
    ],
    auth: "Supabase Auth (email/password + OAuth)",
    storage: "Supabase Postgres with RLS + Zustand localStorage fallback",
  });
}
