// NIGHTMARE AI — image generation router (nvidia primary, pollinations fallback)
import type { ImageRequest, ImageResponse } from "@/lib/ai/image/types";
import { ImageError } from "@/lib/ai/image/types";
import * as nvidiaImage from "@/lib/ai/image/nvidia-image";
import * as pollinations from "@/lib/ai/image/pollinations";

export async function generateImages(
  req: ImageRequest
): Promise<ImageResponse> {
  try {
    return await nvidiaImage.generate(req);
  } catch (err) {
    if (err instanceof ImageError) {
      if (err.kind === "model_unavailable" || err.kind === "auth") {
        return await pollinations.generate(req);
      }
      throw err;
    }
    throw err;
  }
}

export { nvidiaImage, pollinations };
