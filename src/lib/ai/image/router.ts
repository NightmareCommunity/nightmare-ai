// NIGHTMARE AI — image generation router (nvidia primary, pollinations fallback)
import type { ImageRequest, ImageResponse } from "@/lib/ai/image/types";
import { ImageError } from "@/lib/ai/image/types";
import * as nvidiaImage from "@/lib/ai/image/nvidia-image";
import * as pollinations from "@/lib/ai/image/pollinations";

export async function generateImages(
  req: ImageRequest
): Promise<ImageResponse> {
  // Try NVIDIA first — if it's not configured OR returns ANY error (entitlement,
  // rate-limit, network, empty response, etc.), fall back to Pollinations.
  // Pollinations is free + no-auth and always works, so users get images either way.
  try {
    if (nvidiaImage.isConfigured()) {
      return await nvidiaImage.generate(req);
    }
  } catch (err) {
    // Log but don't throw — fall through to Pollinations
    console.warn(
      "[image-router] NVIDIA image gen failed, falling back to Pollinations:",
      err instanceof Error ? err.message : String(err)
    );
  }
  return await pollinations.generate(req);
}

export { nvidiaImage, pollinations };
