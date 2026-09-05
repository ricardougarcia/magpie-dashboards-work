import type { ColorToken } from "@/lib/timeline-types";

export type GraphiteRgb = readonly [red: number, green: number, blue: number];

export type LaneGraphiteTexture = {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
};

export const LANE_GRAPHITE_ACCENTS: Record<ColorToken, GraphiteRgb> = {
  graphite: [39, 42, 40],
  signal: [214, 69, 47],
  steel: [89, 100, 106],
  umber: [134, 100, 79],
  forest: [79, 104, 89],
};

const MAX_GRAIN_ALPHA = 0.07;
const MIN_GRAIN_ALPHA = 0.038;
const EDGE_COVERAGE = 0.84;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function smootherStep(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function hashUnit(x: number, y: number, seed: number, salt: number) {
  let value = Math.imul(x + 1 + salt * 101, 0x9e3779b1)
    ^ Math.imul(y + 1 + salt * 179, 0x85ebca6b)
    ^ Math.imul(seed + 1, 0xc2b2ae35);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 0xffffffff;
}

export function laneGraphiteSeed(laneName: string, laneIndex: number) {
  let hash = Math.imul(laneIndex + 1, 0x9e3779b1);
  for (let index = 0; index < laneName.length; index += 1) {
    hash ^= laneName.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function laneGraphiteDensity(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (width <= 0 || height <= 0) return 0;
  const band = Math.max(1, height * 0.21);
  const edgeField = (distance: number) => (
    distance >= band ? 0 : smootherStep(1 - distance / band)
  );
  const top = edgeField(y);
  const bottom = edgeField(Math.max(0, height - 1 - y));
  const left = edgeField(x);
  return clamp(top + bottom + left, 0, 1);
}

export function createLaneGraphiteTexture({
  width,
  height,
  seed,
  accent,
  grainStep = 1,
}: {
  width: number;
  height: number;
  seed: number;
  accent: GraphiteRgb;
  grainStep?: number;
}): LaneGraphiteTexture {
  const pixelWidth = Math.max(1, Math.round(width));
  const pixelHeight = Math.max(1, Math.round(height));
  const step = Math.max(1, Math.round(grainStep));
  const pixels = new Uint8ClampedArray(pixelWidth * pixelHeight * 4);

  const paint = (originX: number, originY: number, markWidth: number, markHeight: number, alpha: number) => {
    const maxX = Math.min(pixelWidth, originX + markWidth);
    const maxY = Math.min(pixelHeight, originY + markHeight);
    for (let y = originY; y < maxY; y += 1) {
      for (let x = originX; x < maxX; x += 1) {
        const index = (y * pixelWidth + x) * 4;
        if (alpha <= pixels[index + 3]) continue;
        pixels[index] = accent[0];
        pixels[index + 1] = accent[1];
        pixels[index + 2] = accent[2];
        pixels[index + 3] = alpha;
      }
    }
  };

  for (let y = 0; y < pixelHeight; y += step) {
    for (let x = 0; x < pixelWidth; x += step) {
      const density = laneGraphiteDensity(x, y, pixelWidth, pixelHeight);
      if (density <= 0) continue;
      const cellX = Math.floor(x / step);
      const cellY = Math.floor(y / step);
      const tooth = 0.74 + hashUnit(cellX, cellY, seed, 1) * 0.26;
      const survival = EDGE_COVERAGE * Math.pow(density, 0.86) * tooth;
      if (hashUnit(cellX, cellY, seed, 2) > survival) continue;

      const alphaUnit = MIN_GRAIN_ALPHA
        + (MAX_GRAIN_ALPHA - MIN_GRAIN_ALPHA) * hashUnit(cellX, cellY, seed, 3);
      const alpha = Math.round(alphaUnit * 255);
      const shape = hashUnit(cellX, cellY, seed, 4);
      const orientation = hashUnit(cellX, cellY, seed, 5);
      const run = shape > 0.91 ? 3 : shape > 0.72 ? 2 : 1;
      const markWidth = orientation < 0.47 ? step * run : step;
      const markHeight = orientation > 0.53 ? step * run : step;
      paint(x, y, markWidth, markHeight, alpha);
    }
  }

  return { width: pixelWidth, height: pixelHeight, pixels };
}

export function laneGraphiteCacheKey({
  width,
  height,
  devicePixelRatio,
  seed,
  colorToken,
}: {
  width: number;
  height: number;
  devicePixelRatio: number;
  seed: number;
  colorToken: ColorToken;
}) {
  return `${Math.round(width)}x${Math.round(height)}@${devicePixelRatio}:${seed}:${colorToken}`;
}
