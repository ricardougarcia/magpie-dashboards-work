/** @vitest-environment node */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import seed from "@/data/timeline.seed.json";
import { resolveGuidingLightNarratives } from "@/lib/guiding-light-narratives";
import { timelineDataSchema } from "@/lib/timeline-schema";
import type { TimelineData } from "@/lib/timeline-types";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  put: vi.fn(),
  fetchTimelineBlob: vi.fn(),
  handleUpload: vi.fn(),
  cookies: vi.fn(),
  snapshot: null as unknown,
}));
vi.mock("server-only", () => ({}));
vi.mock("@vercel/blob", () => ({ list: mocks.list, put: mocks.put }));
vi.mock("@vercel/blob/client", () => ({ handleUpload: mocks.handleUpload }));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));
vi.mock("@/data/timeline.candidate.json", () => ({ get default() { return mocks.snapshot; } }));
vi.mock("@/lib/timeline-storage-cache", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/timeline-storage-cache")>(),
  fetchTimelineBlob: mocks.fetchTimelineBlob,
}));

import { createSessionToken, isEditorAuthenticated, isValidPassword } from "@/lib/auth";
import { isSnapshotContentMode } from "@/lib/content-mode";
import { getTimelineData, hasBlobStorage, saveGuidingLightNarratives, saveTimelineData } from "@/lib/timeline-storage";
import { GET, PATCH, PUT } from "@/app/api/timeline/route";
import { POST as upload } from "@/app/api/media/route";
import { POST as login } from "@/app/api/auth/login/route";

let exportedSnapshot: unknown;
beforeAll(async () => {
  exportedSnapshot = (await vi.importActual<{ default: unknown }>("@/data/timeline.candidate.json")).default;
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("PORTFOLIO_CONTENT_MODE", "snapshot");
  // Inherited credentials must not give a review candidate access to a live store.
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "inherited-store-token");
  vi.stubEnv("EDIT_PASSWORD", "inherited-editor-password");
  vi.stubEnv("SESSION_SECRET", "inherited-session-secret");
  mocks.snapshot = structuredClone(exportedSnapshot);
});
afterEach(() => vi.unstubAllEnvs());

function request(path: string, method: string, body: unknown): Request {
  return new Request(`https://candidate.example${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function expectNoStorageAccess() {
  expect(mocks.list).not.toHaveBeenCalled();
  expect(mocks.put).not.toHaveBeenCalled();
  expect(mocks.fetchTimelineBlob).not.toHaveBeenCalled();
  expect(mocks.handleUpload).not.toHaveBeenCalled();
}

describe("read-only launch candidate", () => {
  it("loads the validated bundled export despite inherited Blob credentials", async () => {
    expect(await getTimelineData()).toEqual(timelineDataSchema.parse(mocks.snapshot));
    expect(hasBlobStorage()).toBe(false);
    expectNoStorageAccess();
  });

  it("fails on a missing or invalid export without falling back to seed or live content", async () => {
    for (const invalid of [null, undefined, {}, { ...seed, items: [] }]) {
      mocks.snapshot = invalid;
      await expect(getTimelineData()).rejects.toThrow();
    }
    expectNoStorageAccess();
  });

  it("rejects direct timeline and narrative saves before any live-store read or write", async () => {
    await expect(saveTimelineData(seed as TimelineData)).rejects.toThrow("read-only content snapshot");
    await expect(saveGuidingLightNarratives(seed.version, resolveGuidingLightNarratives())).rejects.toThrow("read-only content snapshot");
    expectNoStorageAccess();
  });

  it("disables password validation, token creation, and existing session cookies", async () => {
    expect(isValidPassword("inherited-editor-password")).toBe(false);
    expect(createSessionToken()).toBe("");
    expect(await isEditorAuthenticated()).toBe(false);
    expect(mocks.cookies).not.toHaveBeenCalled();
    expectNoStorageAccess();
  });

  it("blocks editor API reads, timeline saves, narratives, login, and upload tokens", async () => {
    expect((await GET()).status).toBe(401);
    expect((await PUT(request("/api/timeline", "PUT", seed))).status).toBe(403);
    expect((await PATCH(request("/api/timeline", "PATCH", {
      expectedVersion: seed.version,
      guidingLightNarratives: resolveGuidingLightNarratives(),
    }))).status).toBe(403);
    const loginResponse = await login(request("/api/auth/login", "POST", { password: "inherited-editor-password" }));
    expect(loginResponse.status).toBe(403);
    expect(loginResponse.headers.get("set-cookie")).toBeNull();
    expect((await upload(request("/api/media", "POST", { type: "blob.generate-client-token", payload: {} }))).status).toBe(403);
    expectNoStorageAccess();
  });

  it("fails closed for a misspelled content-mode configuration", async () => {
    vi.stubEnv("PORTFOLIO_CONTENT_MODE", "snaphot");
    await expect(getTimelineData()).rejects.toThrow("Unsupported PORTFOLIO_CONTENT_MODE");
    await expect(saveTimelineData(seed as TimelineData)).rejects.toThrow("Unsupported PORTFOLIO_CONTENT_MODE");
    expect(() => isValidPassword("inherited-editor-password")).toThrow("Unsupported PORTFOLIO_CONTENT_MODE");
    expectNoStorageAccess();
  });

  it("preserves normal live-mode storage and password behavior", async () => {
    vi.stubEnv("PORTFOLIO_CONTENT_MODE", "live");
    expect(isSnapshotContentMode()).toBe(false);
    expect(hasBlobStorage()).toBe(true);
    expect(isValidPassword("inherited-editor-password")).toBe(true);
    expect(createSessionToken()).not.toBe("");
    mocks.list.mockResolvedValue({ blobs: [{ pathname: "magpie/timeline.json", url: "https://store/live.json", uploadedAt: new Date() }], hasMore: false });
    mocks.fetchTimelineBlob.mockResolvedValue(seed);
    expect(await getTimelineData()).toEqual(seed);
    expect(mocks.list).toHaveBeenCalled();
    expect(mocks.fetchTimelineBlob).toHaveBeenCalled();
  });
});
