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

  return (
    <div
      className={cn(
        "flex gap-3 group",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className="shrink-0">
        {isUser ? (
          <Avatar className="w-8 h-8 border border-border">
            <AvatarFallback className="bg-muted text-foreground">
              <UserIcon className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="w-8 h-8 rounded-full nightmare-gradient flex items-center justify-center crimson-glow-sm">
            <LogoMark size={20} />
          </div>
        )}
      </div>

      <div
        className={cn(
          "flex flex-col max-w-[85%] min-w-0",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-primary/15 border border-primary/25 text-foreground rounded-tr-sm"
              : "bg-card border border-border rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">
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
        <div className="flex items-center gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>
    </div>
  );
}
