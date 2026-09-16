import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GcmHero } from "./gcm-hero";
import { GcmImpact } from "./gcm-impact";

let reduced: MediaQueryList;
let now = 0;
let arrivalElapsed = 0;
let frameId = 0;
let frames: Map<number, FrameRequestCallback>;
let intersect: IntersectionObserverCallback;
let observer: IntersectionObserver;
let animations: { cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null }[];
let animate: ReturnType<typeof vi.fn>;

function advanceFrame(time: number) {
  now = time;
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach(callback => callback(time)));
}

beforeEach(() => {
  vi.useFakeTimers();
  now = 0;
  arrivalElapsed = 0;
  frameId = 0;
  frames = new Map();
  animations = [];
  reduced = Object.assign(new EventTarget(), { matches: false }) as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => reduced));
  vi.stubGlobal("requestAnimationFrame", vi.fn(callback => { frames.set(++frameId, callback); return frameId; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn(id => frames.delete(id)));
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 80, 1200, 400));
  vi.stubGlobal("scrollY", 0);
  window.history.replaceState({}, "", "/work/gcm");
  vi.stubGlobal("IntersectionObserver", class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    constructor(callback: IntersectionObserverCallback) { intersect = callback; observer = this as unknown as IntersectionObserver; }
  });
  animate = vi.fn(() => {
    const animation = { cancel: vi.fn(), onfinish: null };
    animations.push(animation);
    return animation as unknown as Animation;
  });
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: animate });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [{ currentTime: arrivalElapsed }] });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Reflect.deleteProperty(HTMLElement.prototype, "animate");
  Reflect.deleteProperty(HTMLElement.prototype, "getAnimations");
  window.history.replaceState({}, "", "/");
});

describe("GCM opening", () => {
  it("server-renders the exact question and stable final value with a no-script fallback", () => {
    const html = renderToString(<GcmHero />);
    const dom = document.createElement("div");
    dom.innerHTML = html;
    expect(dom.querySelector("h1")?.textContent).toBe("What makes an AI answerworth trusting?");
    expect(dom.querySelector("strong > span:not([aria-hidden])")?.textContent).toBe("97%");
    expect(dom.querySelector("[data-gcm-counter]")?.getAttribute("aria-hidden")).toBe("true");
    expect(html).toContain("noscript");
    expect(html).toContain("animation:none!important");
  });

  it("counts after the opening beat without ending the longer trust fade, keeping the accessible value stable", () => {
    const { container } = render(<GcmHero />);
    const count = container.querySelector("[data-gcm-counter]")!;
    const final = container.querySelector("strong > span:not([aria-hidden])")!;
    act(() => vi.advanceTimersByTime(1099));
    expect(count.textContent).toBe("0%");
    expect(frames.size).toBe(0);
    act(() => vi.advanceTimersByTime(1));
    advanceFrame(1100);
    advanceFrame(1750);
    expect(Number(count.textContent?.replace("%", ""))).toBeGreaterThan(0);
    expect(Number(count.textContent?.replace("%", ""))).toBeLessThan(97);
    expect(final.textContent).toBe("97%");
    expect(container.querySelector("[aria-live]")).toBeNull();
    advanceFrame(2400);
    expect(count.textContent).toBe("97%");
    expect(container.querySelector("header")?.getAttribute("data-count-settled")).toBe("true");
    expect(container.querySelector("header")?.hasAttribute("data-arrival-settled")).toBe(false);
    expect(frames.size).toBe(0);
  });

  it.each(["reduced", "anchor", "restored", "offscreen"])("shows the final state immediately for %s visits", kind => {
    if (kind === "reduced") Object.assign(reduced, { matches: true });
    if (kind === "anchor") window.history.replaceState({}, "", "/work/gcm#product-work");
    if (kind === "restored") vi.stubGlobal("scrollY", 600);
    if (kind === "offscreen") vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockReturnValue(new DOMRect(0, -600, 1200, 400));
    const { container } = render(<GcmHero />);
    expect(container.querySelector("header")?.getAttribute("data-arrival-settled")).toBe("true");
    expect(container.querySelector("[data-gcm-counter]")?.textContent).toBe("97%");
    expect(vi.getTimerCount()).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("settles an active count immediately when reduced motion is requested", () => {
    const { container } = render(<GcmHero />);
    act(() => vi.advanceTimersByTime(1100));
    advanceFrame(1550);
    act(() => { Object.assign(reduced, { matches: true }); reduced.dispatchEvent(new Event("change")); });
    expect(container.querySelector("[data-gcm-counter]")?.textContent).toBe("97%");
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("can still settle the longer trust fade after the count has completed", () => {
    const { container } = render(<GcmHero />);
    act(() => vi.advanceTimersByTime(1100));
    advanceFrame(2400);
    const header = container.querySelector("header")!;
    expect(header.getAttribute("data-count-settled")).toBe("true");
    expect(header.hasAttribute("data-arrival-settled")).toBe(false);
    act(() => { Object.assign(reduced, { matches: true }); reduced.dispatchEvent(new Event("change")); });
    expect(header.getAttribute("data-arrival-settled")).toBe("true");
    expect(frames.size).toBe(0);
  });

  it("late hydration restores the finished count without truncating trust and retains cancellation", () => {
    arrivalElapsed = 2600;
    const { container } = render(<GcmHero />);
    const header = container.querySelector("header")!;
    expect(header.getAttribute("data-count-settled")).toBe("true");
    expect(header.hasAttribute("data-arrival-settled")).toBe(false);
    expect(container.querySelector("[data-gcm-counter]")?.textContent).toBe("97%");
    expect(frames.size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    act(() => { Object.assign(reduced, { matches: true }); reduced.dispatchEvent(new Event("change")); });
    expect(header.getAttribute("data-arrival-settled")).toBe("true");
  });

  it("cancels the delay and active frame when unmounted", () => {
    const delayed = render(<GcmHero />);
    delayed.unmount();
    expect(vi.getTimerCount()).toBe(0);
    const running = render(<GcmHero />);
    act(() => vi.advanceTimersByTime(1100));
    expect(frames.size).toBe(1);
    running.unmount();
    expect(frames.size).toBe(0);
  });
});

describe("GCM impact arrival", () => {
  it("keeps all six outcomes readable in server-rendered HTML", () => {
    const dom = document.createElement("div");
    dom.innerHTML = renderToString(<GcmImpact />);
    expect(dom.querySelectorAll("dl > div")).toHaveLength(6);
    expect(dom.querySelectorAll("[hidden], [aria-hidden=true], [style*='opacity:0']")).toHaveLength(0);
    expect(dom.querySelectorAll("dd")).toHaveLength(6);
  });

  it("reveals visible outcomes once and leaves offscreen outcomes untouched", () => {
    const { container } = render(<GcmImpact />);
    const items = [...container.querySelectorAll("dl > div")];
    const entries = items.map((target, index) => ({ target, isIntersecting: index < 3, intersectionRatio: index < 3 ? 1 : 0 } as IntersectionObserverEntry));
    act(() => intersect(entries, observer));
    expect(animate).toHaveBeenCalledTimes(3);
    expect(animate.mock.calls.map(call => call[1].delay)).toEqual([0, 65, 130]);
    act(() => intersect(entries, observer));
    expect(animate).toHaveBeenCalledTimes(3);
    act(() => intersect(items.slice(3).map(target => ({ target, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry)), observer));
    expect(animate).toHaveBeenCalledTimes(6);
  });

  it("cancels active arrivals when motion preferences change, with no later replay", () => {
    const { container, unmount } = render(<GcmImpact />);
    const target = container.querySelector("dl > div")!;
    act(() => intersect([{ target, isIntersecting: true, intersectionRatio: 1 } as IntersectionObserverEntry], observer));
    act(() => { Object.assign(reduced, { matches: true }); reduced.dispatchEvent(new Event("change")); });
    expect(animations[0].cancel).toHaveBeenCalledOnce();
    expect(observer.disconnect).toHaveBeenCalled();
    unmount();
    expect(animations[0].cancel).toHaveBeenCalledOnce();
  });

  it("does not observe or animate when reduced motion is already enabled", () => {
    Object.assign(reduced, { matches: true });
    const { container } = render(<GcmImpact />);
    expect(animate).not.toHaveBeenCalled();
    expect(container.querySelectorAll("dd")).toHaveLength(6);
  });
});
