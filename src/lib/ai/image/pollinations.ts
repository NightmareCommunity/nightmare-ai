// NIGHTMARE AI — Pollinations free fallback image provider
import { v4 as uuidv4 } from "uuid";
import { aspectToSize } from "@/lib/constants";
import type {
  GeneratedImage,
  ImageRequest,
  ImageResponse,
} from "@/lib/ai/image/types";
import { ImageError } from "@/lib/ai/image/types";

function mapModelToPollinations(model: string): string {
  const lower = model.toLowerCase();
  if (lower.includes("schnell") || lower.includes("turbo")) return "flux";
  if (lower.includes("dev") || lower.includes("stable-diffusion"))
    return "flux-realism";
  return "flux";
}

function parseSize(ar: string | undefined): { width: number; height: number } {
  const size = aspectToSize(ar || "1:1");
  const [w, h] = size.split("x").map((n) => parseInt(n, 10));
  return { width: w || 1024, height: h || 1024 };
}

function detectMime(buf: Buffer): string {
  if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50)
    return "image/png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8)
    return "image/jpeg";
  if (buf.length >= 4 && buf[0] === 0x52 && buf[1] === 0x49)
    return "image/webp";
  return "image/png";
}

async function fetchWithRetry(
  url: string,
  retries = 3
): Promise<Response> {
  let lastErr: Error | null = null;
  const delays = [1000, 1500, 3000];
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "image/*" },
      });
      if (res.status === 429 || res.status === 502 || res.status === 503) {
        lastErr = new Error(
          `Pollinations transient error ${res.status}`
        );
        if (attempt < retries - 1) {
          await new Promise((r) => setTimeout(r, delays[attempt]));
          continue;
        }
      }
      if (!res.ok) {
        throw new ImageError(
          "server",
          `Pollinations error ${res.status}`,
          res.status
        );
      }
      return res;
    } catch (err) {
      if (err instanceof ImageError) throw err;
      lastErr = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delays[attempt]));
        continue;
      }
    }
  }
  throw new ImageError(
    "network",
    lastErr?.message || "Pollinations fetch failed after retries"
  );
}

export async function generate(req: ImageRequest): Promise<ImageResponse> {
  const model = req.model || "black-forest-labs/flux-1-schnell";
  const pollinationsModel = mapModelToPollinations(model);
  const { width, height } = parseSize(req.aspectRatio);
  const seed =
    typeof req.seed === "number"
      ? req.seed
      : Math.floor(Math.random() * 1_000_000);
  const n = Math.max(1, Math.min(4, req.n || 1));

  const promptParts: string[] = [req.prompt];
  if (req.negativePrompt) {
    promptParts.push(`(avoid: ${req.negativePrompt})`);
  }
  const encoded = encodeURIComponent(promptParts.join(" "));

  const images: GeneratedImage[] = [];
  for (let i = 0; i < n; i++) {
    const currentSeed = seed + i;
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${currentSeed}&model=${pollinationsModel}&nologo=true`;
    const res = await fetchWithRetry(url);
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = detectMime(buf);
    const b64 = buf.toString("base64");
    const id = uuidv4();
    images.push({
      id,
      url: `/api/images/${id}`,
      downloadUrl: `/api/images/${id}?download=1`,
      dataUrl: `data:${mime};base64,${b64}`,
      backend: "pollinations",
      size: buf.length,
      width,
      height,
      mimeType: mime,
      prompt: req.prompt,
      model: `${model} (pollinations:${pollinationsModel})`,
      createdAt: new Date().toISOString(),
    });
  }

  return {
    success: true,
    images,
    model,
    usage: { creditsConsumed: 0 },
  };
}
