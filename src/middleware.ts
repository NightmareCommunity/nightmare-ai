import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/chat", "/images", "/presentations", "/settings", "/profile", "/history"];
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static assets + API routes + auth callback
  if (
    /^\/(_next\/static|_next\/image|favicon\.ico|auth\/callback|api\/)/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;
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

  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  // Redirect authed users away from /login, /signup
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/chat", req.url));
  }

  // Redirect unauthed users away from protected routes
  if (!user && isProtected) {
    const redirectUrl = new URL("/login", req.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map|ico|woff|woff2|ttf)$).*)",
  ],
};
