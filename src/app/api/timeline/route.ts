import { NextResponse } from "next/server";
import { isEditorAuthenticated } from "@/lib/auth";
import { isSnapshotContentMode, SNAPSHOT_READ_ONLY_MESSAGE } from "@/lib/content-mode";
import { guidingLightNarrativesPatchSchema, timelineDataSchema } from "@/lib/timeline-schema";
import { getTimelineData, saveGuidingLightNarratives, saveTimelineData, TimelineVersionConflictError } from "@/lib/timeline-storage";

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
  if (isSnapshotContentMode()) {
    return NextResponse.json({ error: SNAPSHOT_READ_ONLY_MESSAGE }, { status: 403 });
  }
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
    return NextResponse.json({ error: message }, { status: error instanceof TimelineVersionConflictError ? 409 : 503 });
  }
}

export async function PATCH(request: Request) {
  if (isSnapshotContentMode()) {
    return NextResponse.json({ error: SNAPSHOT_READ_ONLY_MESSAGE }, { status: 403 });
  }
  if (!(await isEditorAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = guidingLightNarrativesPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "The Guiding Light narratives are invalid.", issues: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const saved = await saveGuidingLightNarratives(parsed.data.expectedVersion, parsed.data.guidingLightNarratives);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save the narratives.";
    return NextResponse.json({ error: message }, { status: error instanceof TimelineVersionConflictError ? 409 : 503 });
  }
}
