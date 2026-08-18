"use client";
import { useAppStore } from "@/lib/store";
import { Icon } from "@/components/shared/icon";
import { SIDEBAR_GROUPS, type DashboardView } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/shared/logo-mark";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowser } from "@/lib/supabase/browser-singleton";
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  LogOut,
  Plus,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const dashboardView = useAppStore((s) => s.dashboardView);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const newChat = useAppStore((s) => s.newChat);
  const collapsed = useAppStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const chats = useAppStore((s) => s.chats);
  const activeChatId = useAppStore((s) => s.activeChatId);
  const setActiveChat = useAppStore((s) => s.setActiveChat);

  const initials = (user?.name || user?.email || "U")
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const handleNavigate = (id: DashboardView) => {
    if (id === "chat") {
      newChat();
      setDashboardView("chat");
    } else {
      setDashboardView(id);
    }
    onNavigate?.();
  };

  const handleSignOut = async () => {
    try {
      await getSupabaseBrowser().auth.signOut();
    } catch {
      // ignore
    }
    logout();
    toast.success("Signed out");
  };

  const handleOpenChat = (chatId: string) => {
    setActiveChat(chatId);
    setDashboardView("chat");
    onNavigate?.();
  };

  // Show 5 most recent chats (sorted by updatedAt desc)
  const recentChats = [...chats]
    .sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1))
    .slice(0, 5);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-sidebar-border shrink-0">
        {collapsed ? (
          <div className="flex justify-center w-full">
            <LogoMark size={32} />
          </div>
        ) : (
          <LogoMark size={32} withWordmark />
        )}
        <button
          onClick={toggleSidebar}
          className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors hidden md:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* + New Chat button */}
      {!collapsed && (
        <div className="p-2 shrink-0">
          <Button
            onClick={() => handleNavigate("chat")}
            className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
      )}
      {collapsed && (
        <div className="p-2 shrink-0">
          <Button
            onClick={() => handleNavigate("chat")}
            size="icon"
            className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto custom-scroll px-2 py-2 space-y-4">
        {SIDEBAR_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground/70 px-2 mb-1.5">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = dashboardView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigate(item.id as DashboardView)}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-sm transition-colors group",
                      collapsed && "justify-center",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon
                      name={item.icon}
                      className={cn(
                        "w-4 h-4 shrink-0",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {/* Recent Conversations — inside the same sidebar */}
        {!collapsed && recentChats.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider font-mono text-muted-foreground/70 px-2 mb-1.5">
              Recent
            </p>
            <div className="space-y-0.5">
              {recentChats.map((chat) => {
                const active = activeChatId === chat.id && dashboardView === "chat";
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleOpenChat(chat.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                      active
                        ? "bg-primary/15 text-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        "w-3.5 h-3.5 shrink-0",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="truncate flex-1">{chat.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User area */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors",
                collapsed && "justify-center"
              )}
            >
              <Avatar className="w-7 h-7 border border-border">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && user && (
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-xs font-medium truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDashboardView("profile")}>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDashboardView("settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
