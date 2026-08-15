// NIGHTMARE AI — image generation types
export interface ImageRequest {
  prompt: string;
  model?: string;
  aspectRatio?: string;
  n?: number;
  negativePrompt?: string;
  seed?: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  downloadUrl: string;
  dataUrl: string;
  backend: string;
  size: number;
  width: number;
  height: number;
  mimeType: string;
  prompt: string;
  model: string;
  createdAt: string;
}

export interface ImageResponse {
  success: boolean;
  images: GeneratedImage[];
  model: string;
  usage: { creditsConsumed: number };
}

export class ImageError extends Error {
  kind: string;
  status?: number;
  constructor(kind: string, message: string, status?: number) {
    super(message);
    this.name = "ImageError";
    this.kind = kind;
    this.status = status;
  }
}
