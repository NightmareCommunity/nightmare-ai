// NIGHTMARE AI — NVIDIA NIM image provider (OpenAI-compatible images API)
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { aspectToSize, DEFAULT_IMAGE_MODEL_ID } from "@/lib/constants";
import type {
  GeneratedImage,
  ImageRequest,
  ImageResponse,
} from "@/lib/ai/image/types";
import { ImageError } from "@/lib/ai/image/types";
import { classifyHttpError } from "@/lib/ai/errors";

// Lazy-init: same reason as nvidia.ts — avoid SDK throwing during build
let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (_client) return _client;
  _client = new OpenAI({
    baseURL:
      process.env.NVIDIA_IMAGE_BASE_URL ||
      "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NVIDIA_API_KEY || "missing",
  });
  return _client;
}

export function isConfigured(): boolean {
  return !!process.env.NVIDIA_API_KEY;
}

function detectMime(b64: string): string {
  const head = b64.slice(0, 5);
  if (head.startsWith("iVBOR")) return "image/png";
  if (head.startsWith("/9j/")) return "image/jpeg";
  if (head.startsWith("UklGR")) return "image/webp";
  return "image/png";
}

function parseSize(ar: string | undefined): { width: number; height: number } {
  const size = aspectToSize(ar || "1:1");
  const [w, h] = size.split("x").map((n) => parseInt(n, 10));
  return { width: w || 1024, height: h || 1024 };
}

function wrapError(err: unknown): ImageError {
  if (err instanceof ImageError) return err;
  const anyErr = err as { status?: number; message?: string };
  const status = anyErr?.status;
  if (typeof status === "number") {
    return new ImageError(
      classifyHttpError(status),
      anyErr.message || `NVIDIA image request failed (${status})`,
      status
    );
  }
  return new ImageError(
    "network",
    (err instanceof Error ? err.message : "Network error") ||
      "Unknown network error"
  );
}

export async function generate(req: ImageRequest): Promise<ImageResponse> {
  if (!isConfigured()) {
    throw new ImageError(
      "auth",
      "NVIDIA API key not configured. Set NVIDIA_API_KEY."
    );
  }
  const model = req.model || DEFAULT_IMAGE_MODEL_ID;
  const n = Math.max(1, Math.min(4, req.n || 1));
  const { width, height } = parseSize(req.aspectRatio);

  try {
    const params: Record<string, unknown> = {
      model,
      prompt: req.prompt,
      n,
      size: aspectToSize(req.aspectRatio || "1:1"),
      response_format: "b64_json",
    };
    if (typeof req.seed === "number") params.seed = req.seed;
    if (req.negativePrompt) params.negative_prompt = req.negativePrompt;

    const client = getClient();
    const res = (await client.images.generate(
      params as Parameters<typeof client.images.generate>[0]
    )) as { data?: Array<{ b64_json?: string }> };

    const images: GeneratedImage[] = (res.data || [])
      .filter((d) => d.b64_json)
      .map((d) => {
        const b64 = d.b64_json as string;
        const mime = detectMime(b64);
        const bytes = Buffer.from(b64, "base64");
        const id = uuidv4();
        return {
          id,
          url: `/api/images/${id}`,
          downloadUrl: `/api/images/${id}?download=1`,
          dataUrl: `data:${mime};base64,${b64}`,
          backend: "nvidia",
          size: bytes.length,
          width,
          height,
          mimeType: mime,
          prompt: req.prompt,
          model,
          createdAt: new Date().toISOString(),
        };
      });

    return {
      success: true,
      images,
      model,
      usage: { creditsConsumed: 0 },
    };
  } catch (err) {
    throw wrapError(err);
  }
}
