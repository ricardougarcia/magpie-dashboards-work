import "server-only";

import { list, put } from "@vercel/blob";
import seedData from "@/data/timeline.seed.json";
import { prepareTimelineSave } from "@/lib/timeline-persistence";
import { timelineDataSchema } from "@/lib/timeline-schema";
import type { TimelineData } from "@/lib/timeline-types";

const DATA_PATH = "magpie/timeline.json";

export function hasBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function getTimelineData(): Promise<TimelineData> {
  if (!hasBlobStorage()) {
    return timelineDataSchema.parse(seedData) as TimelineData;
  }

  try {
    const result = await list({ prefix: DATA_PATH, limit: 1 });
    const stored = result.blobs.find((blob) => blob.pathname === DATA_PATH);
    if (!stored) return timelineDataSchema.parse(seedData) as TimelineData;

    const response = await fetch(stored.url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Blob read failed with ${response.status}`);
    return timelineDataSchema.parse(await response.json()) as TimelineData;
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

  await put(`magpie/history/timeline-v${next.version}.json`, serialized, {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });

  await put(DATA_PATH, serialized, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 0,
  });

  return next;
}
