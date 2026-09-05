import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchTimelineBlob, latestTimelineSnapshot, versionedBlobUrl } from "@/lib/timeline-storage-cache";
import type { TimelineData } from "@/lib/timeline-types";

const data: TimelineData = {
  version: 8,
  updatedAt: "2026-09-05T17:00:00.000Z",
  meta: {
    title: "Magpie Dashboards",
    subtitle: "Product leadership through rebuild, recovery, and scale",
    owner: "Rico Garcia",
    period: "January–September 2026",
  },
  lanes: [
    { id: "eng-build", name: "Eng Build", displayName: "Eng Build", index: 1 },
    { id: "product-build", name: "Product Build", displayName: "Product Build", index: 2 },
  ],
  items: [
    {
      id: "source",
      name: "Source",
      lane: "Eng Build",
      description: "Source context",
      placement: "Jan - Feb",
      value: "Source value",
      relations: [{
        targetId: "target",
        targetName: "Target",
        description: "Existing connection",
        connector: {
          source: { side: "bottom", offset: 0.8458646616541353 },
          target: { side: "top", offset: 0.1541353383458646 },
          points: [
            { x: 0.5, y: 0.234 },
            { x: 0.5, y: 0.766 },
          ],
        },
      }],
      guidingLights: ["Learn"],
      start: 0,
      end: 1,
      planned: false,
      ongoing: false,
      colorToken: "graphite",
      media: null,
    },
    {
      id: "target",
      name: "Target",
      lane: "Product Build",
      description: "Target context",
      placement: "Mar - Apr",
      value: "Target value",
      relations: [],
      guidingLights: ["Grow"],
      start: 2,
      end: 3,
      planned: false,
      ongoing: false,
      colorToken: "forest",
      media: null,
    },
  ],
};

function timelineResponse(value: TimelineData) {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("timeline Blob cache safety", () => {
  it("uses the listed upload timestamp to produce a unique canonical read URL", () => {
    const uploadedAt = new Date("2026-09-05T17:00:00.000Z");
    expect(versionedBlobUrl(
      "https://store.public.blob.vercel-storage.com/magpie/timeline.json",
      uploadedAt,
    )).toBe(`https://store.public.blob.vercel-storage.com/magpie/timeline.json?v=${uploadedAt.getTime()}`);
  });

  it("selects the highest immutable snapshot version regardless of listing order", () => {
    const snapshots = [
      { pathname: "magpie/history/timeline-v8-old.json", url: "https://store/v8", uploadedAt: new Date("2026-09-05T17:00:00.000Z") },
      { pathname: "magpie/history/timeline-v10-new.json", url: "https://store/v10", uploadedAt: new Date("2026-09-05T17:02:00.000Z") },
      { pathname: "magpie/history/timeline-v9-middle.json", url: "https://store/v9", uploadedAt: new Date("2026-09-05T17:01:00.000Z") },
    ];

    expect(latestTimelineSnapshot(snapshots)).toMatchObject({
      pathname: "magpie/history/timeline-v10-new.json",
      version: 10,
    });
  });

  it("returns the exact newly written connector version from its immutable snapshot URL", async () => {
    const fetchMock = vi.fn(async () => timelineResponse(data));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchTimelineBlob(
      "https://store.public.blob.vercel-storage.com/magpie/timeline.json",
      undefined,
      data.version,
    )).resolves.toEqual(data);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://store.public.blob.vercel-storage.com/magpie/timeline.json",
      { cache: "no-store" },
    );
  });

  it("rejects an older cached canonical version instead of reporting a false successful save", async () => {
    const stale = { ...data, version: data.version - 1 };
    vi.stubGlobal("fetch", vi.fn(async () => timelineResponse(stale)));

    await expect(fetchTimelineBlob(
      "https://store.public.blob.vercel-storage.com/magpie/timeline.json",
      undefined,
      data.version,
    )).rejects.toThrow("older timeline version");
  });
});
