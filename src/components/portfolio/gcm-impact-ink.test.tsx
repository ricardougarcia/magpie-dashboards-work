import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { Profiler, useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GcmImpactInk } from "./gcm-impact-ink";

function Host() {
  const trackRef = useRef<HTMLDivElement>(null);
  return <div data-gcm-content-sheet><div ref={trackRef} data-testid="ink-track">
    <p>Published outcomes remain readable.</p><GcmImpactInk trackRef={trackRef} />
  </div></div>;
}

const frames = new Map<number, FrameRequestCallback>();
let nextFrame: number;
let now: number;
let bounds: DOMRect;
let observers: { callback: ResizeObserverCallback; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[];
const context = {
  setTransform: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
  quadraticCurveTo: vi.fn(), closePath: vi.fn(), fill: vi.fn(), fillStyle: "",
};

function frameAt(time: number) {
  now = time;
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach(callback => callback(time)));
}

function pointer(track: HTMLElement, type: string, x = 200, y = 180, pointerType = "mouse", isPrimary = true) {
  fireEvent(track, Object.assign(new Event(type), { clientX: x, clientY: y, pointerType, isPrimary }));
}

function setup() {
  const commits = vi.fn();
  const view = render(<Profiler id="impact" onRender={commits}><Host /></Profiler>);
  const track = view.getByTestId("ink-track");
  const canvas = view.container.querySelector("canvas")!;
  return { ...view, track, canvas, commits };
}

beforeEach(() => {
  frames.clear(); nextFrame = 0; now = 1000; observers = [];
  bounds = { left: 100, top: 80, width: 1400, height: 500, right: 1500, bottom: 580, x: 100, y: 80, toJSON: () => ({}) };
  vi.spyOn(Math, "random").mockReturnValue(.5);
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => bounds);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.stubGlobal("devicePixelRatio", 2);
  vi.stubGlobal("scrollX", 0); vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback); return nextFrame;
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal("ResizeObserver", class {
    observe = vi.fn(); disconnect = vi.fn(); unobserve = vi.fn();
    constructor(public callback: ResizeObserverCallback) { observers.push(this); }
  });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe("GCM Impact pointer ink", () => {
  it("stays idle until a primary non-touch pointer enters and keeps the drawing surface bounded", () => {
    const { track, canvas } = setup();
    expect(canvas.hidden).toBe(true);
    expect(canvas.getAttribute("aria-hidden")).toBe("true");
    expect(canvas.width).toBeLessThan(bounds.width);
    expect(canvas.width).toBe(canvas.height);
    expect(frames.size).toBe(0);
    pointer(track, "pointerenter", 200, 180, "touch");
    pointer(track, "pointermove", 220, 180, "pen", false);
    expect(frames.size).toBe(0);
    pointer(track, "pointerenter");
    frameAt(1000);
    expect(canvas.hidden).toBe(false);
    expect(context.fill).toHaveBeenCalled();
  });

  it("coalesces multiple input events into one frame without measuring layout or rerendering React", () => {
    const { track, canvas, commits } = setup();
    pointer(track, "pointerenter"); frameAt(1000);
    const initialTransform = canvas.style.transform;
    const layoutReads = vi.mocked(track.getBoundingClientRect).mock.calls.length;
    const commitCount = commits.mock.calls.length;
    for (let x = 210; x <= 400; x += 10) pointer(track, "pointermove", x);
    expect(frames.size).toBe(1);
    expect(canvas.style.transform).toBe(initialTransform);
    expect(track.getBoundingClientRect).toHaveBeenCalledTimes(layoutReads);
    frameAt(1016);
    expect(canvas.style.transform).not.toBe(initialTransform);
    expect(track.getBoundingClientRect).toHaveBeenCalledTimes(layoutReads);
    expect(commits).toHaveBeenCalledTimes(commitCount);
  });

  it("follows the latest target consistently regardless of the number of events between frames", () => {
    const path = (manyEvents: boolean) => {
      const view = setup();
      pointer(view.track, "pointerenter"); frameAt(1000);
      const transforms: string[] = [];
      for (let step = 1; step <= 5; step++) {
        const destination = 200 + step * 100;
        if (manyEvents) for (let x = destination - 90; x < destination; x += 10) pointer(view.track, "pointermove", x);
        pointer(view.track, "pointermove", destination);
        frameAt(1000 + step * 16);
        transforms.push(view.canvas.style.transform);
      }
      view.unmount();
      return transforms;
    };
    expect(path(true)).toEqual(path(false));
  });

  it.each(["pointerleave", "pointercancel"])("settles the remaining ink after %s and stops requesting frames", event => {
    const { track, canvas } = setup();
    pointer(track, "pointerenter"); frameAt(1000);
    pointer(track, "pointermove", 400); frameAt(1016);
    pointer(track, event);
    frameAt(1032);
    expect(canvas.hidden).toBe(false);
    expect(frames.size).toBe(1);
    frameAt(1300);
    expect(canvas.hidden).toBe(true);
    expect(frames.size).toBe(0);
    pointer(track, "pointerenter", 600); frameAt(1316);
    expect(canvas.hidden).toBe(false);
  });

  it("accounts for document scrolling without layout reads and batches resize measurement into a frame", () => {
    const { track, canvas } = setup();
    pointer(track, "pointerenter"); frameAt(1000);
    const beforeScroll = canvas.style.transform;
    const reads = vi.mocked(track.getBoundingClientRect).mock.calls.length;
    vi.stubGlobal("scrollY", 20);
    fireEvent.scroll(window); frameAt(1016);
    expect(canvas.style.transform).not.toBe(beforeScroll);
    expect(track.getBoundingClientRect).toHaveBeenCalledTimes(reads);
    bounds = { ...bounds, top: 70, width: 1000 };
    act(() => observers[0].callback([], observers[0] as unknown as ResizeObserver));
    fireEvent.resize(window);
    expect(track.getBoundingClientRect).toHaveBeenCalledTimes(reads);
    frameAt(1032);
    expect(track.getBoundingClientRect).toHaveBeenCalledTimes(reads + 1);
    expect(track.style.getPropertyValue("--gcm-ink-grid-y")).toBe("-6px");
  });

  it("cleans up the frame, observers, event listeners, and registered paper when unmounted", () => {
    const { track, unmount } = setup();
    pointer(track, "pointerenter"); frameAt(1000);
    expect(track.dataset.inkReady).toBe("true");
    expect(observers[0].observe).toHaveBeenCalledTimes(2);
    unmount();
    expect(frames.size).toBe(0);
    expect(observers[0].disconnect).toHaveBeenCalledOnce();
    expect(track.dataset.inkReady).toBeUndefined();
    expect(track.style.getPropertyValue("--gcm-ink-grid-x")).toBe("");
    expect(track.style.getPropertyValue("--gcm-ink-grid-y")).toBe("");
    pointer(track, "pointermove", 500);
    fireEvent.scroll(window); fireEvent.resize(window);
    expect(frames.size).toBe(0);
  });

  it("leaves the original content alone when a drawing context is unavailable", () => {
    vi.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);
    const { track, canvas, getByText } = setup();
    expect(getByText("Published outcomes remain readable.")).toBeTruthy();
    expect(track.dataset.inkReady).toBeUndefined();
    expect(canvas.hidden).toBe(true);
    pointer(track, "pointerenter");
    expect(frames.size).toBe(0);
  });
});
