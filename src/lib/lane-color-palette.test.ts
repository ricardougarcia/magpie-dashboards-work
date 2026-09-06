import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(`${process.cwd()}/src/app/globals.css`, "utf8");

const EXPECTED_LANE_COLORS = {
  steel: "#365f73",
  forest: "#426b4f",
  violet: "#65517b",
  umber: "#87583b",
  coral: "#bd4034",
} as const;

function tokenValue(name: string) {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`Missing CSS token --${name}`);
  return match[1].toLowerCase();
}

function rgb(hex: string) {
  const value = hex.slice(1);
  return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255) as [number, number, number];
}

function linear(channel: number) {
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string) {
  const [red, green, blue] = rgb(hex).map(linear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first: string, second: string) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

function lab(hex: string) {
  const [red, green, blue] = rgb(hex).map(linear);
  const x = (0.4124564 * red + 0.3575761 * green + 0.1804375 * blue) / 0.95047;
  const y = 0.2126729 * red + 0.7151522 * green + 0.072175 * blue;
  const z = (0.0193339 * red + 0.119192 * green + 0.9503041 * blue) / 1.08883;
  const delta = 6 / 29;
  const pivot = (value: number) => value > delta ** 3 ? value ** (1 / 3) : value / (3 * delta ** 2) + 4 / 29;
  const [fx, fy, fz] = [x, y, z].map(pivot);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)] as [number, number, number];
}

function deltaE(first: string, second: string) {
  const a = lab(first);
  const b = lab(second);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

describe("lane color palette", () => {
  it("uses the approved restrained but distinct lane accents without changing the global signal red", () => {
    Object.entries(EXPECTED_LANE_COLORS).forEach(([name, value]) => {
      expect(tokenValue(`lane-${name}`)).toBe(value);
    });
    expect(tokenValue("signal")).toBe("#d6452f");
    expect(css).toContain(".color-steel { --item-color: var(--lane-steel); }");
    expect(css).toContain(".color-forest { --item-color: var(--lane-forest); }");
    expect(css).toContain(".color-graphite { --item-color: var(--lane-violet); }");
    expect(css).toContain(".color-umber { --item-color: var(--lane-umber); }");
    expect(css).toContain(".color-signal { --item-color: var(--lane-coral); }");
  });

  it("keeps every selected-item fill readable against raised-paper text", () => {
    const paper = tokenValue("paper-raised");
    Object.values(EXPECTED_LANE_COLORS).forEach((color) => {
      expect(contrast(color, paper)).toBeGreaterThanOrEqual(4.5);
    });
  });

  it("maintains strong pairwise perceptual separation at thin border sizes", () => {
    const colors = Object.values(EXPECTED_LANE_COLORS);
    const distances = colors.flatMap((first, index) => colors.slice(index + 1).map((second) => deltaE(first, second)));
    expect(Math.min(...distances)).toBeGreaterThanOrEqual(24);
  });
});
