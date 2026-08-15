"use client";
import { motion } from "framer-motion";

interface ThinkingOrbsProps {
  className?: string;
}

export function ThinkingOrbs({ className }: ThinkingOrbsProps) {
  return (
    <div
      className={`flex items-center gap-1.5 ${className || ""}`}
      aria-label="AI is thinking"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-2 h-2 rounded-full bg-primary/80"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}
