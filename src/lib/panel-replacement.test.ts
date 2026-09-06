import { describe, expect, it } from "vitest";
import { panelReplacementState } from "./panel-replacement";

const geometry = { incomingTop: 720, contentTop: 140, viewportHeight: 1000 };

describe("Panel 1 replacement by the Panel 2 top line", () => {
  it("keeps tall Panel 1 layouts native and readable until Panel 2 reaches the viewport", () => {
    const tall = { incomingTop: 1500, contentTop: 140, viewportHeight: 800 };
    expect(panelReplacementState({ ...tall, scrollY: 600 })).toMatchObject({ shift: 0, opacity: 1, progress: 0 });
    expect(panelReplacementState({ ...tall, scrollY: 800 }).shift).toBe(75);
  });

  it("moves Panel 1 at one-quarter of native scroll speed while Panel 2 catches it", () => {
    const first = panelReplacementState({ ...geometry, scrollY: 100 });
    const second = panelReplacementState({ ...geometry, scrollY: 300 });
    const panel1Delta = -(300 - 100) + second.shift - first.shift;
    expect(panel1Delta).toBe(-50);
  });

  it("holds the opacity floor until the Panel 2 top line reaches Panel 1 content", () => {
    const threshold = (geometry.incomingTop - geometry.contentTop) / 0.75;
    const nearEnd = panelReplacementState({ ...geometry, scrollY: threshold - 1 });
    expect(nearEnd.opacity).toBe(0.15);
    expect(nearEnd.replaced).toBe(false);
    expect(panelReplacementState({ ...geometry, scrollY: threshold }).replaced).toBe(true);
    expect(panelReplacementState({ ...geometry, scrollY: threshold + 100 }).opacity).toBe(0.15);
  });

  it("returns identical states at the same positions when scrolling back up or stopping", () => {
    const positions = [0, 125, 300, 600, 800];
    const down = positions.map(scrollY => panelReplacementState({ ...geometry, scrollY }));
    const up = positions.toReversed().map(scrollY => panelReplacementState({ ...geometry, scrollY })).toReversed();
    expect(up).toEqual(down);
  });

  it("accepts a different opacity floor and returns native motion for reduced motion", () => {
    expect(panelReplacementState({ ...geometry, scrollY: 700, opacityFloor: 0.3 }).opacity).toBe(0.3);
    expect(panelReplacementState({ ...geometry, scrollY: 900, reducedMotion: true })).toEqual({ shift: 0, pinShift: 0, progress: 0, opacity: 1, replaced: false });
  });
});
