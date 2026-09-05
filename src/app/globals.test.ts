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

  it("contains responsive Gantt scrolling behind an opaque frozen pane with a technical rail and graphite veil", () => {
    expect(css).toMatch(/html,\s*body\s*\{[\s\S]*?max-width:\s*100%[\s\S]*?overflow-x:\s*clip/);
    expect(css).toMatch(/\.timeline-scroll\s*\{[\s\S]*?isolation:\s*isolate[\s\S]*?overflow-x:\s*auto/);
    expect(css).toMatch(/\.axis-spacer,\s*\.lane-label\s*\{[\s\S]*?position:\s*sticky[\s\S]*?overflow:\s*hidden[\s\S]*?background:\s*var\(--paper\)/);
    expect(css).toContain("--label-width: clamp(176px, 15vw, 190px)");
    expect(css).toContain("--timeline-width: clamp(930px, 72vw, 1080px)");
    expect(css).toContain("--future-width: clamp(198px, 17vw, 220px)");
    expect(css).toMatch(/\.timeline-scroll-window\s*\{[\s\S]*?left:\s*calc\([\s\S]*?var\(--scroll-progress\)[\s\S]*?background:\s*var\(--ink\)[\s\S]*?box-shadow:\s*inset 3px 0 0 var\(--signal\)/);
    expect(css).toMatch(/\.timeline-scroll::-webkit-scrollbar-thumb\s*\{[\s\S]*?background:\s*var\(--ink\)/);
    expect(css).toMatch(/\.timeline-depth-veil\s*\{[\s\S]*?left:\s*var\(--label-width\)[\s\S]*?opacity:\s*0[\s\S]*?pointer-events:\s*none/);
    expect(css).toMatch(/\.timeline-scroll-shell\[data-scrolled="true"\] \.timeline-depth-veil\s*\{\s*opacity:\s*1/);
  });

  it("layers deterministic lane graphite below month gridlines and Gantt items", () => {
    expect(css).toMatch(/\.lane-track\s*\{[\s\S]*?position:\s*relative[\s\S]*?overflow:\s*hidden/);
    expect(css).toMatch(/\.lane-graphite-shadow\s*\{[\s\S]*?position:\s*absolute[\s\S]*?z-index:\s*0[\s\S]*?inset:\s*0[\s\S]*?pointer-events:\s*none/);
    expect(css).toMatch(/\.month-grid\s*\{[\s\S]*?z-index:\s*1/);
    expect(css).toMatch(/\.timeline-item\s*\{[\s\S]*?z-index:\s*2/);
    expect(css).not.toMatch(/\.lane-graphite-shadow\s*\{[^}]*background:/);
    expect(css).not.toMatch(/\.lane-graphite-shadow\s*\{[^}]*mix-blend-mode:/);
  });

  it("renders Guiding Light focus as five equal cells with black matching items and faint orthogonal tethers", () => {
    expect(css).toMatch(/\.guiding-light-track\s*\{[\s\S]*?grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\)/);
    expect(css).toMatch(/\.timeline-item\.is-guiding-match,[\s\S]*?\.future-item\.is-guiding-match\s*\{[\s\S]*?color:\s*var\(--paper-raised\)[\s\S]*?background:\s*var\(--ink\)/);
    expect(css).toMatch(/\.guiding-light-tether-layer\s*\{[\s\S]*?pointer-events:\s*none/);
    expect(css).toMatch(/\.guiding-light-tether-layer path\s*\{[\s\S]*?stroke-linecap:\s*butt/);
  });

  it("layers one continuous non-interactive ink surface under partially inverted Guiding Light labels", () => {
    expect(css).toMatch(/\.guiding-light-track\s*\{[\s\S]*?position:\s*relative[\s\S]*?isolation:\s*isolate/);
    expect(css).toMatch(/\.guiding-light-ink-canvas\s*\{[\s\S]*?position:\s*absolute[\s\S]*?inset:\s*0[\s\S]*?pointer-events:\s*none/);
    expect(css).toMatch(/\.guiding-light-cell\s*\{[\s\S]*?cursor:\s*var\(--cursor-action\)/);
    expect(css).toMatch(/\.guiding-light-cell \.guiding-light-name\s*\{[\s\S]*?mix-blend-mode:\s*difference/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.guiding-light-ink-canvas\s*\{\s*display:\s*none/);
  });

  it("stops every visible connector stroke at its calculated item-border endpoint", () => {
    expect(css).toMatch(/\.connection-layer path:not\(\[d\^="M 0"\]\)\s*\{[\s\S]*?stroke-linecap:\s*butt/);
    expect(css).toMatch(/\.connector-route-shadow,\s*\.connector-route-line\s*\{[\s\S]*?stroke-linecap:\s*butt/);
    expect(css).toMatch(/\.editor-network-preview path\s*\{[\s\S]*?stroke-linecap:\s*butt/);
  });

  it("keeps connector strokes behind opaque Gantt items while editor controls remain above them", () => {
    expect(css).toMatch(/\.lane-track\s*\{[\s\S]*?z-index:\s*3[\s\S]*?isolation:\s*isolate/);
    expect(css).toMatch(/\.connection-layer\s*\{[\s\S]*?z-index:\s*2/);
    expect(css).toMatch(/\.editor-network-preview\s*\{[\s\S]*?z-index:\s*4/);
    expect(css).toMatch(/\.editor-bar,\s*\.editor-future-item\s*\{[\s\S]*?z-index:\s*5/);
    expect(css).toMatch(/\.connector-editor-routes\s*\{[\s\S]*?z-index:\s*2/);
    expect(css).toMatch(/\.connector-board-item\s*\{[\s\S]*?z-index:\s*3/);
    expect(css).toMatch(/\.connector-editor-controls\s*\{[\s\S]*?z-index:\s*8[\s\S]*?pointer-events:\s*none/);
    expect(css).toMatch(/\.connector-mid-handle,\s*\.connector-elbow-handle,\s*\.connector-terminal-handle\s*\{[\s\S]*?pointer-events:\s*all/);
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

  it("shows designed upload progress and prevents low-resolution GIFs from being enlarged", () => {
    expect(css).toMatch(/\.media-upload-progress\s*\{[\s\S]*?height:\s*3px[\s\S]*?background:\s*rgba\(17, 19, 17, 0\.12\)/);
    expect(css).toMatch(/\.media-upload-progress > span\s*\{[\s\S]*?background:\s*var\(--signal\)/);
    expect(css).toMatch(/\.media-quality-note\s*\{[\s\S]*?border-left:\s*2px solid var\(--signal\)/);
    expect(css).toMatch(/\.media-editor-preview img\.media-no-upscale,[\s\S]*?\.preview-content img\.media-no-upscale,[\s\S]*?object-fit:\s*scale-down/);
  });
});
