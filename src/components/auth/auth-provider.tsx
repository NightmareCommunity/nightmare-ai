"use client";
import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser-singleton";
import { useAppStore, type AppUser } from "@/lib/store";

/**
 * Bridges the Supabase auth session into the Zustand store.
 * - On mount, hydrates the store from the existing session (if any).
 * - Subscribes to auth state changes and keeps the store in sync.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseBrowser();
  const login = useAppStore((s) => s.login);
  const logout = useAppStore((s) => s.logout);

  useEffect(() => {
    let mounted = true;

    const mapUser = (u: {
      id: string;
      email?: string;
      user_metadata?: Record<string, unknown> | null;
      app_metadata?: Record<string, unknown> | null;
    }): AppUser => {
      const meta = u.user_metadata || {};
      const appMeta = u.app_metadata || {};
      const email = u.email || "";
      const name =
        (meta.full_name as string | undefined) ||
        (meta.name as string | undefined) ||
        email.split("@")[0] ||
        "User";
      return {
        id: u.id,
        email,
        name,
        avatarUrl: meta.avatar_url as string | undefined,
        provider: (appMeta.provider as string | undefined) || "email",
      };
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        login(mapUser(session.user));
      } else if (useAppStore.getState().isAuthed) {
        logout();
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        login(mapUser(session.user));
      } else {
        if (useAppStore.getState().isAuthed) logout();
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, login, logout]);

  return <>{children}</>;
}
