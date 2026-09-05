import "server-only";

import { list, put } from "@vercel/blob";
import seedData from "@/data/timeline.seed.json";
import { prepareTimelineSave } from "@/lib/timeline-persistence";
import { fetchTimelineBlob, latestTimelineSnapshot } from "@/lib/timeline-storage-cache";
import { timelineDataSchema } from "@/lib/timeline-schema";
import type { TimelineData } from "@/lib/timeline-types";

const DATA_PATH = "magpie/timeline.json";
const HISTORY_PREFIX = "magpie/history/timeline-v";

export function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getTimelineData(): Promise<TimelineData> {
  if (!hasBlobStorage()) {
    return timelineDataSchema.parse(seedData) as TimelineData;
  }

  try {
    const history = await list({ prefix: HISTORY_PREFIX, limit: 1000 });
    const latest = latestTimelineSnapshot(history.blobs);
    if (latest) return await fetchTimelineBlob(latest.url, undefined, latest.version);

    const legacy = await list({ prefix: DATA_PATH, limit: 1 });
    const stored = legacy.blobs.find((blob) => blob.pathname === DATA_PATH);
    if (!stored) return timelineDataSchema.parse(seedData) as TimelineData;

    return await fetchTimelineBlob(stored.url, stored.uploadedAt);
  } catch (error) {
    console.error("Falling back to timeline seed data", error);
    return timelineDataSchema.parse(seedData) as TimelineData;
  }
}

export async function saveTimelineData(input: TimelineData): Promise<TimelineData> {
  if (!hasBlobStorage()) {
    throw new Error("Vercel Blob is not connected. Set BLOB_READ_WRITE_TOKEN before saving edits.");
  }

  const next = prepareTimelineSave(input);
  const serialized = JSON.stringify(next);

  const snapshot = await put(`${HISTORY_PREFIX}${next.version}.json`, serialized, {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });

  return await fetchTimelineBlob(snapshot.url, undefined, next.version);
}
