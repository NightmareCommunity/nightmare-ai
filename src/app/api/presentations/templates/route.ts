import { NextResponse } from "next/server";
import { listTemplates, isConfigured } from "@/lib/presenton";
import { TEMPLATES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({
      templates: TEMPLATES,
      source: "fallback",
    });
  }
  try {
    const remote = await listTemplates(1, 50);
    if (remote.templates.length > 0) {
      return NextResponse.json({
        templates: remote.templates,
        source: "presenton",
      });
    }
    return NextResponse.json({
      templates: TEMPLATES,
      source: "fallback",
    });
  } catch {
    return NextResponse.json({
      templates: TEMPLATES,
      source: "fallback",
    });
  }
}
