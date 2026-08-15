import { NextResponse } from "next/server";
import { NVIDIA_IMAGE_MODELS, DEFAULT_IMAGE_MODEL_ID } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json({
    models: NVIDIA_IMAGE_MODELS,
    default: DEFAULT_IMAGE_MODEL_ID,
  });
}
