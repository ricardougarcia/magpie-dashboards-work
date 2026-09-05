/** @vitest-environment node */

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  handleUpload: vi.fn(),
  hasBlobStorage: vi.fn(),
  isEditorAuthenticated: vi.fn(),
}));

vi.mock("@vercel/blob/client", () => ({ handleUpload: mocks.handleUpload }));
vi.mock("@/lib/auth", () => ({ isEditorAuthenticated: mocks.isEditorAuthenticated }));
vi.mock("@/lib/timeline-storage", () => ({ hasBlobStorage: mocks.hasBlobStorage }));

import { POST } from "@/app/api/media/route";
import { MEDIA_ALLOWED_CONTENT_TYPES, MEDIA_MAX_SIZE_BYTES } from "@/lib/media-upload";

function tokenRequest() {
  return new Request("https://example.com/api/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "blob.generate-client-token", payload: {} }),
  });
}

beforeEach(() => {
  mocks.handleUpload.mockReset();
  mocks.hasBlobStorage.mockReset();
  mocks.hasBlobStorage.mockReturnValue(true);
  mocks.isEditorAuthenticated.mockReset();
});

describe("media client-upload token route", () => {
  it("fails clearly when Vercel Blob is not connected", async () => {
    mocks.hasBlobStorage.mockReturnValue(false);

    const response = await POST(tokenRequest());
    expect(response.status).toBe(503);
    expect((await response.json()).error).toMatch(/BLOB_READ_WRITE_TOKEN/);
    expect(mocks.handleUpload).not.toHaveBeenCalled();
  });

  it("rejects token generation when the editor session is not authenticated", async () => {
    mocks.isEditorAuthenticated.mockResolvedValue(false);
    mocks.handleUpload.mockImplementation(async (options) => {
      await options.onBeforeGenerateToken(
        "magpie/media/source-item/demo.mp4",
        JSON.stringify({ itemId: "source-item", filename: "demo.mp4" }),
        false,
      );
    });

    const response = await POST(tokenRequest());
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Not authenticated." });
  });

  it("issues an item-scoped token with the approved formats and 25 MB limit", async () => {
    mocks.isEditorAuthenticated.mockResolvedValue(true);
    mocks.handleUpload.mockImplementation(async (options) => {
      const policy = await options.onBeforeGenerateToken(
        "magpie/media/source-item/demo.mp4",
        JSON.stringify({ itemId: "source-item", filename: "demo.mp4" }),
        false,
      );
      expect(policy.allowedContentTypes).toEqual([...MEDIA_ALLOWED_CONTENT_TYPES]);
      expect(policy.maximumSizeInBytes).toBe(MEDIA_MAX_SIZE_BYTES);
      expect(policy.addRandomSuffix).toBe(true);
      expect(policy.tokenPayload).toBe(JSON.stringify({ itemId: "source-item" }));
      return { type: "blob.generate-client-token", clientToken: "short-lived-token" };
    });

    const response = await POST(tokenRequest());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ type: "blob.generate-client-token", clientToken: "short-lived-token" });
  });

  it("rejects a token request whose Blob pathname does not match its selected-item context", async () => {
    mocks.isEditorAuthenticated.mockResolvedValue(true);
    mocks.handleUpload.mockImplementation(async (options) => {
      await options.onBeforeGenerateToken(
        "magpie/media/other-item/demo.mp4",
        JSON.stringify({ itemId: "source-item", filename: "demo.mp4" }),
        false,
      );
    });

    const response = await POST(tokenRequest());
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/does not match/);
  });
});
