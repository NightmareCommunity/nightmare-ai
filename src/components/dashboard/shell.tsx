"use client";
import { useAppStore } from "@/lib/store";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/topbar";
import { HomeView } from "@/components/dashboard/home-view";
import { ChatView } from "@/components/chat/chat-view";
import { ChatsView } from "@/components/dashboard/chats-view";
import { FavoritesView } from "@/components/dashboard/favorites-view";
import { ImagesView } from "@/components/images/images-view";
import { PresentationsView } from "@/components/presentations/presentations-view";
import { HistoryView } from "@/components/dashboard/history-view";
import { NotificationsView } from "@/components/dashboard/notifications-view";
import { SettingsView } from "@/components/dashboard/settings-view";
import { ProfileView } from "@/components/dashboard/profile-view";
import { AILibraryView } from "@/components/dashboard/ai-library-view";
import { PromptLibraryView } from "@/components/dashboard/prompt-library-view";
import { TemplatesView } from "@/components/dashboard/templates-view";
import { DocumentsView } from "@/components/dashboard/documents-view";
import { CloudStorageView } from "@/components/dashboard/cloud-storage-view";
import { WorkspaceView } from "@/components/dashboard/workspace-view";
import type { DashboardView } from "@/lib/constants";

export function DashboardShell() {
  const view = useAppStore((s) => s.dashboardView);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-hidden">
          {renderView(view)}
        </main>
      </div>
    </div>
  );
}

function renderView(view: DashboardView) {
  // Views that manage their own scrolling (full-height, internal scroll)
  switch (view) {
    case "chat":
      return <ChatView />;
    case "images":
      return <ImagesView />;
    case "presentations":
      return <PresentationsView />;
    default:
      break;
  }
  // All other views are wrapped in a scrollable container
  const content = (() => {
    switch (view) {
      case "home":
        return <HomeView />;
      case "chats":
        return <ChatsView />;
      case "favorites":
        return <FavoritesView />;
      case "history":
        return <HistoryView />;
      case "notifications":
        return <NotificationsView />;
      case "settings":
        return <SettingsView />;
      case "profile":
        return <ProfileView />;
      case "ai-library":
        return <AILibraryView />;
      case "prompt-library":
        return <PromptLibraryView />;
      case "templates":
        return <TemplatesView />;
      case "documents":
        return <DocumentsView />;
      case "cloud-storage":
        return <CloudStorageView />;
      case "workspace":
        return <WorkspaceView />;
      case "shared-files":
        return <DocumentsView />;
      default:
        return <HomeView />;
    }
  })();
  return (
    <div className="h-full overflow-y-auto custom-scroll">{content}</div>
  );
}
