"use client";
import { useAppStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/shared/icon";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function NotificationsView() {
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);
  const clearNotification = useAppStore((s) => s.clearNotification);
  const setDashboardView = useAppStore((s) => s.setDashboardView);

  const sorted = [...notifications].sort((a, b) =>
    b.createdAt > a.createdAt ? 1 : -1
  );
  const unread = notifications.filter((n) => !n.read).length;

  const handleClearAll = () => {
    if (!confirm("Clear all notifications?")) return;
    for (const n of notifications) {
      clearNotification(n.id);
    }
    toast.success("Notifications cleared");
  };

  return (
    <div className="h-full overflow-y-auto custom-scroll">
      <div className="max-w-3xl mx-auto p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {unread} unread · {notifications.length} total
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={markAllNotificationsRead}
              disabled={unread === 0}
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5" />
              Mark all read
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={handleClearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear all
            </Button>
          </div>
        </div>

        {sorted.length === 0 ? (
          <Card className="border-dashed glass">
            <CardContent className="p-12 text-center">
              <Bell className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No notifications yet. You&apos;ll see updates here as you use
                NIGHTMARE AI.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sorted.map((n) => (
              <Card
                key={n.id}
                className={cn(
                  "border-border/60 transition-colors",
                  n.read ? "opacity-60" : "glass border-primary/30"
                )}
              >
                <CardContent className="p-3.5 flex items-start gap-3">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                      n.type === "success"
                        ? "bg-emerald-500/15"
                        : n.type === "error"
                        ? "bg-destructive/15"
                        : n.type === "warning"
                        ? "bg-amber-500/15"
                        : "bg-primary/15"
                    )}
                  >
                    <Icon
                      name={
                        n.type === "success"
                          ? "CheckCircle2"
                          : n.type === "error"
                          ? "AlertCircle"
                          : n.type === "warning"
                          ? "AlertTriangle"
                          : "Info"
                      }
                      className={cn(
                        "w-4 h-4",
                        n.type === "success"
                          ? "text-emerald-500"
                          : n.type === "error"
                          ? "text-destructive"
                          : n.type === "warning"
                          ? "text-amber-500"
                          : "text-primary"
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {n.link && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setDashboardView(n.link!.view)}
                      >
                        Open
                      </Button>
                    )}
                    {!n.read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => markNotificationRead(n.id)}
                      >
                        Mark read
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs text-destructive"
                      onClick={() => clearNotification(n.id)}
                    >
                      Clear
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
