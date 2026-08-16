"use client";
import { useEffect } from "react";
import { Hero } from "@/components/landing/hero";
import { Sections } from "@/components/landing/sections";
import { toast } from "sonner";

export function Landing() {
  // Check for OAuth error in URL params
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      toast.error(decodeURIComponent(error));
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <Hero />
      <Sections />
    </main>
  );
}
