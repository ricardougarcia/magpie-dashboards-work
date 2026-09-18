import { describe, expect, it } from "vitest";
import { DEFAULT_GUIDING_LIGHT_NARRATIVES, resolveGuidingLightNarratives } from "@/lib/guiding-light-narratives";
import { guidingLightNarrativesPatchSchema, timelineDataSchema } from "@/lib/timeline-schema";
import seed from "@/data/timeline.seed.json";

describe("Guiding Light narrative compatibility", () => {
  it("loads an existing snapshot without changing its Gantt records", () => {
    const loaded = timelineDataSchema.parse(seed);
    expect(loaded.items).toEqual(seed.items);
    expect(loaded.lanes).toEqual(seed.lanes);
    expect(resolveGuidingLightNarratives(loaded.guidingLightNarratives)).toEqual(DEFAULT_GUIDING_LIGHT_NARRATIVES);
  });

  it("preserves owner wording and fills only absent principles with isolated defaults", () => {
    const custom = { heading: "Owner heading", narrative: "Owner narrative", soleContributor: "Owner contribution" };
    const resolved = resolveGuidingLightNarratives({ Learn: custom });
    expect(resolved.Learn).toEqual(custom);
    expect(resolved.Grow).toEqual(DEFAULT_GUIDING_LIGHT_NARRATIVES.Grow);
    resolved.Learn.heading = "Draft";
    resolved.Grow.heading = "Another draft";
    expect(custom.heading).toBe("Owner heading");
    expect(resolveGuidingLightNarratives().Grow.heading).toBe("The next stage has a foundation.");
  });

  it("rejects blank narrative fields and item payloads in a narrative-only request", () => {
    const guidingLightNarratives = resolveGuidingLightNarratives();
    expect(guidingLightNarrativesPatchSchema.safeParse({ expectedVersion: 1, guidingLightNarratives, items: [] }).success).toBe(false);
    guidingLightNarratives.Learn.narrative = "   ";
    expect(guidingLightNarrativesPatchSchema.safeParse({ expectedVersion: 1, guidingLightNarratives }).success).toBe(false);
  });
});
