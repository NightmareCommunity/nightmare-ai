// NIGHTMARE AI — chat model router
import type { ChatRequest, ChatResponse, StreamChunk } from "@/lib/ai/types";
import { AIError } from "@/lib/ai/errors";
import * as nvidia from "@/lib/ai/nvidia";
import {
  AUTO_MODEL,
  DEFAULT_MODEL_ID,
  NVIDIA_MODELS,
  type ChatModelDescriptor,
} from "@/lib/constants";

export function resolveModel(
  modelId?: string
): { id: string; descriptor: ChatModelDescriptor | typeof AUTO_MODEL } {
  if (!modelId || modelId === "auto") {
    return {
      id: DEFAULT_MODEL_ID,
      descriptor: AUTO_MODEL,
    };
  }
  const descriptor = NVIDIA_MODELS.find((m) => m.id === modelId);
  if (!descriptor) {
    throw new AIError(
      "model_unavailable",
      `Model ${modelId} is not in the available model list.`
    );
  }
  if (!descriptor.enabled) {
    throw new AIError(
      "model_unavailable",
      `Model ${descriptor.displayName} is currently disabled.`
    );
  }
  return { id: descriptor.id, descriptor };
}

export async function complete(req: ChatRequest): Promise<ChatResponse> {
  const { id } = resolveModel(req.model);
  return nvidia.complete({ ...req, model: id });
}

export async function* stream(
  req: ChatRequest
): AsyncGenerator<StreamChunk> {
  const { id } = resolveModel(req.model);
  yield* nvidia.stream({ ...req, model: id });
}

export function listAvailableModels() {
  return {
    models: [AUTO_MODEL, ...NVIDIA_MODELS.filter((m) => m.enabled)],
    defaultModel: "auto",
  };
}
