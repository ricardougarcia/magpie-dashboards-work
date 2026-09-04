import { describe, expect, it } from "vitest";
import { telemetryTetherGeometry, type ViewportRect } from "@/lib/telemetry-tether";

function onBorder(point: { x: number; y: number }, rect: ViewportRect) {
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  const epsilon = 0.000001;
  const withinX = point.x >= rect.left - epsilon && point.x <= right + epsilon;
  const withinY = point.y >= rect.top - epsilon && point.y <= bottom + epsilon;
  const touchesEdge = Math.abs(point.x - rect.left) < epsilon
    || Math.abs(point.x - right) < epsilon
    || Math.abs(point.y - rect.top) < epsilon
    || Math.abs(point.y - bottom) < epsilon;
  return withinX && withinY && touchesEdge;
}

describe("telemetry tether geometry", () => {
  const source: ViewportRect = { left: 420, top: 460, width: 210, height: 34 };
  const modalPlacements: ViewportRect[] = [
    { left: 1080, top: 76, width: 340, height: 420 },
    { left: 22, top: 76, width: 340, height: 420 },
    { left: 14, top: 530, width: 740, height: 290 },
    { left: 14, top: 14, width: 310, height: 480 },
  ];

  it.each(modalPlacements)("terminates on the live source and modal borders for %#", (modal) => {
    const geometry = telemetryTetherGeometry(source, modal);
    expect(onBorder(geometry.start, source)).toBe(true);
    expect(onBorder(geometry.end, modal)).toBe(true);
    expect(geometry.path).toMatch(/^M [-\d.]+ [-\d.]+ (?:H [-\d.]+ V [-\d.]+ H [-\d.]+|V [-\d.]+ H [-\d.]+ V [-\d.]+)$/);
  });

  it("changes the terminal point when the modal moves during its transition", () => {
    const before = telemetryTetherGeometry(source, { left: 1090, top: 76, width: 340, height: 120 });
    const after = telemetryTetherGeometry(source, { left: 1040, top: 76, width: 340, height: 420 });
    expect(after.end).not.toEqual(before.end);
    expect(onBorder(after.end, { left: 1040, top: 76, width: 340, height: 420 })).toBe(true);
  });
});
