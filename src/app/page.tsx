"use client";
import { useAppStore } from "@/lib/store";
import { Landing } from "@/components/landing";
import { DashboardShell } from "@/components/dashboard/shell";

export default function Home() {
  const isAuthed = useAppStore((s) => s.isAuthed);

  if (isAuthed) {
    return <DashboardShell />;
  }
  return <Landing />;
}
