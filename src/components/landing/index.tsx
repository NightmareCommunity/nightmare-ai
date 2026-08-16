"use client";
import { useState, useEffect } from "react";
import { Hero } from "@/components/landing/hero";
import { Sections } from "@/components/landing/sections";
import { AuthModal } from "@/components/landing/auth-modal";
import { toast } from "sonner";

export function Landing() {
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);

  // Check for OAuth error in URL params (e.g., /?error=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      toast.error(decodeURIComponent(error));
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      <Hero
        onGetStarted={() => setAuthMode("signup")}
        onSignIn={() => setAuthMode("login")}
      />
      <Sections />
      <AuthModal mode={authMode} onClose={() => setAuthMode(null)} />
    </main>
  );
}
