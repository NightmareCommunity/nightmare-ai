"use client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, ImageIcon, Presentation, ArrowRight } from "lucide-react";

interface HistoryEntry {
  id: string;
  type: "chat" | "image" | "presentation";
  title: string;
  subtitle: string;
  timestamp: string;
  onClick: () => void;
}

export function HistoryView() {
  const chats = useAppStore((s) => s.chats);
  const images = useAppStore((s) => s.generatedImages);
  const presentations = useAppStore((s) => s.presentations);
  const setActiveChat = useAppStore((s) => s.setActiveChat);
  const setDashboardView = useAppStore((s) => s.setDashboardView);

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
      title: i.prompt.slice(0, 60) + (i.prompt.length > 60 ? "…" : ""),
      subtitle: `${i.backend} · ${i.width}×${i.height}`,
      timestamp: i.createdAt,
      onClick: () => setDashboardView("images"),
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

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-4xl mx-auto p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          Activity History
        </h1>
        {entries.length === 0 ? (
          <Card className="border-dashed glass">
            <CardContent className="p-12 text-center">
              <p className="text-sm text-muted-foreground">
                No activity yet. Start a chat, generate an image, or create a
                presentation to see it here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((e) => (
              <Card
                key={`${e.type}-${e.id}`}
                className="glass border-border/60 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={e.onClick}
              >
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${
                      e.type === "chat"
                        ? "bg-muted"
                        : e.type === "image"
                        ? "bg-primary/15"
                        : "bg-primary/15"
                    }`}
                  >
                    {e.type === "chat" ? (
                      <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    ) : e.type === "image" ? (
                      <ImageIcon className="w-4 h-4 text-primary" />
                    ) : (
                      <Presentation className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {e.subtitle} · {new Date(e.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
