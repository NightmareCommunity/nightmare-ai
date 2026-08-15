"use client";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns the env vars needed to create a browser Supabase client.
 * Falls back gracefully when env vars are missing (e.g. during build
 * prerendering) — the client will throw a clear error only when actually
 * used at runtime in the browser, not during build.
 */
function getSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  return { url, anonKey };
}

export function createClient() {
  const { url, anonKey } = getSupabaseEnv();
  // createBrowserClient throws if url/anonKey are empty. During build
  // prerendering these may be unset (Pages build env), so guard with
  // placeholder values that will never be used at runtime.
  return createBrowserClient(
    url || "https://placeholder.supabase.co",
    anonKey || "placeholder-anon-key"
  );
}
