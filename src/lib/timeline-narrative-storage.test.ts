/** @vitest-environment node */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import seed from "@/data/timeline.seed.json";
import type { TimelineData } from "@/lib/timeline-types";
import { resolveGuidingLightNarratives } from "@/lib/guiding-light-narratives";

const mocks = vi.hoisted(() => ({ list: vi.fn(), put: vi.fn(), fetchTimelineBlob: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@vercel/blob", () => ({ list: mocks.list, put: mocks.put }));
vi.mock("@/lib/timeline-storage-cache", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/timeline-storage-cache")>(),
  fetchTimelineBlob: mocks.fetchTimelineBlob,
}));

import { saveGuidingLightNarratives, saveTimelineData, TimelineVersionConflictError } from "@/lib/timeline-storage";

let current: TimelineData;
let written: TimelineData | null;
beforeEach(() => {
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-token");
  vi.clearAllMocks();
  current = structuredClone(seed) as TimelineData;
  written = null;
  mocks.list.mockResolvedValue({ blobs: [{ pathname: `magpie/history/timeline-v${current.version}-existing.json`, url: "https://store/current", uploadedAt: new Date() }] });
  mocks.fetchTimelineBlob.mockImplementation(async (url: string) => url === "https://store/saved" ? written : current);
  mocks.put.mockImplementation(async (_path: string, serialized: string) => {
    written = JSON.parse(serialized) as TimelineData;
    return { url: "https://store/saved" };
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("narrative storage preservation", () => {
  it("saves narrative text without changing item colors, missing routes, or any Gantt record", async () => {
    current.items[0].colorToken = "signal";
    current.items[0].relations[0] = { targetId: current.items[1].id, targetName: current.items[1].name, description: "Keep this relation without a route." };
    const original = structuredClone(current);
    const narratives = resolveGuidingLightNarratives();
    narratives.Learn.heading = "Edited introduction";

    const saved = await saveGuidingLightNarratives(current.version, narratives);
    expect(current).toEqual(original);
    expect(saved.items).toEqual(original.items);
    expect(saved.lanes).toEqual(original.lanes);
    expect(saved.meta).toEqual(original.meta);
    expect(saved.guidingLightNarratives?.Learn?.heading).toBe("Edited introduction");
    expect(saved.version).toBe(original.version + 1);
    expect(mocks.put).toHaveBeenCalledWith(`magpie/history/timeline-v${saved.version}.json`, expect.any(String), expect.objectContaining({ addRandomSuffix: false, allowOverwrite: false }));
  });

  it("rejects a stale version before writing", async () => {
    await expect(saveGuidingLightNarratives(current.version - 1, resolveGuidingLightNarratives())).rejects.toBeInstanceOf(TimelineVersionConflictError);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("checks later history pages before accepting an expected version", async () => {
    const oldVersion = current.version;
    current.version += 1;
    mocks.list
      .mockResolvedValueOnce({ blobs: [{ pathname: `magpie/history/timeline-v${oldVersion}-old.json`, url: "https://store/old", uploadedAt: new Date() }], hasMore: true, cursor: "next-page" })
      .mockResolvedValueOnce({ blobs: [{ pathname: `magpie/history/timeline-v${current.version}-current.json`, url: "https://store/current", uploadedAt: new Date() }], hasMore: false });
    await expect(saveGuidingLightNarratives(oldVersion, resolveGuidingLightNarratives())).rejects.toBeInstanceOf(TimelineVersionConflictError);
    expect(mocks.list).toHaveBeenCalledWith(expect.objectContaining({ cursor: "next-page" }));
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("never substitutes seed data when the authoritative read fails or is missing", async () => {
    mocks.list.mockRejectedValueOnce(new Error("Storage unavailable"));
    await expect(saveGuidingLightNarratives(current.version, resolveGuidingLightNarratives())).rejects.toThrow("Storage unavailable");
    mocks.list.mockResolvedValue({ blobs: [] });
    await expect(saveGuidingLightNarratives(current.version, resolveGuidingLightNarratives())).rejects.toThrow("No stored timeline");
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("preserves existing owner narratives through a legacy item save", async () => {
    current.guidingLightNarratives = resolveGuidingLightNarratives();
    current.guidingLightNarratives.Grow!.heading = "Owner-authored conclusion";
    const legacy = structuredClone(current);
    delete legacy.guidingLightNarratives;
    legacy.items[0].description = "An intentional item edit";
    const saved = await saveTimelineData(legacy);
    expect(saved.guidingLightNarratives?.Grow?.heading).toBe("Owner-authored conclusion");
    expect(saved.items[0].description).toBe("An intentional item edit");
  });
});
