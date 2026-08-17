"use client";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import type { Chat, Message } from "@/lib/store";
import { ChatList } from "@/components/chat/chat-list";
import { ChatInput } from "@/components/chat/chat-input";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ModelPicker } from "@/components/chat/model-picker";
import { ThinkingOrbs } from "@/components/shared/thinking-orbs";
import { EmptyChatState } from "@/components/chat/empty-chat-state";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  Menu,
  PanelLeft,
  Sparkles,
  Trash2,
  Pencil,
  SlidersHorizontal,
} from "lucide-react";
import { useStreamingChat } from "@/hooks/use-streaming-chat";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const EXAMPLE_PROMPTS = [
  "Explain quantum computing in three sentences",
  "Write a short poem about the sea",
  "Debug my React useEffect loop",
  "Give me 5 startup ideas using AI agents",
];

export function ChatView() {
  const chats = useAppStore((s) => s.chats);
  const activeChatId = useAppStore((s) => s.activeChatId);
  const setActiveChat = useAppStore((s) => s.setActiveChat);
  const newChat = useAppStore((s) => s.newChat);
  const renameChat = useAppStore((s) => s.renameChat);
  const setChatModel = useAppStore((s) => s.setChatModel);
  const deleteMessage = useAppStore((s) => s.deleteMessage);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const deleteChat = useAppStore((s) => s.deleteChat);

  const { sendMessage, isStreaming, abort } = useStreamingChat();

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [creativity, setCreativity] = useState(settings.creativity);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const chat: Chat | undefined = chats.find((c) => c.id === activeChatId);

  // Auto-scroll on new content
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTop = el.scrollHeight;
  }, [chat?.messages, isStreaming]);

  // Ensure there is an active chat
  useEffect(() => {
    if (!activeChatId && chats.length > 0) {
      setActiveChat(chats[0].id);
    }
  }, [activeChatId, chats, setActiveChat]);

  const handleSend = (text: string, files?: import("@/components/chat/chat-input").AttachedFile[]) => {
    if (!text.trim() && (!files || files.length === 0)) return;
    // If files are attached, add them to the message content
    let messageContent = text;
    if (files && files.length > 0) {
      const fileList = files.map((f) => {
        if (f.preview) {
          return `![${f.file.name}](${f.preview})`;
        }
        return `[${f.file.name}](${f.file.type || "file"}, ${f.file.size} bytes)`;
      }).join("\n");
      messageContent = `${text}\n\nAttached files:\n${fileList}`;
    }
    if (!chat) {
      const id = newChat();
      setTimeout(() => sendMessage(id, messageContent), 0);
      return;
    }
    sendMessage(chat.id, messageContent);
  };

  const handleRename = () => {
    if (!chat) return;
    const title = titleDraft.trim();
    if (title) {
      renameChat(chat.id, title);
      toast.success("Chat renamed");
    }
    setEditingTitle(false);
  };

  const handleClearChat = () => {
    if (!chat) return;
    if (chat.messages.length === 0) return;
    if (!confirm("Clear all messages in this chat?")) return;
    for (const m of [...chat.messages].reverse()) {
      deleteMessage(chat.id, m.id);
    }
    toast.success("Chat cleared");
  };

  const handleDeleteChat = () => {
    if (!chat) return;
    if (!confirm("Delete this chat permanently?")) return;
    deleteChat(chat.id);
    toast.success("Chat deleted");
  };

  const handleExampleClick = (prompt: string) => {
    handleSend(prompt);
  };

  return (
    <div className="flex h-full">
      {/* Chat list (desktop) */}
      <div className="hidden lg:flex w-64 border-r border-border bg-card/30">
        <ChatList />
      </div>

      {/* Main chat column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-14 flex items-center gap-2 px-3 sm:px-4 border-b border-border bg-background/80 backdrop-blur">
          {/* Mobile chat list trigger */}
          <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <ChatList onNavigate={() => setShowSidebar(false)} />
            </SheetContent>
          </Sheet>

          {chat && (
            <>
              {editingTitle ? (
                <Input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename();
                    if (e.key === "Escape") setEditingTitle(false);
                  }}
                  className="h-8 max-w-xs"
                />
              ) : (
                <button
                  className="flex items-center gap-1.5 text-sm font-medium hover:text-primary transition-colors truncate"
                  onClick={() => {
                    setTitleDraft(chat.title);
                    setEditingTitle(true);
                  }}
                  title="Click to rename"
                >
                  <Pencil className="w-3 h-3 opacity-50" />
                  <span className="truncate">{chat.title}</span>
                </button>
              )}
            </>
          )}

          <div className="ml-auto flex items-center gap-1">
            {chat && (
              <>
                <ModelPicker
                  value={chat.model || settings.selectedModel}
                  onChange={(m) => setChatModel(chat.id, m)}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs">Creativity</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="end">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Creativity</p>
                        <span className="text-xs text-muted-foreground font-mono">
                          {creativity}
                        </span>
                      </div>
                      <Slider
                        value={[creativity]}
                        onValueChange={(v) => {
                          setCreativity(v[0]);
                          updateSettings({ creativity: v[0] });
                        }}
                        min={0}
                        max={100}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground">
                        Lower = focused. Higher = creative.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={handleClearChat}
                  title="Clear chat"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto custom-scroll"
        >
          {!chat || chat.messages.length === 0 ? (
            <EmptyChatState
              onPromptClick={handleExampleClick}
              examples={EXAMPLE_PROMPTS}
            />
          ) : (
            <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-5">
              {chat.messages.map((m: Message) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isStreaming &&
                chat.messages[chat.messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center pt-2">
                      <ThinkingOrbs />
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border bg-background/80 backdrop-blur">
          <div className="max-w-3xl mx-auto p-3 sm:p-4">
            {isStreaming ? (
              <div className="flex items-center justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={abort}
                  className="h-9"
                >
                  Stop generating
                </Button>
              </div>
            ) : (
              <ChatInput onSend={handleSend} disabled={!chat || isStreaming} />
            )}
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              NIGHTMARE AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
