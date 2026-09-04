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
    expect(css).toContain('--cursor-default: url("/cursor-plus.svg") 10 10, crosshair');
    expect(css).toContain('--cursor-action: url("/cursor-plus-pick.svg") 10 10, pointer');
    expect(defaultCursor).toContain('width="20" height="20"');
    expect(pickerCursor).toContain('width="20" height="20"');
    expect(defaultCursor).toContain('M9 4');
    expect(pickerCursor).toContain('M9 3');
    expect(defaultCursor).toContain('#D6452F');
    expect(pickerCursor).toContain('#D6452F');
    expect(pickerCursor).not.toContain('<rect');
  });

  it("uses a light borderless stacked readout on the cursor’s lower-left side with faint viewport guides", () => {
    expect(css).toMatch(/\.coordinate-cursor\s*\{[\s\S]*?position:\s*fixed[\s\S]*?flex-direction:\s*column/);
    expect(css).toMatch(/\.coordinate-cursor\s*\{[\s\S]*?color:\s*rgba\(17, 19, 17, 0\.36\)/);
    expect(css).toMatch(/\.coordinate-cursor\s*\{[\s\S]*?transform:\s*translate\(calc\(-100% - 11px\), 11px\)/);
    expect(css).toMatch(/\.coordinate-cursor\s*\{[\s\S]*?letter-spacing:\s*-0\.055em/);
    expect(css).toContain(".coordinate-cursor.is-right-of-cursor");
    expect(css).toContain(".coordinate-cursor.is-above-cursor");
    expect(css).toMatch(/\.cursor-guides\s*\{[\s\S]*?position:\s*fixed[\s\S]*?pointer-events:\s*none/);
    expect(css).toContain("background: rgba(17, 19, 17, 0.11)");
    expect(css).not.toMatch(/\.coordinate-cursor\s*\{[^}]*border:/);
    expect(css).not.toMatch(/@media[^{}]*\{[\s\S]*?\.coordinate-cursor,[\s\S]*?display:\s*none/);
  });

  it("stops every visible connector stroke at its calculated item-border endpoint", () => {
    expect(css).toMatch(/\.connection-layer path:not\(\[d\^="M 0"\]\)\s*\{[\s\S]*?stroke-linecap:\s*butt/);
    expect(css).toMatch(/\.connector-route-shadow,\s*\.connector-route-line\s*\{[\s\S]*?stroke-linecap:\s*butt/);
    expect(css).toMatch(/\.editor-network-preview path\s*\{[\s\S]*?stroke-linecap:\s*butt/);
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
