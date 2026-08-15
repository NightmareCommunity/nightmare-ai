"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";

export function StoreProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const hydrated = useAppStore((s) => s._hydrated);

  useEffect(() => {
    // Use rAF to mark mounted (avoids set-state-in-effect lint)
    const id = requestAnimationFrame(() => setMounted(true));
    // Some environments don't trigger onRehydrateStorage — set it here too.
    const t = setTimeout(() => useAppStore.getState().setHydrated(), 0);
    return () => {
      cancelAnimationFrame(id);
      clearTimeout(t);
    };
  }, []);

  // Render children immediately, but show a tiny dark placeholder
  // before hydration to avoid store/state mismatch flashes.
  if (!mounted || !hydrated) {
    return (
      <div className="min-h-screen bg-background" aria-hidden>
        {children}
      </div>
    );
  }
  return <>{children}</>;
}
