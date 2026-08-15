"use client";
import { createClient } from "./client";

type SupabaseBrowserClient = ReturnType<typeof createClient>;

let instance: SupabaseBrowserClient | null = null;

/**
 * Returns a singleton browser Supabase client so that auth state change
 * subscriptions are not duplicated across re-renders.
 */
export function getSupabaseBrowser(): SupabaseBrowserClient {
  if (!instance) instance = createClient();
  return instance;
}
