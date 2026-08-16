// NIGHTMARE AI — NVIDIA NIM image provider (raw fetch, no SDK)
// Removed the OpenAI SDK to reduce Worker bundle size.
import { v4 as uuidv4 } from "uuid";
import { aspectToSize, DEFAULT_IMAGE_MODEL_ID } from "@/lib/constants";
import type {
  GeneratedImage,
  ImageRequest,
  ImageResponse,
} from "@/lib/ai/image/types";
import { ImageError } from "@/lib/ai/image/types";
import { classifyHttpError } from "@/lib/ai/errors";

function getBaseUrl(): string {
  return (
    process.env.NVIDIA_IMAGE_BASE_URL ||
    "https://integrate.api.nvidia.com/v1"
  );
}

function getApiKey(): string {
  return process.env.NVIDIA_API_KEY || "";
}

export function isConfigured(): boolean {
  return !!getApiKey();
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

  const body: Record<string, unknown> = {
    model,
    prompt: req.prompt,
    n,
    size: aspectToSize(req.aspectRatio || "1:1"),
    response_format: "b64_json",
  };
  if (typeof req.seed === "number") body.seed = req.seed;
  if (req.negativePrompt) body.negative_prompt = req.negativePrompt;

  try {
    const res = await fetch(`${getBaseUrl()}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ImageError(
        classifyHttpError(res.status),
        `NVIDIA image request failed (${res.status}): ${text.slice(0, 300)}`,
        res.status
      );
    }

    const json = (await res.json()) as {
      data?: Array<{ b64_json?: string }>;
    };

    const images: GeneratedImage[] = (json.data || [])
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
    if (err instanceof ImageError) throw err;
    throw new ImageError(
      "network",
      (err instanceof Error ? err.message : "Network error") ||
        "Unknown network error"
    );
  }
}
