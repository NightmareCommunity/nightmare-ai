"use client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export function FavoritesView() {
  const chats = useAppStore((s) => s.chats);
  const setActiveChat = useAppStore((s) => s.setActiveChat);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const newChat = useAppStore((s) => s.newChat);
  const togglePin = useAppStore((s) => s.togglePin);

  const pinned = chats.filter((c) => c.pinned);
  const sorted = [...pinned].sort((a, b) =>
    b.updatedAt > a.updatedAt ? 1 : -1
  );

  const open = (id: string) => {
    setActiveChat(id);
    setDashboardView("chat");
  };

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-5xl mx-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Star className="w-6 h-6 text-primary" />
              Favorites
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {pinned.length} pinned conversation{pinned.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10"
            onClick={() => newChat()}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        {sorted.length === 0 ? (
          <Card className="border-dashed glass">
            <CardContent className="p-12 text-center">
              <Star className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No pinned chats yet. Pin a chat to find it quickly here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sorted.map((c) => (
              <Card
                key={c.id}
                className="glass border-border/60 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => open(c.id)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.messages.length} message
                      {c.messages.length === 1 ? "" : "s"} ·{" "}
                      {new Date(c.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePin(c.id);
                      toast.success("Unpinned");
                    }}
                  >
                    <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
