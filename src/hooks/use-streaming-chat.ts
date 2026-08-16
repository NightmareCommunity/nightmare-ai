"use client";
import { useCallback, useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

// Debounce persistChatToServer during streaming so we don't flood the API.
// The store's updateMessage calls persistChatToServer on every chunk —
// this debounce coalesces them into a single call after streaming pauses.
const persistTimers: Record<string, ReturnType<typeof setTimeout>> = {};
function debouncedPersist(chatId: string, fn: () => void, delay = 2000) {
  if (persistTimers[chatId]) clearTimeout(persistTimers[chatId]);
  persistTimers[chatId] = setTimeout(() => {
    fn();
    delete persistTimers[chatId];
  }, delay);
}

interface UseStreamingChatResult {
  sendMessage: (
    chatId: string,
    userText: string,
    opts?: { model?: string; creativity?: number }
  ) => Promise<void>;
  isStreaming: boolean;
  error: string | null;
  abort: () => void;
}

interface SSEParsed {
  delta?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  error?: string;
  kind?: string;
}

export function useStreamingChat(): UseStreamingChatResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const addMessage = useAppStore((s) => s.addMessage);
  const updateMessage = useAppStore((s) => s.updateMessage);
  const getChat = useAppStore.getState;

  const abort = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (
      chatId: string,
      userText: string,
      opts?: { model?: string; creativity?: number }
    ) => {
      const state = getChat();
      const chat = state.chats.find((c) => c.id === chatId);
      if (!chat) {
        toast.error("Chat not found");
        return;
      }
      const settings = state.settings;
      const model = opts?.model || chat.model || settings.selectedModel;
      const creativity =
        typeof opts?.creativity === "number"
          ? opts.creativity
          : settings.creativity;

      addMessage(chatId, { role: "user", content: userText });
      const assistantId = addMessage(chatId, {
        role: "assistant",
        content: "",
      });

      const history = [
        ...chat.messages,
        {
          id: "u",
          role: "user" as const,
          content: userText,
          createdAt: new Date().toISOString(),
        },
      ].map((m) => ({ role: m.role, content: m.content }));

      setIsStreaming(true);
      setError(null);
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            stream: true,
            model,
            creativity,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const txt = await res.text().catch(() => "");
          throw new Error(
            `Chat request failed (${res.status}): ${txt || res.statusText}`
          );
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        // Read SSE
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let idx: number;
          while ((idx = buffer.indexOf("\n\n")) !== -1) {
            const raw = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 2);
            if (!raw.startsWith("data:")) continue;
            const payload = raw.slice(5).trim();
            if (payload === "[DONE]") {
              continue;
            }
            try {
              const parsed = JSON.parse(payload) as SSEParsed;
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.delta) {
                accumulated += parsed.delta;
                updateMessage(chatId, assistantId, accumulated);
              }
            } catch {
              // ignore parse errors of partial chunks
            }
          }
        }

        if (!accumulated) {
          updateMessage(
            chatId,
            assistantId,
            "_(No response received from the model. Please try again.)_"
          );
        }
      } catch (err) {
        if (
          err instanceof Error &&
          (err.name === "AbortError" || /abort/i.test(err.message))
        ) {
          // user cancelled
          updateMessage(
            chatId,
            assistantId,
            "_(Response cancelled.)_"
          );
        } else {
          const message =
            err instanceof Error ? err.message : "Streaming failed";
          setError(message);
          toast.error(message);
          updateMessage(
            chatId,
            assistantId,
            `**Error:** ${message}`
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
        // Final persist to Supabase — ensures the complete response is saved
        const state = getChat();
        const persistChat = state.persistChatToServer;
        if (persistChat) {
          // Clear any pending debounce and persist immediately
          if (persistTimers[chatId]) {
            clearTimeout(persistTimers[chatId]);
            delete persistTimers[chatId];
          }
          persistChat(chatId);
        }
      }
    },
    [addMessage, updateMessage, getChat]
  );

  return { sendMessage, isStreaming, error, abort };
}
