import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Simple session refresh middleware.
 * Refreshes the Supabase auth session on every navigable request.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets + API routes + auth callback
  if (
    /^\/(_next\/static|_next\/image|favicon\.ico|auth\/callback|api\/)/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const hasSbCookie = req.cookies.getAll().some((c) => c.name.startsWith("sb-"));
  if (!hasSbCookie) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request: req });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map|ico|woff|woff2|ttf)$).*)",
  ],
};
