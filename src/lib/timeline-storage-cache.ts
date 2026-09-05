import { timelineDataSchema } from "@/lib/timeline-schema";
import type { TimelineData } from "@/lib/timeline-types";

export async function fetchTimelineBlob(
  url: string,
  cacheVersion: Date | number,
  expectedVersion?: number,
): Promise<TimelineData> {
  const response = await fetch(versionedBlobUrl(url, cacheVersion), { cache: "no-store" });
  if (!response.ok) throw new Error(`Blob read failed with ${response.status}`);

  const data = timelineDataSchema.parse(await response.json()) as TimelineData;
  if (expectedVersion !== undefined && data.version !== expectedVersion) {
    throw new Error("Blob write verification returned an older timeline version.");
  }
  return data;
}

export function versionedBlobUrl(url: string, version: Date | number) {
  const next = new URL(url);
  next.searchParams.set("v", version instanceof Date ? String(version.getTime()) : String(version));
  return next.toString();
}
