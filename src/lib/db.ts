import { createClient } from "@supabase/supabase-js";

/**
 * Server-only admin Supabase client that bypasses RLS.
 * Use sparingly — only for operations that genuinely require service-role
 * access. For all user-scoped reads/writes, prefer `createServerSupabase()`
 * from `@/lib/supabase/server` which is RLS-bound to the authenticated user.
 */
type AdminClient = ReturnType<typeof createClient>;

let _admin: AdminClient | null = null;

export function getDB(): AdminClient {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  _admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _admin;
}
