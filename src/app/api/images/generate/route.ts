import { NextResponse } from "next/server";
import { generateImages } from "@/lib/ai/image/router";
import { createServerSupabase } from "@/lib/supabase/server";
import { putImage } from "@/lib/storage/memory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as {
    prompt?: string;
    model?: string;
    aspectRatio?: string;
    n?: number;
    negativePrompt?: string;
    seed?: number;
  } | null;
  if (!body || !body.prompt || typeof body.prompt !== "string") {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 }
    );
  }

  try {
    const res = await generateImages({
      prompt: body.prompt,
      model: body.model,
      aspectRatio: body.aspectRatio,
      n: body.n,
      negativePrompt: body.negativePrompt,
      seed: body.seed,
    });
    // Stash in memory so /api/images/[id] can serve them
    for (const img of res.images) {
      const b64 = img.dataUrl.split(",")[1] || "";
      const bytes = Buffer.from(b64, "base64");
      putImage(img.id, bytes, img.mimeType, {
        prompt: img.prompt,
        model: img.model,
        createdAt: img.createdAt,
      });
    }
    return NextResponse.json(res);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
