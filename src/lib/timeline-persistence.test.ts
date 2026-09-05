import { describe, expect, it } from "vitest";
import { reverseConnectorRoute } from "@/lib/connector-parity";
import { prepareTimelineSave } from "@/lib/timeline-persistence";
import type { TimelineData } from "@/lib/timeline-types";

const data: TimelineData = {
  version: 7,
  updatedAt: "2026-09-03T00:00:00.000Z",
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
      relations: [
        {
          targetId: "target",
          targetName: "Target",
          description: "Existing connection",
          connector: {
            source: { side: "right", offset: 0.25 },
            target: { side: "left", offset: 0.75 },
            points: [
              { x: 0.1, y: 0.3 },
              { x: 0.55, y: 0.3 },
              { x: 0.55, y: 0.7 },
              { x: 0.9, y: 0.7 },
            ],
          },
        },
      ],
      guidingLights: ["Learn", "Stabilize"],
      start: 0,
      end: 1,
      planned: false,
      ongoing: false,
      colorToken: "graphite",
      media: { url: "https://example.public.blob.vercel-storage.com/artifact.png", type: "image", alt: "Artifact" },
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

describe("timeline save preservation", () => {
  it("retains all owner-authored content and connector geometry across compatible saves", () => {
    const original = structuredClone(data);
    const saved = prepareTimelineSave(data, "2026-09-04T12:00:00.000Z");

    expect(data).toEqual(original);
    expect(saved.version).toBe(8);
    expect(saved.updatedAt).toBe("2026-09-04T12:00:00.000Z");
    expect(saved.meta).toEqual(original.meta);
    expect(saved.lanes).toEqual(original.lanes);
    expect(saved.items[0].name).toBe(original.items[0].name);
    expect(saved.items[0].description).toBe(original.items[0].description);
    expect(saved.items[0].value).toBe(original.items[0].value);
    expect(saved.items[0].media).toEqual(original.items[0].media);
    expect(saved.items[0].guidingLights).toEqual(original.items[0].guidingLights);
    expect(saved.items[0].relations).toEqual(original.items[0].relations);
    expect(saved.items[1]).toEqual(original.items[1]);
  });

  it("repairs reciprocal connector mismatches before writing the next timeline version", () => {
    const reciprocal = structuredClone(data);
    reciprocal.items[1].relations = [{
      targetId: "source",
      targetName: "Source",
      description: "Reverse relation",
      connector: {
        source: { side: "left", offset: 0.5 },
        target: { side: "bottom", offset: 0.4 },
        points: [{ x: 0.8, y: 0.7 }, { x: 0.3, y: 0.7 }, { x: 0.3, y: 0.2 }],
      },
    }];

    const saved = prepareTimelineSave(reciprocal, "2026-09-04T12:00:00.000Z");
    const forward = saved.items[0].relations[0].connector;
    const reverse = saved.items[1].relations[0].connector;

    expect(forward).toBeDefined();
    expect(reverse).toEqual(reverseConnectorRoute(forward!));
    expect(saved.items[0].description).toBe(reciprocal.items[0].description);
    expect(saved.items[1].description).toBe(reciprocal.items[1].description);
  });
});
