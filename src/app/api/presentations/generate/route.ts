import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  generatePresentationAsync,
  isConfigured as presentonConfigured,
} from "@/lib/presenton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface GenerateBody {
  content?: string;
  instructions?: string;
  n_slides?: number;
  language?: string;
  template?: string;
  tone?: string;
  verbosity?: string;
  mode?: string;
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!presentonConfigured()) {
    return NextResponse.json(
      {
        error:
          "Presentations are unavailable — set PRESENTON_API_KEY in your environment to enable this feature.",
        mode: "unavailable",
      },
      { status: 503 }
    );
  }

  const body = (await req.json().catch(() => null)) as GenerateBody | null;
  if (!body || !body.content) {
    return NextResponse.json(
      { error: "content (topic) is required" },
      { status: 400 }
    );
  }

  try {
    const result = await generatePresentationAsync({
      content: body.content,
      instructions: body.instructions,
      n_slides: body.n_slides,
      language: body.language,
      template: body.template,
      tone: body.tone,
      verbosity: body.verbosity,
      mode: body.mode,
    });
    return NextResponse.json({
      mode: "async",
      task_id: result.task_id,
      status: result.status,
      stage: result.stage || "queued",
      percent: result.percent ?? 5,
      provider: "presenton",
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Presentation generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
