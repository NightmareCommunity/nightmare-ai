"use client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/shared/logo-mark";
import { Icon } from "@/components/shared/icon";
import {
  MessageSquare,
  ImageIcon,
  Presentation,
  ArrowRight,
  Activity,
  Sparkles,
} from "lucide-react";
import { BRAND } from "@/lib/constants";

export function HomeView() {
  const user = useAppStore((s) => s.user);
  const chats = useAppStore((s) => s.chats);
  const images = useAppStore((s) => s.generatedImages);
  const presentations = useAppStore((s) => s.presentations);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const newChat = useAppStore((s) => s.newChat);
  const setActiveChat = useAppStore((s) => s.setActiveChat);

  const recentChats = [...chats]
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, 5);

  const stats = [
    { label: "Chats", value: chats.length, icon: MessageSquare },
    { label: "Images", value: images.length, icon: ImageIcon },
    { label: "Presentations", value: presentations.length, icon: Presentation },
  ];

  const actions = [
    {
      label: "New Chat",
      desc: "Start a streaming conversation",
      icon: MessageSquare,
      onClick: () => newChat(),
    },
    {
      label: "Generate Image",
      desc: "Create with FLUX.1 / Pollinations",
      icon: ImageIcon,
      onClick: () => setDashboardView("images"),
    },
    {
      label: "Create Presentation",
      desc: "Topic to deck in seconds",
      icon: Presentation,
      onClick: () => setDashboardView("presentations"),
    },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-6xl mx-auto p-6 sm:p-8">
        {/* Hero header */}
        <div className="flex items-start justify-between gap-6 flex-wrap mb-8">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary mb-2">
              {BRAND.name} Workspace
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Welcome back, {user?.name?.split(" ")[0] || "Builder"}
            </h1>
            <p className="text-muted-foreground mt-1.5">
              {BRAND.tagline} Pick a surface and start creating.
            </p>
          </div>
          <LogoMark size={56} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stats.map((s) => (
            <Card key={s.label} className="glass border-border/60">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Quick actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {actions.map((a) => (
            <Card
              key={a.label}
              className="glass border-border/60 hover:border-primary/40 transition-colors cursor-pointer group"
              onClick={a.onClick}
            >
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-11 h-11 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
                  <a.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{a.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {a.desc}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent activity */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent activity
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDashboardView("history")}
          >
            View all
          </Button>
        </div>
        {recentChats.length === 0 ? (
          <Card className="glass border-border/60 border-dashed">
            <CardContent className="p-10 text-center">
              <Sparkles className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No chats yet. Start your first conversation to see it here.
              </p>
              <Button
                className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => newChat()}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentChats.map((c) => (
              <Card
                key={c.id}
                className="glass border-border/60 hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => {
                  setActiveChat(c.id);
                  setDashboardView("chat");
                }}
              >
                <CardContent className="p-3.5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.messages.length} message
                      {c.messages.length === 1 ? "" : "s"} ·{" "}
                      {new Date(c.updatedAt).toLocaleString()}
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
