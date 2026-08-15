"use client";
import { Sparkles } from "lucide-react";
import { LogoMark } from "@/components/shared/logo-mark";

interface EmptyChatStateProps {
  onPromptClick: (prompt: string) => void;
  examples: string[];
}

export function EmptyChatState({
  onPromptClick,
  examples,
}: EmptyChatStateProps) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-10">
      <div className="max-w-2xl w-full text-center">
        <div className="inline-flex mb-6">
          <LogoMark size={64} />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          How can I help you today?
        </h2>
        <p className="text-muted-foreground mt-2">
          Ask NIGHTMARE AI anything. Try one of these prompts to get started.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 text-left">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => onPromptClick(ex)}
              className="group text-left rounded-xl border border-border bg-card/40 hover:bg-card hover:border-primary/40 p-4 transition-colors"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-foreground/90 group-hover:text-foreground">
                  {ex}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
