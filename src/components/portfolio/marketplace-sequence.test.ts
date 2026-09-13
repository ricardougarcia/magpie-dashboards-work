import { describe, expect, it } from "vitest";
import { getMarketplaceFrame, marketplaceImageStops } from "./marketplace-sequence";

describe("Marketplace scroll sequence", () => {
  it("gives each catalog and the shared product a separate readable stop before Research", () => {
    expect(marketplaceImageStops).toEqual([0, .22, .44, .66]);
    for (const [index, progress] of [.07, .29, .51, .71].entries()) {
      const frame = getMarketplaceFrame(progress);
      expect(frame.selected).toBe(index);
      if (frame.from !== frame.to) expect(frame.reveal).toBe(frame.to === index ? 1 : 0);
      expect(frame.departure).toBe(1);
      expect(frame.arrival).toBe(0);
      expect(frame.nav).toBe(0);
    }
  });

  it("changes only between adjacent originals and keeps each transition between its two stops", () => {
    for (const [index, progress] of [.18, .40, .62].entries()) {
      const frame = getMarketplaceFrame(progress);
      expect([frame.from, frame.to]).toEqual([index, index + 1]);
      expect(frame.reveal).toBeGreaterThan(0);
      expect(frame.reveal).toBeLessThan(1);
      expect([index, index + 1]).toContain(frame.selected);
      expect(frame.handoff).toBe(0);
    }
  });

  it("revisits every complete original in reverse without skipping a catalog", () => {
    expect([.71, .51, .29, .07].map(progress => getMarketplaceFrame(progress).selected)).toEqual([3, 2, 1, 0]);
    const outward = [.17, .39, .61, .86].map(getMarketplaceFrame);
    const returning = [.86, .61, .39, .17].map(getMarketplaceFrame).reverse();
    expect(returning).toEqual(outward);
  });

  it("holds the shared Marketplace before beginning the Catalogs-to-Research handoff", () => {
    for (const progress of [.66, .70, .75, .76]) {
      const frame = getMarketplaceFrame(progress);
      expect(frame.selected).toBe(3);
      expect(frame.departure).toBe(1);
      expect(frame.handoff).toBe(0);
      expect(frame.nav).toBe(0);
    }
  });

  it("starts the opening departure before Research arrives and finishes the lettering handoff last", () => {
    const departing = getMarketplaceFrame(.82);
    expect(departing.departure).toBeGreaterThan(0);
    expect(departing.departure).toBeLessThan(1);
    expect(departing.arrival).toBe(0);
    expect(departing.nav).toBe(0);
    expect(departing.wordBlend).toBe(0);

    const replacing = getMarketplaceFrame(.90);
    expect(replacing.departure).toBe(0);
    expect(replacing.arrival).toBeGreaterThan(0);
    expect(replacing.arrival).toBeLessThan(1);
    expect(replacing.nav).toBeGreaterThan(0);
    expect(replacing.wordBlend).toBe(0);

    const settled = getMarketplaceFrame(.96);
    expect(settled.departure).toBe(0);
    for (const key of ["arrival", "handoff", "nav", "wordBlend"] as const) expect(settled[key], key).toBe(1);
    expect(settled.selected).toBe(3);
  });

  it("clamps browser overscroll to stable beginning and ending scenes", () => {
    expect(getMarketplaceFrame(-.5)).toEqual(getMarketplaceFrame(0));
    expect(getMarketplaceFrame(1.5)).toEqual(getMarketplaceFrame(1));
  });

  it("never selects an unavailable original or produces invalid opacity during a full traversal", () => {
    for (let step = 0; step <= 200; step++) {
      const frame = getMarketplaceFrame(step / 200);
      expect([0, 1, 2, 3]).toContain(frame.selected);
      expect([frame.from, frame.to]).toContain(frame.selected);
      for (const key of ["reveal", "departure", "arrival", "handoff", "nav", "wordBlend", "registration"] as const) {
        expect(frame[key], `${key} at ${step}`).toBeGreaterThanOrEqual(0);
        expect(frame[key], `${key} at ${step}`).toBeLessThanOrEqual(1);
      }
    }
  });
});
