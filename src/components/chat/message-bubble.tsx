"use client";
import type { Message } from "@/lib/store";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/shared/markdown-renderer";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoMark } from "@/components/shared/logo-mark";
import { Copy, Check, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  // ChatGPT-style: full-width row, avatar on left, content fills remaining space.
  // No right-aligned bubbles — keeps the conversation flow vertical and clean.
  return (
    <div className="group flex gap-3 sm:gap-4 px-1 py-1">
      {/* Avatar */}
      <div className="shrink-0">
        {isUser ? (
          <Avatar className="w-8 h-8 border border-border">
            <AvatarFallback className="bg-muted text-foreground">
              <UserIcon className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 rounded-full nightmare-gradient flex items-center justify-center crimson-glow-sm overflow-hidden">
            <LogoMark size={20} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold text-foreground">
            {isUser ? "You" : isAssistant ? "NIGHTMARE AI" : "System"}
          </span>
        </div>
        <div className="text-sm leading-relaxed">
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-foreground">
              {message.content}
            </p>
          ) : isAssistant ? (
            <MarkdownRenderer content={message.content} />
          ) : (
            <p className="text-xs text-muted-foreground italic">
              {message.content}
            </p>
          )}
        </div>
        {/* Action row (hover) */}
        {!isUser && message.content && (
          <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-muted-foreground">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <button
              onClick={handleCopy}
              className="text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
