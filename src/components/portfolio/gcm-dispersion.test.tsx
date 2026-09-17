import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GcmDispersion } from "./gcm-dispersion";
import { dispersionPoints, dispersionPosition } from "./gcm-dispersion-geometry";
import { PortfolioLink } from "./portfolio-link";

let preference: MediaQueryList;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let now: number;
let hidden: boolean;
let fieldWidth: number;
let resize: ResizeObserverCallback;
let intersect: IntersectionObserverCallback;
let resizeObserver: ResizeObserver;
let intersectionObserver: IntersectionObserver;

function advance(milliseconds: number) {
  const end = now + milliseconds;
  while (now < end) {
    now = Math.min(end, now + 16);
    const pending = [...frames.values()];
    frames.clear();
    act(() => pending.forEach(callback => callback(now)));
  }
}

function pointer(element: Element, type: "pointerenter" | "pointerleave", pointerType = "mouse") {
  const event = new Event(type, { bubbles: false });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  act(() => element.dispatchEvent(event));
}

function keyboardFocus(element: HTMLElement) {
  fireEvent.keyDown(document, { key: "Tab" });
  // JSDOM caches :focus-visible incorrectly after getComputedStyle; model keyboard modality.
  const matches = element.matches.bind(element);
  const keyboard = vi.spyOn(element, "matches").mockImplementation(selector => selector === ":focus-visible" || matches(selector));
  act(() => element.focus());
  keyboard.mockRestore();
}

function setReducedMotion(matches: boolean) {
  act(() => {
    Object.assign(preference, { matches });
    preference.dispatchEvent(new Event("change"));
  });
}

function setVisible(isIntersecting: boolean) {
  act(() => intersect([{ isIntersecting } as IntersectionObserverEntry], intersectionObserver));
}

function setHidden(value: boolean) {
  hidden = value;
  fireEvent(document, new Event("visibilitychange"));
}

function value(field: HTMLElement, name: string) {
  return Number.parseFloat(field.style.getPropertyValue(`--gcm-${name}`));
}

function scene() {
  const result = render(<>
    <article data-gcm-entry="gcm" aria-label="GCM project">
      <h2><PortfolioLink href="/work/gcm">GCM</PortfolioLink></h2>
      <GcmDispersion />
      <PortfolioLink href="/work/gcm">View project</PortfolioLink>
    </article>
    <button>Next project</button>
  </>);
  return {
    ...result,
    article: result.getByRole("article"),
    field: result.container.querySelector<HTMLElement>("[data-gcm-dispersion]")!,
    canvas: result.container.querySelector("canvas")!,
    title: result.getByRole("link", { name: "GCM" }),
    footer: result.getByRole("link", { name: "View project" }),
    trigger: result.getByRole("button", { name: /animate GCM dispersion and reveal Bayes’ theorem/i }),
    tooltip: result.getByRole("tooltip", { hidden: true }),
    outside: result.getByRole("button", { name: "Next project" }),
  };
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  now = 100;
  hidden = false;
  fieldWidth = 600;
  preference = Object.assign(new EventTarget(), { matches: false }) as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => preference));
  vi.stubGlobal("devicePixelRatio", 1);
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 0, fieldWidth, 310));
  const context = { clearRect() {}, beginPath() {}, moveTo() {}, arc() {}, fill() {}, setTransform() {}, fillStyle: "", globalAlpha: 1 };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.stubGlobal("ResizeObserver", class {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(callback: ResizeObserverCallback) {
      resize = callback;
      resizeObserver = this as unknown as ResizeObserver;
    }
  });
  vi.stubGlobal("IntersectionObserver", class {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(callback: IntersectionObserverCallback) {
      intersect = callback;
      intersectionObserver = this as unknown as IntersectionObserver;
    }
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("GCM Board dispersion", () => {
  it("activates from the whole article and continues across children without restarting", () => {
    const { article, field, title, footer } = scene();
    expect(value(field, "convergence")).toBe(0);
    expect(frames.size).toBe(0);
    pointer(article, "pointerenter");
    advance(1200);
    const progress = value(field, "convergence");
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1);
    pointer(title, "pointerleave");
    pointer(footer, "pointerenter");
    expect(article.dataset.gcmMotionActive).toBe("true");
    expect(value(field, "convergence")).toBe(progress);
    advance(300);
    expect(value(field, "convergence")).toBeGreaterThan(progress);
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(article.dataset.gcmMotionActive).toBe("false");
    advance(800);
    expect(value(field, "convergence")).toBe(0);
    pointer(article, "pointerleave");
    pointer(article, "pointerenter");
    expect(article.dataset.gcmMotionActive).toBe("true");
  });

  it("converges into the endpoint before revealing the red mark and formula, then holds without more frames", () => {
    const { article, field, trigger, tooltip } = scene();
    pointer(article, "pointerenter");
    advance(16); // Establish the first animation timestamp.
    advance(2300);
    expect(value(field, "arrival-opacity")).toBeGreaterThan(0);
    expect(value(field, "red-opacity")).toBe(0);
    expect(tooltip.getAttribute("aria-hidden")).toBe("true");
    advance(210);
    expect(value(field, "red-opacity")).toBeGreaterThan(0);
    expect(value(field, "formula-opacity")).toBe(0);
    advance(306); // Allow one display frame beyond the 2.8-second sequence.
    expect(value(field, "convergence")).toBe(1);
    expect(value(field, "scatter-opacity")).toBe(0);
    expect(value(field, "arrival-opacity")).toBe(1);
    expect(value(field, "red-opacity")).toBe(1);
    expect(value(field, "formula-opacity")).toBe(1);
    expect(field.style.getPropertyValue("--gcm-formula-offset")).toBe("0px");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(trigger.getAttribute("aria-describedby")).toBe(tooltip.id);
    expect(tooltip.getAttribute("aria-hidden")).toBe("false");
    expect(tooltip.textContent).toContain("where P of B is greater than zero");
    expect(frames.size).toBe(0);
    const settled = field.getAttribute("style");
    advance(1000);
    expect(field.getAttribute("style")).toBe(settled);
    for (const point of dispersionPoints) {
      const end = dispersionPosition(point, 1);
      expect(end.x).toBeCloseTo(.5);
      expect(end.y).toBeCloseTo(.58);
    }
  });

  it("reverses on exit and continues from the current position on reentry", () => {
    const { article, field, tooltip } = scene();
    pointer(article, "pointerenter");
    advance(1300);
    const progress = value(field, "convergence");
    pointer(article, "pointerleave");
    expect(value(field, "convergence")).toBe(progress);
    advance(160);
    const reversing = value(field, "convergence");
    expect(reversing).toBeGreaterThan(0);
    expect(reversing).toBeLessThan(progress);
    pointer(article, "pointerenter");
    expect(value(field, "convergence")).toBe(reversing);
    advance(160);
    expect(value(field, "convergence")).toBeGreaterThan(reversing);
    pointer(article, "pointerleave");
    advance(800);
    expect(value(field, "convergence")).toBe(0);
    expect(tooltip.getAttribute("aria-hidden")).toBe("true");
    expect(frames.size).toBe(0);
  });

  it("supports keyboard focus and keeps Escape dismissal until focus freshly enters the article", () => {
    const { article, field, title, trigger, footer, outside } = scene();
    keyboardFocus(title);
    advance(700);
    const progress = value(field, "convergence");
    expect(progress).toBeGreaterThan(0);
    keyboardFocus(trigger);
    expect(value(field, "convergence")).toBe(progress);
    expect(article.dataset.gcmMotionActive).toBe("true");
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(article.dataset.gcmMotionActive).toBe("false");
    advance(800);
    keyboardFocus(footer);
    advance(200);
    expect(value(field, "convergence")).toBe(0);
    expect(frames.size).toBe(0);
    keyboardFocus(outside);
    keyboardFocus(title);
    expect(article.dataset.gcmMotionActive).toBe("true");
    advance(300);
    expect(value(field, "convergence")).toBeGreaterThan(0);
    expect(document.activeElement).toBe(title);
  });

  it("ignores touch hover, starts on the explicit button, and preserves ordinary project links", () => {
    const { article, field, title, trigger, outside } = scene();
    pointer(article, "pointerenter", "touch");
    advance(1000);
    expect(value(field, "convergence")).toBe(0);
    expect(frames.size).toBe(0);
    let linkWasCanceled = true;
    document.addEventListener("click", event => {
      linkWasCanceled = event.defaultPrevented;
      event.preventDefault(); // Observe the native link without asking JSDOM to navigate.
    }, { once: true });
    fireEvent.click(title);
    expect(linkWasCanceled).toBe(false);
    expect(title.getAttribute("href")).toBe("/work/gcm");
    expect(frames.size).toBe(0);
    fireEvent.click(trigger);
    pointer(article, "pointerleave", "touch");
    advance(3000);
    expect(article.dataset.gcmMotionActive).toBe("true");
    expect(value(field, "formula-opacity")).toBe(1);
    fireEvent.pointerDown(outside);
    expect(article.dataset.gcmMotionActive).toBe("false");
    advance(800);
    expect(value(field, "convergence")).toBe(0);
  });

  it("switches immediately to static endpoints when reduced motion changes during playback", () => {
    const { article, field, tooltip } = scene();
    pointer(article, "pointerenter");
    advance(700);
    expect(frames.size).toBe(1);
    setReducedMotion(true);
    expect(frames.size).toBe(0);
    expect(value(field, "convergence")).toBe(1);
    expect(value(field, "red-opacity")).toBe(1);
    expect(tooltip.getAttribute("aria-hidden")).toBe("false");
    pointer(article, "pointerleave");
    expect(value(field, "convergence")).toBe(0);
    pointer(article, "pointerenter");
    expect(value(field, "convergence")).toBe(1);
    expect(frames.size).toBe(0);
    setReducedMotion(false);
    pointer(article, "pointerleave");
    advance(100);
    expect(value(field, "convergence")).toBeGreaterThan(0);
    expect(value(field, "convergence")).toBeLessThan(1);
    setReducedMotion(true);
    expect(value(field, "convergence")).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("clears offscreen motion, pauses in a hidden tab, and resizes without restarting the sequence", () => {
    const { article, field, canvas } = scene();
    pointer(article, "pointerenter");
    advance(600);
    expect(value(field, "convergence")).toBeGreaterThan(0);
    setVisible(false);
    expect(frames.size).toBe(0);
    expect(value(field, "convergence")).toBe(0);
    expect(article.dataset.gcmMotionActive).toBe("false");
    setVisible(true);
    expect(frames.size).toBe(0);
    pointer(article, "pointerenter");
    advance(400);
    const progress = value(field, "convergence");
    setHidden(true);
    expect(frames.size).toBe(0);
    advance(10000);
    expect(value(field, "convergence")).toBe(progress);
    setHidden(false);
    expect(frames.size).toBe(1);
    advance(100);
    expect(value(field, "convergence")).toBeGreaterThan(progress);
    const beforeResize = value(field, "convergence");
    expect(canvas.width).toBe(600);
    fieldWidth = 390;
    act(() => resize([], resizeObserver));
    expect(canvas.width).toBe(390);
    expect(value(field, "convergence")).toBe(beforeResize);
  });

  it("cancels frames and detaches its observers and listeners when unmounted", () => {
    const { article, field, trigger, unmount } = scene();
    pointer(article, "pointerenter");
    advance(300);
    expect(frames.size).toBe(1);
    const current = field.getAttribute("style");
    unmount();
    expect(frames.size).toBe(0);
    expect(resizeObserver.disconnect).toHaveBeenCalledOnce();
    expect(intersectionObserver.disconnect).toHaveBeenCalledOnce();
    expect(article.dataset.gcmMotionActive).toBeUndefined();
    pointer(article, "pointerleave");
    pointer(article, "pointerenter");
    fireEvent.click(trigger);
    fireEvent.keyDown(article, { key: "Escape" });
    setReducedMotion(true);
    setHidden(true);
    setHidden(false);
    fireEvent.resize(window);
    advance(1000);
    expect(frames.size).toBe(0);
    expect(field.getAttribute("style")).toBe(current);
  });
});
