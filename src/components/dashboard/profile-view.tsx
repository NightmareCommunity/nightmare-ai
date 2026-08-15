"use client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, ImageIcon, Presentation, Settings, Calendar } from "lucide-react";

export function ProfileView() {
  const user = useAppStore((s) => s.user);
  const chats = useAppStore((s) => s.chats);
  const images = useAppStore((s) => s.generatedImages);
  const presentations = useAppStore((s) => s.presentations);
  const setDashboardView = useAppStore((s) => s.setDashboardView);

  const initials = (user?.name || user?.email || "U")
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const stats = [
    { label: "Chats", value: chats.length, icon: MessageSquare },
    { label: "Images", value: images.length, icon: ImageIcon },
    { label: "Presentations", value: presentations.length, icon: Presentation },
  ];

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-3xl mx-auto p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">
          Profile
        </h1>

        <Card className="glass border-border/60 mb-6">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <Avatar className="w-20 h-20 border-2 border-primary/30">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold tracking-tight">
                  {user?.name}
                </h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 justify-center sm:justify-start">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-muted text-foreground">
                      {user?.provider}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    Member since {new Date().getFullYear()}
                  </span>
                </div>
                <Button
                  className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 h-9"
                  onClick={() => setDashboardView("settings")}
                >
                  <Settings className="w-3.5 h-3.5 mr-1.5" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Stats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((s) => (
            <Card key={s.label} className="glass border-border/60">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
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
      </div>
    </div>
  );
}
