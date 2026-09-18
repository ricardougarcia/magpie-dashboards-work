/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveGuidingLightNarratives } from "@/lib/guiding-light-narratives";
const mocks = vi.hoisted(() => ({ isEditorAuthenticated: vi.fn(), saveGuidingLightNarratives: vi.fn(), saveTimelineData: vi.fn() }));
vi.mock("@/lib/auth", () => ({ isEditorAuthenticated: mocks.isEditorAuthenticated }));
vi.mock("@/lib/timeline-storage", () => ({
  getTimelineData: vi.fn(),
  saveGuidingLightNarratives: mocks.saveGuidingLightNarratives,
  saveTimelineData: mocks.saveTimelineData,
  TimelineVersionConflictError: class extends Error {},
}));
import { PATCH } from "@/app/api/timeline/route";
import { TimelineVersionConflictError } from "@/lib/timeline-storage";

function request(body: unknown) {
  return new Request("https://example.com/api/timeline", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.isEditorAuthenticated.mockResolvedValue(true);
});
describe("owner narrative PATCH", () => {
  it("requires the existing owner session before reading or writing data", async () => {
    mocks.isEditorAuthenticated.mockResolvedValue(false);
    expect((await PATCH(request({}))).status).toBe(401);
    expect(mocks.saveGuidingLightNarratives).not.toHaveBeenCalled();
  });
  it("rejects invalid narratives", async () => {
    expect((await PATCH(request({ expectedVersion: 1, guidingLightNarratives: { Learn: {} } }))).status).toBe(400);
    expect(mocks.saveGuidingLightNarratives).not.toHaveBeenCalled();
  });
  it("returns a conflict while preserving the visitor's draft when the version is stale", async () => {
    mocks.saveGuidingLightNarratives.mockRejectedValue(new TimelineVersionConflictError());
    expect((await PATCH(request({ expectedVersion: 2, guidingLightNarratives: resolveGuidingLightNarratives() }))).status).toBe(409);
  });
  it("passes only the version and validated narratives to the narrow save", async () => {
    const narratives = resolveGuidingLightNarratives();
    mocks.saveGuidingLightNarratives.mockResolvedValue({ version: 3, guidingLightNarratives: narratives });
    const response = await PATCH(request({ expectedVersion: 2, guidingLightNarratives: narratives }));
    expect(response.status).toBe(200);
    expect(mocks.saveGuidingLightNarratives).toHaveBeenCalledWith(2, narratives);
    expect(mocks.saveTimelineData).not.toHaveBeenCalled();
  });
});
