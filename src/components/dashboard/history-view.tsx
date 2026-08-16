"use client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ImageIcon,
  Presentation,
  ArrowRight,
  Download,
  Trash2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  id: string;
  type: "chat" | "image" | "presentation";
  title: string;
  subtitle: string;
  timestamp: string;
  thumbnail?: string; // For images — dataUrl
  onClick: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
}

export function HistoryView() {
  const chats = useAppStore((s) => s.chats);
  const images = useAppStore((s) => s.generatedImages);
  const presentations = useAppStore((s) => s.presentations);
  const setActiveChat = useAppStore((s) => s.setActiveChat);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const deleteGeneratedImage = useAppStore((s) => s.deleteGeneratedImage);
  const [filter, setFilter] = useState<"all" | "chat" | "image" | "presentation">("all");

  const handleDownload = (img: typeof images[0]) => {
    const a = document.createElement("a");
    a.href = img.dataUrl;
    a.download = `nightmare-${img.id}.${img.mimeType.split("/")[1] || "png"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Image downloaded");
  };

  const entries: HistoryEntry[] = [
    ...chats.map((c) => ({
      id: c.id,
      type: "chat" as const,
      title: c.title,
      subtitle: `${c.messages.length} message${
        c.messages.length === 1 ? "" : "s"
      }`,
      timestamp: c.updatedAt,
      onClick: () => {
        setActiveChat(c.id);
        setDashboardView("chat");
      },
    })),
    ...images.map((i) => ({
      id: i.id,
      type: "image" as const,
      title: i.prompt,
      subtitle: `${i.backend} · ${i.width}×${i.height}`,
      timestamp: i.createdAt,
      thumbnail: i.dataUrl,
      onClick: () => setDashboardView("images"),
      onDelete: () => {
        deleteGeneratedImage(i.id);
        toast.success("Image deleted");
      },
      onDownload: () => handleDownload(i),
    })),
    ...presentations.map((p) => ({
      id: p.id,
      type: "presentation" as const,
      title: p.title,
      subtitle: `${p.slideCount} slides · ${p.language}`,
      timestamp: p.createdAt,
      onClick: () => setDashboardView("presentations"),
    })),
  ].sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));

  const filtered =
    filter === "all" ? entries : entries.filter((e) => e.type === filter);

  const counts = {
    all: entries.length,
    chat: entries.filter((e) => e.type === "chat").length,
    image: entries.filter((e) => e.type === "image").length,
    presentation: entries.filter((e) => e.type === "presentation").length,
  };

  // Group entries by date for better organization
  const grouped: { label: string; entries: HistoryEntry[] }[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const lastWeek = new Date(today.getTime() - 7 * 86400000);

  for (const e of filtered) {
    const d = new Date(e.timestamp);
    let label: string;
    if (d >= today) label = "Today";
    else if (d >= yesterday) label = "Yesterday";
    else if (d >= lastWeek) label = "This week";
    else label = "Older";

    let group = grouped.find((g) => g.label === label);
    if (!group) {
      group = { label, entries: [] };
      grouped.push(group);
    }
    group.entries.push(e);
  }

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-6 h-6 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Activity History
          </h1>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          All your chats, images, and presentations in one timeline.
        </p>

        {/* Filter tabs */}
        <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1">
          {[
            { id: "all" as const, label: "All", count: counts.all },
            { id: "chat" as const, label: "Chats", count: counts.chat },
            { id: "image" as const, label: "Images", count: counts.image },
            {
              id: "presentation" as const,
              label: "Presentations",
              count: counts.presentation,
            },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                filter === t.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed glass">
            <CardContent className="p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No {filter === "all" ? "activity" : filter + "s"} yet.
                {filter === "all" &&
                  " Start a chat, generate an image, or create a presentation to see it here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <div key={group.label}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                  {group.label}
                </h2>
                <div className="space-y-2">
                  {group.entries.map((e) => (
                    <Card
                      key={`${e.type}-${e.id}`}
                      className="glass border-border/60 hover:border-primary/40 transition-colors cursor-pointer group"
                      onClick={e.onClick}
                    >
                      <CardContent className="p-3 flex items-center gap-3">
                        {/* Thumbnail / icon */}
                        {e.type === "image" && e.thumbnail ? (
                          <div className="w-12 h-12 rounded-md overflow-hidden border border-border shrink-0 bg-muted">
                            <img
                              src={e.thumbnail}
                              alt={e.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              "w-12 h-12 rounded-md flex items-center justify-center shrink-0",
                              e.type === "chat"
                                ? "bg-muted"
                                : "bg-primary/15"
                            )}
                          >
                            {e.type === "chat" ? (
                              <MessageSquare className="w-5 h-5 text-muted-foreground" />
                            ) : e.type === "image" ? (
                              <ImageIcon className="w-5 h-5 text-primary" />
                            ) : (
                              <Presentation className="w-5 h-5 text-primary" />
                            )}
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {e.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {e.subtitle} ·{" "}
                            {new Date(e.timestamp).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {e.type === "image" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  e.onDownload?.();
                                }}
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  e.onDelete?.();
                                }}
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
