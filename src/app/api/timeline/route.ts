import { NextResponse } from "next/server";
import { isEditorAuthenticated } from "@/lib/auth";
import { timelineDataSchema } from "@/lib/timeline-schema";
import { getTimelineData, saveTimelineData } from "@/lib/timeline-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isEditorAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = await getTimelineData();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(request: Request) {
  if (!(await isEditorAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = timelineDataSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "The timeline data is invalid.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const saved = await saveTimelineData(parsed.data);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the timeline.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
