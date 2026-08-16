"use client";
import { motion } from "framer-motion";
import { ArrowRight, MessageSquare, ImageIcon, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoMark } from "@/components/shared/logo-mark";
import { BRAND } from "@/lib/constants";
import Link from "next/link";

interface HeroProps {
  onGetStarted?: () => void;
  onSignIn?: () => void;
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Streaming Chat",
    desc: "Real-time LLM conversations powered by NVIDIA NIM. Llama 3.1 / 3.3 with markdown + syntax highlighting.",
    accent: "from-red-500/20 to-transparent",
  },
  {
    icon: ImageIcon,
    title: "Image Generation",
    desc: "FLUX.1 Schnell & Dev via NVIDIA, with automatic Pollinations fallback so you always get a result.",
    accent: "from-rose-500/20 to-transparent",
  },
  {
    icon: Presentation,
    title: "Presentation Generator",
    desc: "Describe a topic, get a deck. Powered by Presenton with multiple templates and PPTX export.",
    accent: "from-orange-500/20 to-transparent",
  },
];

export function Hero({ onGetStarted, onSignIn }: HeroProps) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-4 py-16 grid-bg">
      {/* Animated crimson orbs */}
      <motion.div
        className="absolute top-1/4 -left-32 w-[28rem] h-[28rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.65 0.22 25 / 0.35), transparent 70%)" }}
        animate={{ x: [0, 40, 0], y: [0, 30, 0], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-32 w-[32rem] h-[32rem] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.5 0.2 25 / 0.3), transparent 70%)" }}
        animate={{ x: [0, -50, 0], y: [0, -20, 0], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <LogoMark size={72} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-5xl sm:text-7xl md:text-8xl font-extrabold tracking-tighter nightmare-text-glow"
        >
          {BRAND.name}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-4 text-lg sm:text-xl text-muted-foreground font-medium"
        >
          {BRAND.tagline}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-6 max-w-2xl text-base text-muted-foreground/80 leading-relaxed"
        >
          A unified AI workspace bringing together streaming chat, image
          generation, and presentation creation under one dark, focused
          interface.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 w-full sm:w-auto"
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 crimson-glow-sm text-base"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base border-border hover:bg-accent"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl"
        >
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="glass relative overflow-hidden border-border/60 hover:border-primary/40 transition-colors"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${f.accent} pointer-events-none`}
              />
              <CardContent className="relative p-6 text-left">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
