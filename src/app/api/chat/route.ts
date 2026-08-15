import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { stream as routerStream, complete as routerComplete } from "@/lib/ai/router";
import { AIError } from "@/lib/ai/errors";
import { NIGHTMARE_SYSTEM_PROMPT } from "@/lib/constants";
import type { ChatMessage } from "@/lib/ai/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

function sseEncode(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    messages?: ChatMessage[];
    stream?: boolean;
    creativity?: number;
    model?: string;
    maxTokens?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json(
      { error: "messages must be a non-empty array" },
      { status: 400 }
    );
  }

  // Inject system prompt if not present
  const messages: ChatMessage[] = [
    ...(body.messages[0]?.role === "system"
      ? []
      : [{ role: "system" as const, content: NIGHTMARE_SYSTEM_PROMPT }]),
    ...body.messages,
  ];

  const wantStream = body.stream !== false;

  if (!wantStream) {
    try {
      const res = await routerComplete({
        messages,
        model: body.model,
        creativity: body.creativity,
        maxTokens: body.maxTokens,
      });
      return NextResponse.json(res);
    } catch (err) {
      const status =
        err instanceof AIError ? err.status || 500 : 500;
      const message =
        err instanceof Error ? err.message : "Chat completion failed";
      return NextResponse.json({ error: message }, { status });
    }
  }

  // SSE streaming
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  req.signal.addEventListener("abort", () => abortController.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of routerStream({
          messages,
          model: body.model,
          creativity: body.creativity,
          maxTokens: body.maxTokens,
          signal: abortController.signal,
        })) {
          if (chunk.type === "delta" && chunk.content) {
            controller.enqueue(encoder.encode(sseEncode({ delta: chunk.content })));
          } else if (chunk.type === "usage" && chunk.usage) {
            controller.enqueue(encoder.encode(sseEncode({ usage: chunk.usage })));
          } else if (chunk.type === "done") {
            controller.enqueue(encoder.encode("[DONE]\n\n"));
          }
        }
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Streaming failed";
        const kind =
          err instanceof AIError ? err.kind : "unknown";
        try {
          controller.enqueue(
            encoder.encode(sseEncode({ error: message, kind }))
          );
          controller.enqueue(encoder.encode("[DONE]\n\n"));
          controller.close();
        } catch {
          // controller may be closed already
        }
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
