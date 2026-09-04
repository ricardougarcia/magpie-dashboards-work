import { describe, expect, it } from "vitest";
import { guidingLightTetherGeometry } from "@/lib/guiding-light-tethers";

const canvas = { left: 50, top: 20, width: 1200, height: 900 };
const cell = { left: 100, top: 50, width: 200, height: 40 };

describe("Guiding Light telemetry tether geometry", () => {
  it("starts on the selected cell border and ends on the matching item border", () => {
    const item = { left: 250, top: 300, width: 120, height: 30 };
    const geometry = guidingLightTetherGeometry(cell, item, canvas, 1, 3);

    expect(geometry.source).toEqual({ x: 150, y: 70 });
    expect(geometry.target).toEqual({ x: 260, y: 280 });
    expect(geometry.path).toMatch(/^M [\d.-]+ [\d.-]+ V [\d.-]+ H [\d.-]+ V [\d.-]+$/);
    expect(geometry.path).toBe("M 150 70 V 158.2 H 260 V 280");
  });

  it("assigns a distinct origin port to every matching item", () => {
    const item = { left: 250, top: 300, width: 120, height: 30 };
    const sources = [0, 1, 2].map((index) => guidingLightTetherGeometry(cell, item, canvas, index, 3).source.x);

    expect(sources).toEqual([100, 150, 200]);
    expect(new Set(sources).size).toBe(3);
  });

  it("uses the same exact-border rule for planned work in the Q4 rail", () => {
    const plannedItem = { left: 1050, top: 420, width: 170, height: 44 };
    const geometry = guidingLightTetherGeometry(cell, plannedItem, canvas, 0, 1);

    expect(geometry.target).toEqual({ x: 1085, y: 400 });
    expect(geometry.path.endsWith("V 400")).toBe(true);
  });
});
