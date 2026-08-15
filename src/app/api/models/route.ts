import { NextResponse } from "next/server";
import { listAvailableModels } from "@/lib/ai/router";

export const runtime = "nodejs";
export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(listAvailableModels());
}
