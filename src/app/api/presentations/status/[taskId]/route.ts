import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getTaskStatus, isConfigured } from "@/lib/presenton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isConfigured()) {
    return NextResponse.json(
      { error: "Presenton not configured" },
      { status: 503 }
    );
  }
  const { taskId } = await params;
  try {
    const status = await getTaskStatus(taskId);
    return NextResponse.json({
      task_id: taskId,
      status: status.status,
      message: status.message,
      stage: status.stage,
      percent: status.percent,
      data: status.data,
      error: status.error,
      updated_at: status.updated_at || new Date().toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json(
      { task_id: taskId, status: "error", error: message },
      { status: 502 }
    );
  }
}
