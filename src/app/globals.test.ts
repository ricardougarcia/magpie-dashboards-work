import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(`${process.cwd()}/src/app/globals.css`, "utf8");
const defaultCursor = readFileSync(`${process.cwd()}/public/cursor-plus.svg`, "utf8");
const pickerCursor = readFileSync(`${process.cwd()}/public/cursor-plus-pick.svg`, "utf8");
const favicon = readFileSync(`${process.cwd()}/src/app/icon.svg`, "utf8");

describe("public timeline visual tokens", () => {
  it("maps every legend color class to its item-color variable", () => {
    ["graphite", "signal", "steel", "umber", "forest"].forEach((token) => {
      expect(css).toContain(`.legend-entry i.color-${token}`);
    });
    expect(css).toMatch(/\.legend-entry i\.color-forest[\s\S]*?background:\s*var\(--item-color\)/);
  });

  it("applies only subtle condensed tracking to the hero summary", () => {
    expect(css).toMatch(/\.hero-summary\s*\{[\s\S]*?letter-spacing:\s*-0\.012em/);
  });

  it("uses the signal-red plus cursor system for default and actionable states", () => {
    expect(css).toContain('--cursor-default: url("/cursor-plus.svg") 16 16, crosshair');
    expect(css).toContain('--cursor-action: url("/cursor-plus-pick.svg") 16 16, pointer');
    expect(defaultCursor).toContain('#D6452F');
    expect(pickerCursor).toContain('#D6452F');
    expect(pickerCursor).toContain('<rect');
  });

  it("uses the matching signal-red plus favicon", () => {
    expect(favicon).toContain('#D6452F');
    expect(favicon).toContain('<path');
  });

  it("honors variable stochastic pixel timing and the lane-assignment control", () => {
    expect(css).toContain('var(--pixel-in-duration, 320ms)');
    expect(css).toContain('var(--pixel-out-duration, 220ms)');
    expect(css).toContain('.lane-color-assignment');
  });
});
