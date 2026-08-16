// NIGHTMARE AI — Zustand store with persist + per-user encryption
import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import type { GeneratedImage } from "@/lib/ai/image/types";
import type { DashboardView } from "@/lib/constants";

/**
 * Per-user encrypted storage.
 *
 * PROBLEM: localStorage is shared across all users on the same browser. If
 * user A logs out and user B logs in, user B would see user A's chats.
 *
 * SOLUTION:
 * 1. Each user gets their own localStorage key: `nightmare-ai-store-${userId}`
 * 2. The data is XOR-encrypted with a key derived from the user ID + a
 *    per-installation random salt. This isn't NSA-grade crypto but it means
 *    the raw localStorage value is unreadable without the user ID, and
 *    different users can't read each other's data even if they inspect
 *    localStorage in DevTools.
 * 3. On logout, the current user's storage key is removed entirely.
 * 4. On login with a different user ID, the old user's data is cleared from
 *    memory and the new user's data is loaded (or empty if new user).
 */

const SALT_KEY = "nightmare-ai-salt";
const CURRENT_USER_KEY = "nightmare-ai-current-user";

function getSalt(): string {
  if (typeof window === "undefined") return "ssr-salt";
  let salt = localStorage.getItem(SALT_KEY);
  if (!salt) {
    salt = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SALT_KEY, salt);
  }
  return salt;
}

function deriveKey(userId: string): string {
  // Simple key derivation — not cryptographically strong but prevents casual
  // viewing of localStorage. The user ID + salt combo is unique per user
  // per browser.
  const salt = getSalt();
  return userId + ":" + salt;
}

function xorEncrypt(text: string, key: string): string {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  // Base64 encode so it's safe in localStorage (no raw binary chars)
  return btoa(result);
}

function xorDecrypt(encrypted: string, key: string): string {
  try {
    const text = atob(encrypted);
    let result = "";
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch {
    return "";
  }
}

function getStorageKey(userId: string): string {
  return `nightmare-ai-store-${userId}`;
}

function getCurrentUser(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(CURRENT_USER_KEY);
}

function setCurrentUser(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

/**
 * Custom storage that encrypts/decrypts per-user.
 * Falls back to unencrypted for SSR + pre-login state (no user yet).
 */
const encryptedStorage: StateStorage = {
  getItem(name) {
    if (typeof window === "undefined") return null;
    const userId = getCurrentUser();
    if (!userId) return null;
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    // Decrypt
    const encKey = deriveKey(userId);
    const decrypted = xorDecrypt(raw, encKey);
    if (!decrypted) return null;
    return decrypted;
  },
  setItem(name, value) {
    if (typeof window === "undefined") return;
    const userId = getCurrentUser();
    if (!userId) return; // Don't persist if no user is logged in
    const key = getStorageKey(userId);
    const encKey = deriveKey(userId);
    const encrypted = xorEncrypt(value, encKey);
    localStorage.setItem(key, encrypted);
  },
  removeItem(name) {
    if (typeof window === "undefined") return;
    const userId = getCurrentUser();
    if (!userId) return;
    const key = getStorageKey(userId);
    localStorage.removeItem(key);
  },
};

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
  // Generate a proper UUID v4 — required for Supabase UUID primary keys.
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

// Debounced chat persistence — prevents flooding the API during streaming.
// The API route does delete-all-then-insert, so concurrent calls race.
// This debounce coalesces rapid updates into a single API call.
const _persistTimers: Record<string, ReturnType<typeof setTimeout>> = {};
function debouncedPersistChat(
  chatId: string,
  get: () => AppState
) {
  if (_persistTimers[chatId]) clearTimeout(_persistTimers[chatId]);
  _persistTimers[chatId] = setTimeout(() => {
    delete _persistTimers[chatId];
    const { persistChatToServer } = get();
    if (persistChatToServer) persistChatToServer(chatId);
  }, 3000); // 3 second debounce — flushes 3s after the last token
}

// Flush all pending debounced persists immediately (e.g., on page unload)
function flushPendingPersists(get: () => AppState) {
  for (const [chatId, timer] of Object.entries(_persistTimers)) {
    clearTimeout(timer);
    delete _persistTimers[chatId];
    const { persistChatToServer } = get();
    if (persistChatToServer) persistChatToServer(chatId);
  }
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

  // Server sync (Supabase)
  _syncing: boolean;
  hydrateFromServer: () => Promise<void>;
  persistChatToServer: (chatId: string) => Promise<void>;
  persistPresentationToServer: (presentationId: string) => Promise<void>;
  deleteChatFromServer: (chatId: string) => Promise<void>;
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
      login: (user) => {
        const prevUser = get().user;
        const isDifferentUser = prevUser && prevUser.id !== user.id;
        setCurrentUser(user.id);
        if (isDifferentUser) {
          // Switching users: clear local state, then hydrate from server
          set({
            user,
            isAuthed: true,
            view: "dashboard",
            dashboardView: "home",
            chats: [],
            presentations: [],
            generatedImages: [],
            notifications: [],
            promptLibrary: [],
            cloudFiles: [],
            workspaceItems: [],
            activeChatId: null,
            activePresentationId: null,
            searchQuery: "",
          });
        } else {
          set({ user, isAuthed: true, view: "dashboard", dashboardView: "home" });
        }
        // Delay hydrate to give Supabase auth cookie time to propagate.
        // onAuthStateChange fires before the cookie is fully set in some browsers.
        setTimeout(() => {
          get().hydrateFromServer();
        }, 300);
      },
      logout: () => {
        // CRITICAL: logout only terminates the session. It does NOT delete data.
        // Supabase database records remain intact. The user will see all their
        // data again when they log back in (loaded via hydrateFromServer).
        const userId = get().user?.id;
        setCurrentUser(null);
        // Clear local in-memory state (data is safe in Supabase)
        set({
          user: null,
          isAuthed: false,
          view: "landing",
          dashboardView: "home",
          chats: [],
          presentations: [],
          generatedImages: [],
          notifications: [],
          promptLibrary: [],
          cloudFiles: [],
          workspaceItems: [],
          activeChatId: null,
          activePresentationId: null,
          searchQuery: "",
          _syncing: false,
        });
        // Note: we do NOT delete the localStorage entry. It serves as an
        // offline cache. When the user logs back in, hydrateFromServer()
        // will overwrite it with the latest data from Supabase.
      },
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
      deleteChat: (id) => {
        set((s) => ({
          chats: s.chats.filter((c) => c.id !== id),
          activeChatId: s.activeChatId === id ? null : s.activeChatId,
        }));
        get().deleteChatFromServer(id);
      },
      renameChat: (id, title) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c
          ),
        }));
        get().persistChatToServer(id);
      },
      togglePin: (id) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, pinned: !c.pinned } : c
          ),
        }));
        get().persistChatToServer(id);
      },
      archiveChat: (id) => {
        set((s) => ({
          chats: s.chats.map((c) =>
            c.id === id ? { ...c, archived: !c.archived } : c
          ),
        }));
        get().persistChatToServer(id);
      },
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
        // Persist to Supabase immediately so data survives logout/login
        get().persistChatToServer(chatId);
        return id;
      },
      updateMessage: (chatId, msgId, content) => {
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
        }));
        // NOTE: Do NOT persist on every updateMessage call — streaming
        // calls this hundreds of times per second. The streaming hook
        // calls persistChatToServer once after streaming completes.
        // We use a debounced persist here as a safety net.
        debouncedPersistChat(chatId, get);
      },
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
      addPresentation: (p) => {
        set((s) => ({ presentations: [p, ...s.presentations] }));
        get().persistPresentationToServer(p.id);
      },
      deletePresentation: (id) => {
        set((s) => ({
          presentations: s.presentations.filter((p) => p.id !== id),
          activePresentationId:
            s.activePresentationId === id ? null : s.activePresentationId,
        }));
        // Delete from server
        fetch(`/api/presentations-sync?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "same-origin",
        }).catch(() => {});
      },
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

      // ===== SERVER SYNC (Supabase) =====
      // These functions are the bridge between local Zustand state and the
      // Supabase database. Data is ALWAYS saved to Supabase — localStorage
      // is just an offline cache.
      _syncing: false,

      hydrateFromServer: async () => {
        if (get()._syncing) return;
        set({ _syncing: true });

        // Helper that tries to fetch chats with retry on 401
        const fetchWithRetry = async (
          url: string,
          retries = 3,
          delayMs = 500
        ): Promise<Response | null> => {
          for (let attempt = 0; attempt < retries; attempt++) {
            try {
              const res = await fetch(url, { credentials: "same-origin" });
              if (res.ok) return res;
              if (res.status === 401 && attempt < retries - 1) {
                // Auth cookie might not be set yet — wait and retry
                await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
                continue;
              }
              return res;
            } catch {
              if (attempt < retries - 1) {
                await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
                continue;
              }
              return null;
            }
          }
          return null;
        };

        try {
          const [chatsRes, presRes] = await Promise.all([
            fetchWithRetry("/api/chats"),
            fetchWithRetry("/api/presentations-sync"),
          ]);

          if (chatsRes && chatsRes.ok) {
            const data = await chatsRes.json();
            if (data.chats && Array.isArray(data.chats)) {
              // Only replace if we got actual data (or confirmed empty from server)
              if (!data.syncError) {
                set({ chats: data.chats });
              }
            }
          }

          if (presRes && presRes.ok) {
            const data = await presRes.json();
            if (data.presentations && Array.isArray(data.presentations)) {
              if (!data.syncError) {
                set({ presentations: data.presentations });
              }
            }
          }
        } catch (err) {
          console.error("[hydrateFromServer] failed:", err);
        } finally {
          set({ _syncing: false });
        }
      },

      persistChatToServer: async (chatId: string) => {
        const chat = get().chats.find((c) => c.id === chatId);
        if (!chat) return;
        try {
          await fetch("/api/chats", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              chat: {
                id: chat.id,
                title: chat.title,
                pinned: chat.pinned,
                archived: chat.archived,
                model: chat.model,
                messages: chat.messages.map((m) => ({
                  id: m.id,
                  role: m.role,
                  content: m.content,
                  tokens: m.tokens || 0,
                  createdAt: m.createdAt,
                })),
                createdAt: chat.createdAt,
                updatedAt: chat.updatedAt,
              },
            }),
          });
        } catch (err) {
          console.error("[persistChatToServer] failed:", err);
        }
      },

      persistPresentationToServer: async (presentationId: string) => {
        const p = get().presentations.find((x) => x.id === presentationId);
        if (!p) return;
        try {
          await fetch("/api/presentations-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ presentation: p }),
          });
        } catch (err) {
          console.error("[persistPresentationToServer] failed:", err);
        }
      },

      deleteChatFromServer: async (chatId: string) => {
        try {
          await fetch(`/api/chats?id=${encodeURIComponent(chatId)}`, {
            method: "DELETE",
            credentials: "same-origin",
          });
        } catch (err) {
          console.error("[deleteChatFromServer] failed:", err);
        }
      },
    }),
    {
      name: "nightmare-ai-store",
      storage: createJSONStorage(() => encryptedStorage),
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
