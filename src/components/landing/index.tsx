"use client";
import { useState } from "react";
import { Hero } from "@/components/landing/hero";
import { Sections } from "@/components/landing/sections";
import { AuthModal } from "@/components/landing/auth-modal";

export function Landing() {
  const [authMode, setAuthMode] = useState<"login" | "signup" | null>(null);
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
