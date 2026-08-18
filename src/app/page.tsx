"use client";
import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Landing } from "@/components/landing";
import { DashboardShell } from "@/components/dashboard/shell";
import { Loader2 } from "lucide-react";

export default function Home() {
  const isAuthed = useAppStore((s) => s.isAuthed);
  const _hydrated = useAppStore((s) => s._hydrated);

  // Show loading state while store hydrates from localStorage
  if (!_hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Not authed → show landing page with auth modal
  if (!isAuthed) {
    return <Landing />;
  }

  // Authed → show dashboard
  return <DashboardShell />;
}
