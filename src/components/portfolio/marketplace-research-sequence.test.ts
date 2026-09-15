import { describe, expect, it } from "vitest";
import { getResearchFrame, researchStops } from "./marketplace-research-sequence";

describe("Research perspective sequence", () => {
  it("provides a complete reading stop for each of the six approved needs", () => {
    expect(researchStops).toEqual({ educator: [0, .16, .32], provider: [.57, .70, .83] });
    for (const perspective of ["educator", "provider"] as const) {
      researchStops[perspective].forEach((progress, topic) => {
        const frame = getResearchFrame(progress);
        expect(frame.topic).toBe(topic);
        expect(frame.perspective).toBe(perspective);
        expect(frame[perspective]).toBe(1);
        expect(frame[perspective === "educator" ? "provider" : "educator"]).toBe(0);
        expect(frame.shared).toBe(0);
      });
    }
  });

  it.each([[.11, 0, 1], [.27, 1, 2], [.45, 2, 0], [.64, 0, 1], [.78, 1, 2]])("changes the selected need at approved boundary %s", (boundary, before, after) => {
    expect(getResearchFrame(boundary - .0001).topic).toBe(before);
    const frame = getResearchFrame(boundary);
    expect(frame.topic).toBe(after);
    expect(frame.educator).toBe(0);
    expect(frame.provider).toBe(0);
  });

  it("shifts the lens from 44% to 56% with equal desktop emphasis at its midpoint", () => {
    expect(getResearchFrame(.44).lens).toBe(0);
    const midpoint = getResearchFrame(.50);
    expect(midpoint.lens).toBeCloseTo(.5);
    expect(midpoint.educator).toBeCloseTo(.5);
    expect(midpoint.provider).toBeCloseTo(.5);
    expect(midpoint.topic).toBe(0);
    expect(getResearchFrame(.56).lens).toBe(1);
  });

  it("separates compact annotations while preserving the same lens and need progression", () => {
    const midpoint = getResearchFrame(.50, true);
    expect(midpoint.topic).toBe(getResearchFrame(.50).topic);
    expect(midpoint.lens).toBeCloseTo(.5);
    expect(midpoint.educator).toBe(0);
    expect(midpoint.provider).toBe(0);
    expect(getResearchFrame(.465, true).educator).toBeCloseTo(.5);
    expect(getResearchFrame(.535, true).provider).toBeCloseTo(.5);
  });

  it("brings both perspectives together over the final nine percent", () => {
    expect(getResearchFrame(.91).shared).toBe(0);
    expect(getResearchFrame(.955).shared).toBeCloseTo(.5);
    const complete = getResearchFrame(1);
    expect(complete).toMatchObject({ topic: 2, shared: 1, educator: 1, provider: 1, perspective: "both" });
  });

  it("reverses through the same needs and exact intermediate states", () => {
    const stops = [0, .16, .32, .57, .70, .83];
    expect([...stops].reverse().map(progress => getResearchFrame(progress).topic)).toEqual([2, 1, 0, 2, 1, 0]);
    const samples = [.08, .275, .44, .5, .535, .79, .95, 1];
    expect([...samples].reverse().map(progress => getResearchFrame(progress)).reverse()).toEqual(samples.map(progress => getResearchFrame(progress)));
  });

  it("keeps browser overscroll and every intermediate emphasis within the supported range", () => {
    expect(getResearchFrame(-1)).toEqual(getResearchFrame(0));
    expect(getResearchFrame(2)).toEqual(getResearchFrame(1));
    for (let step = 0; step <= 200; step++) {
      const frame = getResearchFrame(step / 200);
      expect([0, 1, 2]).toContain(frame.topic);
      for (const key of ["lens", "shared", "educator", "provider"] as const) {
        expect(frame[key]).toBeGreaterThanOrEqual(0);
        expect(frame[key]).toBeLessThanOrEqual(1);
      }
    }
  });
});
