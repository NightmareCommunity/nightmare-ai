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
  try {
    const stream = await client.chat.completions.create({
      model,
      messages: req.messages,
      stream: true,
      temperature: creativityToTemperature(req.creativity),
      max_tokens: req.maxTokens ?? 1024,
    });
    let lastUsage: StreamChunk["usage"] | undefined;
    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta.length > 0) {
        yield { type: "delta", content: delta };
      }
      if ((chunk as { usage?: StreamChunk["usage"] }).usage) {
        lastUsage = (chunk as { usage: StreamChunk["usage"] }).usage;
      }
    }
    if (lastUsage) {
      yield { type: "usage", usage: lastUsage };
    }
    yield { type: "done" };
  } catch (err) {
    throw wrapError(err);
  }
}
