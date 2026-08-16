"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { DashboardShell } from "@/components/dashboard/shell";
import { Loader2 } from "lucide-react";

export default function ImagesPage() {
  const router = useRouter();
  const isAuthed = useAppStore((s) => s.isAuthed);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const _hydrated = useAppStore((s) => s._hydrated);

  useEffect(() => {
    if (_hydrated && !isAuthed) {
      router.replace("/login");
    }
    if (isAuthed) {
      setDashboardView("images");
    }
  }, [_hydrated, isAuthed, router, setDashboardView]);

  if (!_hydrated || !isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return <DashboardShell />;
}
