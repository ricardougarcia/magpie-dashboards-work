import { act, cleanup, fireEvent, render } from "@testing-library/react";
import type { CSSProperties } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { usePortalMotion } from "./portal-motion";

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let clock: number;

function MotionHarness({ openingHeight }: { openingHeight?: number } = {}) {
  const { track, stage, atlas, playing, play, step, percent, go } = usePortalMotion();
  return <div ref={track} data-motion-track style={openingHeight ? { "--portal-opening-height": `${openingHeight}px` } as CSSProperties : undefined}>
    <div ref={stage} data-motion-stage>
      <button type="button" data-portal-play aria-pressed={playing} onClick={play}>
        <span>{playing ? "Pause story" : "Play story"}</span>
      </button>
      <article ref={atlas}>
        <div className="map-window"><div className="context-sheet" /></div>
        <div className="work-panel" />
        <svg className="work-connector"><path /><circle /></svg>
      </article>
      <button type="button">Another control</button>
      <button type="button" onClick={() => go(0)}>Ecosystem</button>
      <button type="button" onClick={() => go(1)}>Discovery</button>
      <button type="button" onClick={() => go(7)}>Impact</button>
      <output aria-label="Current milestone">{step}</output>
      <output aria-label="Story progress">{percent}</output>
    </div>
  </div>;
}

function flushFrame() {
  clock += 16;
  act(() => {
    for (const [id, callback] of [...frames]) {
      if (frames.delete(id)) callback(clock);
    }
  });
}

beforeEach(() => {
  frames = new Map(); nextFrame = 0; clock = 1000;
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute("data-motion-track") ? 5000 : 700;
  });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1100);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(700);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return new DOMRect(0, 0, 1100, this.offsetHeight);
  });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function openingGeometry(openingHeight = 1400) {
  let stageHeight = openingHeight;
  vi.stubGlobal("innerHeight", 700);
  vi.stubGlobal("scrollY", 120);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute("data-motion-track") ? 5000 : this.hasAttribute("data-motion-stage") ? stageHeight : 700;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    return new DOMRect(0, this.hasAttribute("data-motion-track") ? 120 - window.scrollY : 0, 1100, this.offsetHeight);
  });
  return {
    scrollTo: (position: number) => {
      vi.stubGlobal("scrollY", position);
      fireEvent.scroll(window);
      flushFrame();
    },
    collapseStage: () => {
      stageHeight = 700;
      fireEvent.resize(window);
      flushFrame();
    },
  };
}

it("pauses playback when pointerdown is followed by the Play/Pause toggle's click", () => {
  const { getByRole } = render(<MotionHarness />);
  const toggle = getByRole("button", { name: "Play story" });
  const label = toggle.querySelector("span")!;
  fireEvent.pointerDown(label);
  fireEvent.click(label);
  expect(toggle.getAttribute("aria-pressed")).toBe("true");
  flushFrame();
  expect(window.scrollTo).toHaveBeenCalledOnce();

  // Browsers dispatch pointerdown before click. The global interruption handler
  // must leave this toggle's active state intact so the click can pause it.
  fireEvent.pointerDown(label);
  fireEvent.click(label);
  expect(toggle.getAttribute("aria-pressed")).toBe("false");
  expect(toggle.textContent).toBe("Play story");
  expect(frames.size).toBe(0);
  flushFrame();
  expect(window.scrollTo).toHaveBeenCalledOnce();
});

it("still stops playback for wheel and keyboard input elsewhere on the page", () => {
  const { getByRole } = render(<MotionHarness />);
  const toggle = getByRole("button", { name: "Play story" });
  const anotherControl = getByRole("button", { name: "Another control" });
  for (const event of ["wheel", "keydown"]) {
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    flushFrame();
    const movesBeforeInterrupt = vi.mocked(window.scrollTo).mock.calls.length;
    if (event === "wheel") fireEvent.wheel(anotherControl, { deltaY: 40 });
    else fireEvent.keyDown(anotherControl, { key: "ArrowDown" });
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    expect(frames.size).toBe(0);
    flushFrame();
    expect(vi.mocked(window.scrollTo).mock.calls).toHaveLength(movesBeforeInterrupt);
  }
});

it("keeps the opening readable before advancing and preserves progress when the stage contracts", () => {
  const geometry = openingGeometry();
  const { getByLabelText } = render(<MotionHarness openingHeight={1400} />);
  const milestone = getByLabelText("Current milestone");
  const progress = getByLabelText("Story progress");
  // The track starts 120px down the page. The opening needs 700px of native
  // reading scroll before the 3,600px Atlas sequence begins.
  for (const position of [120, 470, 820]) {
    geometry.scrollTo(position);
    expect(milestone.textContent).toBe("0");
    expect(progress.textContent).toBe("0");
  }
  geometry.scrollTo(1324);
  expect(milestone.textContent).toBe("1");
  expect(progress.textContent).toBe("14");
  geometry.collapseStage();
  expect(milestone.textContent).toBe("1");
  expect(progress.textContent).toBe("14");
  geometry.scrollTo(2332);
  expect(milestone.textContent).toBe("3");
  expect(progress.textContent).toBe("42");
  geometry.scrollTo(4420);
  expect(milestone.textContent).toBe("7");
  expect(progress.textContent).toBe("100");
  geometry.scrollTo(470);
  expect(milestone.textContent).toBe("0");
  expect(progress.textContent).toBe("0");
});

it("lands milestone navigation after the reading lead and returns to the opening top", () => {
  const geometry = openingGeometry();
  const { getByRole } = render(<MotionHarness openingHeight={1400} />);
  fireEvent.click(getByRole("button", { name: "Discovery" }));
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 1324, behavior: "instant" });
  geometry.scrollTo(1324);
  geometry.collapseStage();
  fireEvent.click(getByRole("button", { name: "Impact" }));
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 4420, behavior: "instant" });
  geometry.scrollTo(4420);
  fireEvent.click(getByRole("button", { name: "Ecosystem" }));
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 120, behavior: "instant" });
});

it.each([
  { openingHeight: 1256, position: 120 },
  { openingHeight: 1400, position: 120 },
  { openingHeight: 1400, position: 470 },
])("starts playback without jumping over the reading lead ($openingHeight px opening at $position)", ({ openingHeight, position }) => {
  const geometry = openingGeometry(openingHeight);
  const { getByRole } = render(<MotionHarness openingHeight={openingHeight} />);
  geometry.scrollTo(position);
  fireEvent.click(getByRole("button", { name: "Play story" }));
  expect(window.scrollTo).not.toHaveBeenCalled();
  flushFrame();
  const destination = vi.mocked(window.scrollTo).mock.calls.at(-1)?.[0] as ScrollToOptions;
  expect(destination.top).toBeGreaterThan(position);
  expect(destination.top).toBeLessThan(position + 10);
});
