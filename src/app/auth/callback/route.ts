import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabase();
  const code = req.nextUrl.searchParams.get("code");
  const next = req.nextUrl.searchParams.get("next") || "/";
  const errorParam = req.nextUrl.searchParams.get("error_description");

  if (errorParam) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(errorParam)}`, req.url)
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error.message)}`, req.url)
      );
    }
  }
  return NextResponse.redirect(new URL(next, req.url));
}
