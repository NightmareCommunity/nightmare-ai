"use client";
import { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Square } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 200);
    el.style.height = `${next}px`;
  }, [text]);

  const submit = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t);
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1 relative rounded-xl border border-border bg-muted/30 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 transition-colors">
        <Textarea
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Message NIGHTMARE AI…"
          rows={1}
          className="min-h-[44px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 text-base md:text-sm px-3 py-3 pr-12"
        />
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute right-2 bottom-2">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled
                  className="h-8 w-8 text-muted-foreground"
                  aria-label="Attach file (coming soon)"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Attachments coming soon</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Button
        type="button"
        onClick={submit}
        disabled={disabled || !text.trim()}
        className="h-11 w-11 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Re-export Square icon for stop button (used by parent if needed)
export { Square };
