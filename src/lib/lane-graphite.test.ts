import { describe, expect, it } from "vitest";
import {
  createLaneGraphiteTexture,
  LANE_GRAPHITE_ACCENTS,
  laneGraphiteDensity,
  laneGraphiteSeed,
} from "@/lib/lane-graphite";

function alphaAt(pixels: Uint8ClampedArray, width: number, x: number, y: number) {
  return pixels[(y * width + x) * 4 + 3];
}

function occupiedInRows(
  pixels: Uint8ClampedArray,
  width: number,
  startY: number,
  endY: number,
) {
  let occupied = 0;
  for (let y = startY; y < endY; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (alphaAt(pixels, width, x, y) > 0) occupied += 1;
    }
  }
  return occupied;
}

describe("lane graphite texture", () => {
  it("derives stable distinct seeds per lane", () => {
    expect(laneGraphiteSeed("Eng Build", 0)).toBe(laneGraphiteSeed("Eng Build", 0));
    expect(laneGraphiteSeed("Eng Build", 0)).not.toBe(laneGraphiteSeed("Product Build", 1));
  });

  it("treats only the top, bottom, and left edges", () => {
    expect(laneGraphiteDensity(0, 50, 400, 100)).toBeGreaterThan(0.9);
    expect(laneGraphiteDensity(200, 0, 400, 100)).toBeGreaterThan(0.9);
    expect(laneGraphiteDensity(200, 99, 400, 100)).toBeGreaterThan(0.9);
    expect(laneGraphiteDensity(399, 50, 400, 100)).toBe(0);
    expect(laneGraphiteDensity(200, 50, 400, 100)).toBe(0);
  });

  it("creates identical pixels for the same seed and size without randomness", () => {
    const input = {
      width: 420,
      height: 100,
      seed: laneGraphiteSeed("Eng Build", 0),
      accent: LANE_GRAPHITE_ACCENTS.steel,
    } as const;
    const first = createLaneGraphiteTexture(input);
    const second = createLaneGraphiteTexture(input);

    expect(first.pixels).toEqual(second.pixels);
    expect(first.pixels.some((value) => value > 0)).toBe(true);
  });

  it("changes the stable grain and accent tint between lane seeds", () => {
    const steel = createLaneGraphiteTexture({
      width: 320,
      height: 100,
      seed: laneGraphiteSeed("Eng Build", 0),
      accent: LANE_GRAPHITE_ACCENTS.steel,
    });
    const forest = createLaneGraphiteTexture({
      width: 320,
      height: 100,
      seed: laneGraphiteSeed("Product Build", 1),
      accent: LANE_GRAPHITE_ACCENTS.forest,
    });

    expect(steel.pixels).not.toEqual(forest.pixels);
    const steelPixel = steel.pixels.findIndex((value, index) => index % 4 === 3 && value > 0);
    const forestPixel = forest.pixels.findIndex((value, index) => index % 4 === 3 && value > 0);
    expect(Array.from(steel.pixels.slice(steelPixel - 3, steelPixel))).toEqual([89, 100, 106]);
    expect(Array.from(forest.pixels.slice(forestPixel - 3, forestPixel))).toEqual([79, 104, 89]);
  });

  it("uses stochastic survival to thin the tone with no solid termination band", () => {
    const texture = createLaneGraphiteTexture({
      width: 420,
      height: 100,
      seed: laneGraphiteSeed("Processes", 3),
      accent: LANE_GRAPHITE_ACCENTS.umber,
    });
    const nearEdge = occupiedInRows(texture.pixels, texture.width, 0, 4);
    const middleFalloff = occupiedInRows(texture.pixels, texture.width, 10, 14);
    const beyondBand = occupiedInRows(texture.pixels, texture.width, 30, 34);
    const falloffRow = Array.from({ length: texture.width }, (_, x) => alphaAt(texture.pixels, texture.width, x, 12));

    expect(nearEdge).toBeGreaterThan(middleFalloff);
    expect(middleFalloff).toBeGreaterThan(beyondBand);
    expect(falloffRow.some((alpha) => alpha === 0)).toBe(true);
    expect(falloffRow.some((alpha) => alpha > 0)).toBe(true);
  });

  it("keeps all surviving grain within the requested faint opacity ceiling", () => {
    const texture = createLaneGraphiteTexture({
      width: 420,
      height: 100,
      seed: laneGraphiteSeed("Challenges Planned / Unplanned", 4),
      accent: LANE_GRAPHITE_ACCENTS.signal,
    });
    const alphas = texture.pixels.filter((_value, index) => index % 4 === 3);

    expect(Math.max(...alphas)).toBeLessThanOrEqual(18);
    expect(Math.max(...alphas)).toBeGreaterThanOrEqual(15);
    expect(alphaAt(texture.pixels, texture.width, texture.width - 1, 50)).toBe(0);
  });
});
