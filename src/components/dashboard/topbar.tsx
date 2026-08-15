"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Icon } from "@/components/shared/icon";
import { Bell, Menu, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { SIDEBAR_GROUPS, type DashboardView } from "@/lib/constants";
import { getSupabaseBrowser } from "@/lib/supabase/browser-singleton";
import { toast } from "sonner";

export function TopBar() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const notifications = useAppStore((s) => s.notifications);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const user = useAppStore((s) => s.user);
  const logout = useAppStore((s) => s.logout);
  const commandOpen = useAppStore((s) => s.commandOpen);
  const setCommandOpen = useAppStore((s) => s.setCommandOpen);
  const newChat = useAppStore((s) => s.newChat);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Use requestAnimationFrame to avoid the set-state-in-effect lint
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const handleCommandSelect = (id: string) => {
    if (id === "chat") {
      newChat();
    } else {
      setDashboardView(id as DashboardView);
    }
    setCommandOpen(false);
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

  const initials = (user?.name || user?.email || "U")
    .split(/[\s@]+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <header className="h-14 flex items-center gap-2 px-3 sm:px-4 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      {/* Mobile sidebar trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-72">
          <Sidebar onNavigate={() => {}} />
        </SheetContent>
      </Sheet>

      {/* Search / command trigger */}
      <button
        onClick={() => setCommandOpen(true)}
        className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/40 hover:bg-muted text-sm text-muted-foreground flex-1 max-w-md"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search or jump to…</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded border border-border">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          {mounted && theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 relative"
          onClick={() => setDashboardView("notifications")}
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>

        {/* User avatar dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="User menu"
            >
              <Avatar className="w-8 h-8 border border-border">
                {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                ) : null}
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5 text-xs">
              <p className="font-medium truncate">{user?.name}</p>
              <p className="text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem onClick={() => setDashboardView("profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setDashboardView("settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Command palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Search views and actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {SIDEBAR_GROUPS.map((group) => (
            <CommandGroup key={group.label} heading={group.label}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.label} ${item.id}`}
                  onSelect={() => handleCommandSelect(item.id)}
                >
                  <Icon name={item.icon} className="mr-2 h-4 w-4" />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </header>
  );
}
