import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { usePortalMotion } from "./portal-motion";

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let clock: number;

function MotionHarness() {
  const { track, stage, atlas, playing, play } = usePortalMotion();
  return <div ref={track} data-motion-track>
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
