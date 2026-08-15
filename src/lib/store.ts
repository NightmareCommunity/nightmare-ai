// NIGHTMARE AI — Zustand store with persist
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GeneratedImage } from "@/lib/ai/image/types";
import type { DashboardView } from "@/lib/constants";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens?: number;
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  pinned: boolean;
  archived: boolean;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
  model?: string;
}

export interface StoredPresentation {
  id: string;
  title: string;
  topic: string;
  audience?: string;
  language: string;
  style?: string;
  theme?: string;
  slideCount: number;
  prompt: string;
  content: unknown;
  pptxPath?: string;
  pdfPath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  link?: { view: DashboardView; id?: string };
}

export interface PromptItem {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  theme: "dark" | "light";
  creativity: number;
  selectedModel: string;
  responseLength: "concise" | "standard" | "detailed";
  streaming: boolean;
}

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: string;
}

export function uid(): string {
  return (
    Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
  );
}

interface AppState {
  // Auth + view
  view: "landing" | "dashboard";
  dashboardView: DashboardView;
  user: AppUser | null;
  isAuthed: boolean;
  login: (user: AppUser) => void;
  logout: () => void;
  setView: (v: "landing" | "dashboard") => void;
  setDashboardView: (v: DashboardView) => void;

  // Chats
  chats: Chat[];
  activeChatId: string | null;
  newChat: (opts?: { title?: string; model?: string }) => string;
  deleteChat: (id: string) => void;
  renameChat: (id: string, title: string) => void;
  togglePin: (id: string) => void;
  archiveChat: (id: string) => void;
  setActiveChat: (id: string | null) => void;
  addMessage: (
    chatId: string,
    msg: { role: Message["role"]; content: string; tokens?: number }
  ) => string;
  updateMessage: (chatId: string, msgId: string, content: string) => void;
  deleteMessage: (chatId: string, msgId: string) => void;
  setChatModel: (chatId: string, model: string) => void;

  // Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Presentations
  presentations: StoredPresentation[];
  activePresentationId: string | null;
  addPresentation: (p: StoredPresentation) => void;
  deletePresentation: (id: string) => void;
  setActivePresentation: (id: string | null) => void;
  updatePresentation: (
    id: string,
    patch: Partial<StoredPresentation>
  ) => void;

  // Images
  generatedImages: GeneratedImage[];
  addGeneratedImage: (img: GeneratedImage) => void;
  addGeneratedImages: (imgs: GeneratedImage[]) => void;
  deleteGeneratedImage: (id: string) => void;
  clearGeneratedImages: () => void;

  // Notifications (cap 100)
  notifications: AppNotification[];
  addNotification: (
    n: Omit<AppNotification, "id" | "createdAt" | "read">
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotification: (id: string) => void;

  // Prompts
  promptLibrary: PromptItem[];
  addPrompt: (p: Omit<PromptItem, "id" | "createdAt" | "updatedAt">) => void;
  deletePrompt: (id: string) => void;

  // Settings
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;

  // UI
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (o: boolean) => void;

  // hydration flag
  _hydrated: boolean;
  setHydrated: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  creativity: 60,
  selectedModel: "auto",
  responseLength: "standard",
  streaming: true,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      view: "landing",
      dashboardView: "home",
      user: null,
      isAuthed: false,
      login: (user) =>
        set({ user, isAuthed: true, view: "dashboard", dashboardView: "home" }),
      logout: () =>
        set({
          user: null,
          isAuthed: false,
          view: "landing",
          activeChatId: null,
          activePresentationId: null,
        }),
      setView: (v) => set({ view: v }),
      setDashboardView: (v) => set({ dashboardView: v }),

      chats: [],
      activeChatId: null,
      newChat: (opts) => {
        const id = uid();
        const now = new Date().toISOString();
        const chat: Chat = {
          id,
          title: opts?.title || "New Chat",
          pinned: false,
          archived: false,
          messages: [],
          createdAt: now,
          updatedAt: now,
          model: opts?.model || get().settings.selectedModel,
        };
        set((s) => ({
          chats: [chat, ...s.chats],
          activeChatId: id,
          dashboardView: "chat",
        }));
        return id;
      },
      deleteChat: (id) =>
        set((s) => ({
          chats: s.chats.filter((c) => c.id !== id),
          activeChatId: s.activeChatId === id ? null : s.activeChatId,
        })),
      renameChat: (id, title) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
          ),
        })),
      togglePin: (id) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c
          ),
        })),
      archiveChat: (id) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, archived: !c.archived } : c
          ),
        })),
      setActiveChat: (id) => set({ activeChatId: id }),
      addMessage: (chatId, msg) => {
        const id = uid();
        const newMsg: Message = {
          id,
          role: msg.role,
          content: msg.content,
          tokens: msg.tokens,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: [...c.messages, newMsg],
                  updatedAt: new Date().toISOString(),
                  title:
                    c.title === "New Chat" && msg.role === "user"
                      ? msg.content.slice(0, 40) + (msg.content.length > 40 ? "..." : "")
                      : c.title,
                }
              : c
          ),
        }));
        return id;
      },
      updateMessage: (chatId, msgId, content) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId ? { ...m, content } : m
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : c
          ),
        })),
      deleteMessage: (chatId, msgId) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId
              ? { ...c, messages: c.messages.filter((m) => m.id !== msgId) }
              : c
          ),
        })),
      setChatModel: (chatId, model) =>
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === chatId ? { ...c, model } : c
          ),
        })),

      searchQuery: "",
      setSearchQuery: (q) => set({ searchQuery: q }),

      presentations: [],
      activePresentationId: null,
      addPresentation: (p) =>
        set((s) => ({ presentations: [p, ...s.presentations] })),
      deletePresentation: (id) =>
        set((s) => ({
          presentations: s.presentations.filter((p) => p.id !== id),
          activePresentationId:
            s.activePresentationId === id ? null : s.activePresentationId,
        })),
      setActivePresentation: (id) => set({ activePresentationId: id }),
      updatePresentation: (id, patch) =>
        set((s) => ({
          presentations: s.presentations.map((p) =>
            p.id === id
              ? { ...p, ...patch, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      generatedImages: [],
      addGeneratedImage: (img) =>
        set((s) => ({ generatedImages: [img, ...s.generatedImages] })),
      addGeneratedImages: (imgs) =>
        set((s) => ({
          generatedImages: [...imgs, ...s.generatedImages],
        })),
      deleteGeneratedImage: (id) =>
        set((s) => ({
          generatedImages: s.generatedImages.filter((i) => i.id !== id),
        })),
      clearGeneratedImages: () => set({ generatedImages: [] }),

      notifications: [],
      addNotification: (n) =>
        set((s) => {
          const notif: AppNotification = {
            ...n,
            id: uid(),
            createdAt: new Date().toISOString(),
            read: false,
          };
          const next = [notif, ...s.notifications];
          if (next.length > 100) next.length = 100;
          return { notifications: next };
        }),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
      clearNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      promptLibrary: [],
      addPrompt: (p) =>
        set((s) => {
          const now = new Date().toISOString();
          const item: PromptItem = {
            ...p,
            id: uid(),
            createdAt: now,
            updatedAt: now,
          };
          return { promptLibrary: [item, ...s.promptLibrary] };
        }),
      deletePrompt: (id) =>
        set((s) => ({
          promptLibrary: s.promptLibrary.filter((p) => p.id !== id),
        })),

      settings: DEFAULT_SETTINGS,
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      sidebarCollapsed: false,
      toggleSidebar: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      commandOpen: false,
      setCommandOpen: (o) => set({ commandOpen: o }),

      _hydrated: false,
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: "nightmare-ai-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        user: s.user,
        isAuthed: s.isAuthed,
        chats: s.chats,
        presentations: s.presentations,
        generatedImages: s.generatedImages,
        notifications: s.notifications,
        promptLibrary: s.promptLibrary,
        settings: s.settings,
        view: s.view,
        dashboardView: s.dashboardView,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);
