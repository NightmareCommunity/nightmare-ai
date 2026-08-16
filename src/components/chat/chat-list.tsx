"use client";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Pin, Archive, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ChatListProps {
  onNavigate?: () => void;
}

export function ChatList({ onNavigate }: ChatListProps) {
  const chats = useAppStore((s) => s.chats);
  const activeChatId = useAppStore((s) => s.activeChatId);
  const setActiveChat = useAppStore((s) => s.setActiveChat);
  const newChat = useAppStore((s) => s.newChat);
  const togglePin = useAppStore((s) => s.togglePin);
  const archiveChat = useAppStore((s) => s.archiveChat);
  const deleteChat = useAppStore((s) => s.deleteChat);

  const sortedChats = [...chats].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt > a.updatedAt ? 1 : -1;
  });

  const handleNew = () => {
    newChat();
    onNavigate?.();
  };

  const handleSelect = (id: string) => {
    setActiveChat(id);
    onNavigate?.();
  };

  const preview = (chatId: string): string => {
    const c = chats.find((x) => x.id === chatId);
    if (!c || c.messages.length === 0) return "No messages yet";
    const lastMsg = c.messages[c.messages.length - 1];
    // Strip markdown for clean preview
    const raw = lastMsg.content
      .replace(/```[\s\S]*?```/g, "[code]") // code blocks
      .replace(/`([^`]+)`/g, "$1") // inline code
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "[image]") // images
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links
      .replace(/[*_#>~|-]/g, "") // markdown symbols
      .replace(/\n+/g, " ") // newlines → space
      .trim();
    const prefix = lastMsg.role === "user" ? "" : "";
    return prefix + raw.slice(0, 60);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <Button
          className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handleNew}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto custom-scroll px-2 py-2">
        {sortedChats.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-3">
            No conversations yet. Click &quot;New Chat&quot; to begin.
          </p>
        ) : (
          <div className="space-y-1">
            {sortedChats.map((c) => {
              const active = c.id === activeChatId;
              return (
                <div
                  key={c.id}
                  className={cn(
                    "group rounded-md cursor-pointer transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-accent text-foreground/80"
                  )}
                  onClick={() => handleSelect(c.id)}
                >
                  <div className="px-2.5 py-2 flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {c.pinned && (
                          <Pin className="w-3 h-3 text-primary shrink-0" />
                        )}
                        <p className="text-sm font-medium truncate">{c.title}</p>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {preview(c.id)}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(c.id);
                          toast.success(c.pinned ? "Unpinned" : "Pinned");
                        }}
                        className="p-1 hover:bg-accent rounded"
                        title={c.pinned ? "Unpin" : "Pin"}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveChat(c.id);
                          toast.success(
                            c.archived ? "Restored" : "Archived"
                          );
                        }}
                        className="p-1 hover:bg-accent rounded"
                        title={c.archived ? "Restore" : "Archive"}
                      >
                        <Archive className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this chat?")) {
                            deleteChat(c.id);
                            toast.success("Deleted");
                          }
                        }}
                        className="p-1 hover:bg-accent rounded text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
