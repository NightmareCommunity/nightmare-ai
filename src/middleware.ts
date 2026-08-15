import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase auth session on every navigable request.
 * Cookie updates from Supabase are propagated back to the response so that
 * refreshed access tokens are persisted on the client.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets + auth callback (it manages its own cookies).
  if (
    /^\/(_next\/static|_next\/image|favicon\.ico|auth\/callback|api\/models|api\/presentations\/templates|api\/auth)/.test(
      pathname
    )
  ) {
    return NextResponse.next();
  }

  const hasSbCookie = req.cookies.getAll().some((c) =>
    c.name.startsWith("sb-")
  );
  if (!hasSbCookie) return NextResponse.next();

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
  // If env vars aren't set (e.g. during build or misconfigured env), skip.
  if (!url || !anonKey) return NextResponse.next();

  let supabaseResponse = NextResponse.next({ request: req });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          req.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request: req });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the session — this also rotates cookies on the response.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map|ico|woff|woff2|ttf)$).*)",
  ],
};
