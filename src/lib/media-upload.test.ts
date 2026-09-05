import { describe, expect, it } from "vitest";

import {
  MEDIA_MAX_SIZE_BYTES,
  isLowResolutionGif,
  lowResolutionGifMessage,
  mediaTypeFromContentType,
  mediaValidationError,
  safeMediaPath,
} from "@/lib/media-upload";
import { timelineItemSchema } from "@/lib/timeline-schema";

function fileLike(type: string, size: number): Pick<File, "type" | "size"> {
  return { type, size };
}

const baseItem = {
  id: "media-item",
  name: "Media item",
  lane: "Eng Build",
  description: "Context.",
  placement: "Jan - Feb",
  value: "Value.",
  relations: [],
  guidingLights: ["Learn"],
  start: 0,
  end: 1,
  planned: false,
  ongoing: false,
  colorToken: "steel",
};

describe("media upload policy", () => {
  it("accepts every approved media type at exactly 25 MB and maps it to the correct record type", () => {
    const cases = [
      ["image/jpeg", "image"],
      ["image/png", "image"],
      ["image/webp", "image"],
      ["image/gif", "gif"],
      ["video/mp4", "video"],
      ["video/webm", "video"],
    ] as const;

    cases.forEach(([contentType, recordType]) => {
      expect(mediaValidationError(fileLike(contentType, MEDIA_MAX_SIZE_BYTES))).toBeNull();
      expect(mediaTypeFromContentType(contentType)).toBe(recordType);
    });
  });

  it("rejects unsupported content and files above 25 MB before an upload begins", () => {
    expect(mediaValidationError(fileLike("application/pdf", 1200))).toMatch(/JPEG/);
    expect(mediaValidationError(fileLike("video/mp4", MEDIA_MAX_SIZE_BYTES + 1))).toBe("Media must be 25 MB or smaller.");
  });

  it("creates item-scoped safe Blob paths without exposing unsanitized filenames", () => {
    expect(safeMediaPath("Source Item / 01", "Launch Demo (Final).MP4"))
      .toBe("magpie/media/source-item-01/launch-demo-final-.mp4");
  });

  it("warns only for low-resolution GIFs with known intrinsic dimensions", () => {
    const tiny = { type: "gif" as const, width: 170, height: 136 };
    expect(isLowResolutionGif(tiny)).toBe(true);
    expect(lowResolutionGifMessage(tiny)).toContain("170×136");
    expect(isLowResolutionGif({ type: "gif", width: 1280, height: 720 })).toBe(false);
    expect(isLowResolutionGif({ type: "video", width: 170, height: 136 })).toBe(false);
    expect(isLowResolutionGif({ type: "gif" })).toBe(false);
  });

  it("keeps legacy media records valid while requiring new dimensions to be stored as a pair", () => {
    expect(timelineItemSchema.safeParse({
      ...baseItem,
      media: { url: "https://example.com/demo.gif", type: "gif", alt: "Demo" },
    }).success).toBe(true);
    expect(timelineItemSchema.safeParse({
      ...baseItem,
      media: { url: "https://example.com/demo.gif", type: "gif", alt: "Demo", width: 640, height: 360 },
    }).success).toBe(true);
    expect(timelineItemSchema.safeParse({
      ...baseItem,
      media: { url: "https://example.com/demo.gif", type: "gif", alt: "Demo", width: 640 },
    }).success).toBe(false);
  });
});
