"use client";
import { Card, CardContent } from "@/components/ui/card";
import { LogoMark } from "@/components/shared/logo-mark";
import { BRAND } from "@/lib/constants";
import {
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  Github,
  Terminal,
} from "lucide-react";

const BUILDER_FEATURES = [
  {
    icon: Cpu,
    title: "Multi-model routing",
    body: "Switch between Llama 3.1 8B and 3.3 70B with an Auto mode that picks the right model per request.",
  },
  {
    icon: Layers,
    title: "Resilient image pipeline",
    body: "FLUX.1 via NVIDIA NIM as primary, with automatic Pollinations fallback for zero-downtime generation.",
  },
  {
    icon: Sparkles,
    title: "Async presentation jobs",
    body: "Submit a topic, get a task id, poll for progress. Built on Presenton with multiple deck templates.",
  },
  {
    icon: ShieldCheck,
    title: "Supabase Auth + RLS",
    body: "Email/password and OAuth providers backed by Supabase Auth, with row-level security on every user-owned table.",
  },
];

const POWERED_BY = [
  { name: "NVIDIA NIM", note: "LLM + image inference" },
  { name: "Presenton", note: "Presentation generation" },
  { name: "Pollinations", note: "Image fallback" },
  { name: "Supabase", note: "Auth + Postgres" },
  { name: "Cloudflare Workers", note: "Edge deployment" },
];

export function Sections() {
  return (
    <>
      {/* Built for builders */}
      <section className="relative py-24 px-4 grid-bg">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-mono uppercase tracking-widest text-primary">
              Built for builders
            </span>
            <h2 className="mt-2 text-4xl sm:text-5xl font-bold tracking-tight">
              Everything you need.
              <span className="text-muted-foreground"> Nothing you don&apos;t.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUILDER_FEATURES.map((f) => (
              <Card
                key={f.title}
                className="glass border-border/60 hover:border-primary/40 transition-colors"
              >
                <CardContent className="p-6 flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {f.body}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Powered by */}
      <section className="py-16 px-4 border-t border-border/40">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-mono uppercase tracking-widest text-muted-foreground mb-8">
            Powered by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {POWERED_BY.map((p) => (
              <div
                key={p.name}
                className="px-4 py-2 rounded-lg glass border-border/60 flex flex-col items-center text-center min-w-[140px]"
              >
                <span className="text-sm font-semibold">{p.name}</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  {p.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-10 px-4 bg-sidebar/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <LogoMark size={32} />
            <div className="flex flex-col">
              <span className="font-semibold text-sm">{BRAND.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {BRAND.tagline}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Terminal className="w-3 h-3" /> v{BRAND.version}
            </span>
            <span className="inline-flex items-center gap-1">
              <Github className="w-3 h-3" /> {BRAND.studio}
            </span>
            <span>
              © {new Date().getFullYear()} {BRAND.studio}
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
