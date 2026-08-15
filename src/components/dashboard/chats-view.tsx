"use client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Pin, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export function ChatsView() {
  const chats = useAppStore((s) => s.chats);
  const setActiveChat = useAppStore((s) => s.setActiveChat);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const newChat = useAppStore((s) => s.newChat);
  const togglePin = useAppStore((s) => s.togglePin);
  const deleteChat = useAppStore((s) => s.deleteChat);

  const sorted = [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt > a.updatedAt ? 1 : -1;
  });

  const open = (id: string) => {
    setActiveChat(id);
    setDashboardView("chat");
  };

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-5xl mx-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              All Chats
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {chats.length} conversation{chats.length === 1 ? "" : "s"} total
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
              <MessageSquare className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No conversations yet. Start your first chat to see it here.
              </p>
              <Button
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => newChat()}
              >
                Start a chat
              </Button>
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
                  <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {c.pinned && (
                        <Pin className="w-3 h-3 text-primary" />
                      )}
                      <p className="text-sm font-medium truncate">{c.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {c.messages.length} message
                      {c.messages.length === 1 ? "" : "s"} ·{" "}
                      {new Date(c.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(c.id);
                        toast.success(c.pinned ? "Unpinned" : "Pinned");
                      }}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Delete this chat?")) {
                          deleteChat(c.id);
                          toast.success("Deleted");
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
