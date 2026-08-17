"use client";
import { useRef, useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Square, X, FileText, Image as ImageIcon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface AttachedFile {
  id: string;
  file: File;
  preview?: string; // data URL for images
}

interface ChatInputProps {
  onSend: (text: string, files?: AttachedFile[]) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "application/pdf",
  "text/plain", "text/csv",
  "application/json",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 200);
    el.style.height = `${next}px`;
  }, [text]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const newFiles: AttachedFile[] = [];
    for (let i = 0; i < selected.length; i++) {
      const f = selected[i];
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name} is too large (max 10MB)`);
        continue;
      }
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // Generate preview for images
      if (f.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setFiles((prev) =>
            prev.map((af) =>
              af.id === id ? { ...af, preview: reader.result as string } : af
            )
          );
        };
        reader.readAsDataURL(f);
      }
      newFiles.push({ id, file: f });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const submit = () => {
    const t = text.trim();
    if (!t && files.length === 0) return;
    onSend(t, files.length > 0 ? files : undefined);
    setText("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Paste handler — support pasted images
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          if (file.size > MAX_FILE_SIZE) {
            toast.error("Pasted image is too large (max 10MB)");
            continue;
          }
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const reader = new FileReader();
          reader.onload = () => {
            setFiles((prev) => [
              ...prev,
              { id, file, preview: reader.result as string },
            ]);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Attached files preview */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-muted/30 border border-border">
          {files.map((af) => (
            <div
              key={af.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background border border-border text-xs group"
            >
              {af.preview ? (
                <img
                  src={af.preview}
                  alt={af.file.name}
                  className="w-6 h-6 rounded object-cover"
                />
              ) : (
                <FileText className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="max-w-[120px] truncate">{af.file.name}</span>
              <span className="text-muted-foreground">{formatFileSize(af.file.size)}</span>
              <button
                onClick={() => removeFile(af.id)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 relative rounded-xl border border-border bg-muted/30 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30 transition-colors">
          <Textarea
            ref={ref}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder="Message NIGHTMARE AI…"
            rows={1}
            className="min-h-[44px] max-h-[200px] resize-none bg-transparent border-0 focus-visible:ring-0 text-base md:text-sm px-3 py-3 pr-12"
          />
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="absolute right-2 bottom-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    disabled={disabled}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Attach images, PDFs, documents</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button
          type="button"
          onClick={submit}
          disabled={disabled || (!text.trim() && files.length === 0)}
          className="h-11 w-11 p-0 bg-primary text-primary-foreground hover:bg-primary/90"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export { Square };
export type { AttachedFile };
