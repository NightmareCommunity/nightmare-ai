// NIGHTMARE AI — NVIDIA NIM chat provider (OpenAI-compatible)
import OpenAI from "openai";
import type {
  ChatRequest,
  ChatResponse,
  StreamChunk,
} from "@/lib/ai/types";
import { AIError, classifyHttpError } from "@/lib/ai/errors";
import { DEFAULT_MODEL_ID } from "@/lib/constants";

const client = new OpenAI({
  baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "",
});

export function isConfigured(): boolean {
  return !!process.env.NVIDIA_API_KEY;
}

function normalizeModel(model?: string): string {
  if (!model || model === "auto") return DEFAULT_MODEL_ID;
  return model;
}

function creativityToTemperature(creativity?: number): number {
  if (typeof creativity !== "number") return 0.6;
  const clamped = Math.max(0, Math.min(100, creativity));
  return Math.round((clamped / 100) * 1.2 * 100) / 100;
}

function wrapError(err: unknown): AIError {
  if (err instanceof AIError) return err;
  if (err instanceof Error && err.name === "AbortError") {
    return new AIError("cancelled", "Request was cancelled");
  }
  const anyErr = err as { status?: number; message?: string };
  const status = anyErr?.status;
  if (typeof status === "number") {
    return new AIError(
      classifyHttpError(status),
      anyErr.message || `NVIDIA NIM request failed (${status})`,
      status
    );
  }
  return new AIError(
    "network",
    (err instanceof Error ? err.message : "Network error") ||
      "Unknown network error"
  );
}

export async function complete(req: ChatRequest): Promise<ChatResponse> {
  if (!isConfigured()) {
    throw new AIError(
      "config",
      "NVIDIA API key not configured. Set NVIDIA_API_KEY."
    );
  }
  const model = normalizeModel(req.model);
  try {
    const res = await client.chat.completions.create({
      model,
      messages: req.messages,
      stream: false,
      temperature: creativityToTemperature(req.creativity),
      max_tokens: req.maxTokens ?? 1024,
    });
    const choice = res.choices?.[0];
    const content = choice?.message?.content || "";
    return {
      content,
      model: res.model || model,
      usage: res.usage
        ? {
            prompt_tokens: res.usage.prompt_tokens,
            completion_tokens: res.usage.completion_tokens,
            total_tokens: res.usage.total_tokens,
          }
        : undefined,
    };
  } catch (err) {
    throw wrapError(err);
  }
}

export async function* stream(req: ChatRequest): AsyncGenerator<StreamChunk> {
  if (!isConfigured()) {
    throw new AIError(
      "config",
      "NVIDIA API key not configured. Set NVIDIA_API_KEY."
    );
  }
  const model = normalizeModel(req.model);
  const baseURL =
    process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
  const apiKey = process.env.NVIDIA_API_KEY || "";

  // Use raw fetch + manual SSE parsing — more reliable on Cloudflare Workers
  // than the OpenAI SDK's stream iterator (which can silently close).
  let resp: Response;
  try {
    resp = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model,
        messages: req.messages,
        stream: true,
        temperature: creativityToTemperature(req.creativity),
        max_tokens: req.maxTokens ?? 1024,
        stream_options: { include_usage: true },
      }),
      signal: req.signal,
    });
  } catch (err) {
    throw wrapError(err);
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new AIError(
      classifyHttpError(resp.status),
      `NVIDIA NIM request failed (${resp.status}): ${text.slice(0, 300)}`,
      resp.status
    );
  }

  if (!resp.body) {
    throw new AIError("server", "No response body from NVIDIA NIM");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let lastUsage: StreamChunk["usage"] | undefined;

  try {
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
        if (payload === "[DONE]") continue;
        try {
          const chunk = JSON.parse(payload) as {
            choices?: Array<{
              delta?: { content?: string };
            }>;
            usage?: StreamChunk["usage"];
          };
          const delta = chunk.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            yield { type: "delta", content: delta };
          }
          if (chunk.usage) {
            lastUsage = chunk.usage;
          }
        } catch {
          // partial JSON, skip
        }
      }
    }
  } catch (err) {
    throw wrapError(err);
  }

  if (lastUsage) {
    yield { type: "usage", usage: lastUsage };
  }
  yield { type: "done" };
}
