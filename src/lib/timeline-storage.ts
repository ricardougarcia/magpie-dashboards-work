import "server-only";

import { list, put } from "@vercel/blob";
import candidateData from "@/data/timeline.candidate.json";
import seedData from "@/data/timeline.seed.json";
import { assertContentWritable, isSnapshotContentMode } from "@/lib/content-mode";
import { prepareTimelineSave } from "@/lib/timeline-persistence";
import { fetchTimelineBlob, latestTimelineSnapshot } from "@/lib/timeline-storage-cache";
import { timelineDataSchema } from "@/lib/timeline-schema";
import { resolveGuidingLightNarratives } from "@/lib/guiding-light-narratives";
import type { GuidingLightNarratives, TimelineData } from "@/lib/timeline-types";

const DATA_PATH = "magpie/timeline.json";
const HISTORY_PREFIX = "magpie/history/timeline-v";

export function hasBlobStorage() {
  return !isSnapshotContentMode() && Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export class TimelineVersionConflictError extends Error {
  constructor() {
    super("This timeline changed in another session. Your draft is still here; reload the latest timeline before saving again.");
    this.name = "TimelineVersionConflictError";
  }
}

async function getStoredTimelineData(): Promise<TimelineData | null> {
  assertContentWritable();
  let cursor: string | undefined;
  let latest: ReturnType<typeof latestTimelineSnapshot> | null = null;
  do {
    const history = await list({ prefix: HISTORY_PREFIX, limit: 1000, ...(cursor ? { cursor } : {}) });
    const candidate = latestTimelineSnapshot(history.blobs);
    if (candidate && (!latest || candidate.version > latest.version ||
      (candidate.version === latest.version && candidate.uploadedAt > latest.uploadedAt))) latest = candidate;
    cursor = history.hasMore ? history.cursor : undefined;
  } while (cursor);
  if (latest) return fetchTimelineBlob(latest.url, undefined, latest.version);

  const legacy = await list({ prefix: DATA_PATH, limit: 1 });
  const stored = legacy.blobs.find((blob) => blob.pathname === DATA_PATH);
  return stored ? fetchTimelineBlob(stored.url, stored.uploadedAt) : null;
}

async function readCurrentForSave(expectedVersion: number): Promise<TimelineData> {
  assertContentWritable();
  if (!hasBlobStorage()) {
    throw new Error("Vercel Blob is not connected. Set BLOB_READ_WRITE_TOKEN before saving edits.");
  }
  const current = await getStoredTimelineData();
  if (!current) throw new Error("No stored timeline was found. No changes were saved.");
  if (current.version !== expectedVersion) throw new TimelineVersionConflictError();
  return current;
}

export async function getTimelineData(): Promise<TimelineData> {
  // A missing export fails the build; an invalid export fails this read. Never
  // replace the reviewed content with seed data or an environment's live store.
  if (isSnapshotContentMode()) {
    return timelineDataSchema.parse(candidateData) as TimelineData;
  }

  if (!hasBlobStorage()) {
    return timelineDataSchema.parse(seedData) as TimelineData;
  }

  try {
    return await getStoredTimelineData() ?? timelineDataSchema.parse(seedData) as TimelineData;
  } catch (error) {
    console.error("Falling back to timeline seed data", error);
    return timelineDataSchema.parse(seedData) as TimelineData;
  }
}

export async function saveTimelineData(input: TimelineData): Promise<TimelineData> {
  const current = await readCurrentForSave(input.version);
  const narratives = { ...current.guidingLightNarratives, ...input.guidingLightNarratives };
  const next = prepareTimelineSave({ ...input, guidingLightNarratives: resolveGuidingLightNarratives(narratives) });
  return writeTimelineSnapshot(next);
}

export async function saveGuidingLightNarratives(
  expectedVersion: number,
  guidingLightNarratives: GuidingLightNarratives,
): Promise<TimelineData> {
  const current = await readCurrentForSave(expectedVersion);
  // Narrative edits must not materialize, normalize, or synchronize Gantt data.
  const next: TimelineData = {
    ...current,
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
    guidingLightNarratives,
  };
  return writeTimelineSnapshot(next);
}

async function writeTimelineSnapshot(next: TimelineData): Promise<TimelineData> {
  assertContentWritable();
  const serialized = JSON.stringify(next);

  const snapshot = await put(`${HISTORY_PREFIX}${next.version}.json`, serialized, {
    access: "public",
    // A version may only be written once, including simultaneous owner saves.
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });

  return await fetchTimelineBlob(snapshot.url, undefined, next.version);
}
