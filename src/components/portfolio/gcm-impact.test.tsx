import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GcmImpact } from "./gcm-impact";

vi.mock("./gcm-impact-ink", () => ({
  GcmImpactInk: () => <canvas data-ink-trail aria-hidden="true" />,
}));

let reduced: MediaQueryList;
let finePointer: MediaQueryList;
let observers: { callback: IntersectionObserverCallback; observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[];

beforeEach(() => {
  reduced = Object.assign(new EventTarget(), { matches: false }) as MediaQueryList;
  finePointer = Object.assign(new EventTarget(), { matches: true }) as MediaQueryList;
  observers = [];
  vi.stubGlobal("matchMedia", vi.fn(query => query.includes("reduced-motion") ? reduced : finePointer));
  vi.stubGlobal("ResizeObserver", class {});
  vi.stubGlobal("IntersectionObserver", class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor(public callback: IntersectionObserverCallback) { observers.push(this); }
  });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setup() {
  const rendered = render(<GcmImpact />);
  const track = rendered.container.querySelector("[data-gcm-impact-ink]")!;
  const observer = observers.find(item => item.observe.mock.calls.some(([element]) => element === track))!;
  const intersect = (visible: boolean) => act(() => observer.callback([
    { target: track, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 } as IntersectionObserverEntry,
  ], observer as unknown as IntersectionObserver));
  return { ...rendered, track, observer, intersect, ink: () => rendered.container.querySelector("[data-ink-trail]") };
}

describe("GCM Impact ink", () => {
  it("mounts the established pointer ink only while Impact is visible, preserving all readable outcomes", () => {
    const view = setup();
    expect(view.ink()).toBeNull();
    expect(view.container.querySelectorAll("dt")).toHaveLength(6);
    expect(view.container.querySelectorAll("dd")).toHaveLength(6);
    view.intersect(true);
    expect(view.ink()?.getAttribute("aria-hidden")).toBe("true");
    expect(view.container.querySelectorAll("button, [tabindex]")).toHaveLength(0);
    view.intersect(false);
    expect(view.ink()).toBeNull();
  });

  it("disposes ink when motion is reduced or the pointer changes to touch", () => {
    const view = setup();
    view.intersect(true);
    act(() => { Object.assign(reduced, { matches: true }); reduced.dispatchEvent(new Event("change")); });
    expect(view.ink()).toBeNull();
    act(() => { Object.assign(reduced, { matches: false }); reduced.dispatchEvent(new Event("change")); });
    expect(view.ink()).not.toBeNull();
    act(() => { Object.assign(finePointer, { matches: false }); finePointer.dispatchEvent(new Event("change")); });
    expect(view.ink()).toBeNull();
  });

  it("stops ink in a hidden document and during print, then restores only when visible", () => {
    const view = setup();
    view.intersect(true);
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(view.ink()).toBeNull();
    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(view.ink()).not.toBeNull();
    act(() => window.dispatchEvent(new Event("beforeprint")));
    expect(view.ink()).toBeNull();
    act(() => window.dispatchEvent(new Event("afterprint")));
    expect(view.ink()).not.toBeNull();
    view.unmount();
    expect(view.observer.disconnect).toHaveBeenCalledOnce();
  });

  it("retains a static, complete Impact when browser observation is unavailable", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const { container } = render(<GcmImpact />);
    expect(container.querySelector("[data-ink-trail]")).toBeNull();
    expect(container.querySelectorAll("dd")).toHaveLength(6);
  });
});
