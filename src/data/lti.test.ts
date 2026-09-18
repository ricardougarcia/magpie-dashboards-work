// @vitest-environment node

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { ltiAssets, ltiInspections, type LtiInspectionView } from "./lti";

const publicDirectory = fileURLToPath(new URL("../../public/", import.meta.url));
const inspectionViews: LtiInspectionView[] = Object.values(ltiInspections).flat();
const allAssets = [...Object.values(ltiAssets), ...inspectionViews.map((view) => view.artifact)];

function sourceBytes(src: string) {
  // An application route resolves directly to a repository-owned public file.
  expect(src).toMatch(/^\/portfolio\/lti\/[a-z0-9-]+\.png$/);
  return readFileSync(resolve(publicDirectory, `.${src}`));
}

describe("LTI source ownership and inspection data", () => {
  it("serves every primary and inspection source from a local PNG with accurate dimensions", () => {
    for (const asset of allAssets) {
      const bytes = sourceBytes(asset.src);
      expect(bytes.subarray(0, 8).toString("hex"), asset.src).toBe("89504e470d0a1a0a");
      expect(bytes.subarray(12, 16).toString("ascii"), asset.src).toBe("IHDR");
      expect(bytes.readUInt32BE(16), asset.src).toBe(asset.width);
      expect(bytes.readUInt32BE(20), asset.src).toBe(asset.height);
    }
  });

  it.each([
    [ltiAssets.configure.src, "b21f37cae04088ba237e0bd2b438f54eef67083abe91ec60865fb4a34f90c652"],
    [ltiAssets.details.src, "bb5679ca7109b87e9f7708dc15b4e86bbad8708123378abe3b7e6e2d8bcb5329"],
    [ltiAssets.schema.src, "5e87f7a7da45ffb0c653bae9f1a8057fbfac4d8b6a2986df6638e854ec026c6b"],
  ])("preserves the imported original bytes for %s", (src, digest) => {
    expect(createHash("sha256").update(sourceBytes(src)).digest("hex")).toBe(digest);
  });

  it("keeps details within their original images and begins with each complete primary source", () => {
    for (const [group, views] of Object.entries(ltiInspections) as [keyof typeof ltiInspections, LtiInspectionView[]][]) {
      expect(new Set(views.map((view) => view.id)).size).toBe(views.length);
      expect(views[0].region).toBeUndefined();
      expect(views[0].artifact.src).toBe(ltiAssets[group].src);
      for (const view of views) {
        if (!view.region) continue;
        const { x, y, width, height } = view.region;
        for (const value of [x, y, width, height]) expect(Number.isInteger(value), view.id).toBe(true);
        expect(x, view.id).toBeGreaterThanOrEqual(0);
        expect(y, view.id).toBeGreaterThanOrEqual(0);
        expect(width, view.id).toBeGreaterThan(0);
        expect(height, view.id).toBeGreaterThan(0);
        expect(x + width, view.id).toBeLessThanOrEqual(view.artifact.width);
        expect(y + height, view.id).toBeLessThanOrEqual(view.artifact.height);
      }
    }
  });

  it("replaces A076 with A080 and exposes all three added sources", () => {
    expect(ltiAssets.configure.code).toBe("A080");
    expect(ltiInspections.configure[0].artifact.src).toBe(ltiAssets.configure.src);
    expect(allAssets.some((asset) => asset.code === "A076" || asset.src === "/portfolio/lti/configuration.png")).toBe(false);
    const inspectionSources = new Set(inspectionViews.map((view) => view.artifact.src));
    for (const asset of [ltiAssets.configure, ltiAssets.details, ltiAssets.schema]) {
      expect(inspectionSources.has(asset.src), asset.label).toBe(true);
    }
  });
});
