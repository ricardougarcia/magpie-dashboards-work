import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GcmContentSheet } from "./gcm-content-sheet";
import { GcmEvidence } from "./gcm-evidence";
import { GcmLedger } from "./gcm-ledger";

let reduced: MediaQueryList;
let frames: Map<number, FrameRequestCallback>;
let frameId: number;
let resizeCallback: ResizeObserverCallback;
let observer: ResizeObserver;
let geometry: { navHeight: number; reliabilityHeight: number; productHeight: number };
const sheetTop = 500;
const originalFonts = Object.getOwnPropertyDescriptor(document, "fonts");

function flushFrame() {
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach(callback => callback(0)));
}

function scrollTo(position: number) {
  vi.stubGlobal("scrollY", position);
  fireEvent.scroll(window);
  flushFrame();
}

function resize() {
  act(() => resizeCallback([], observer));
  flushFrame();
}

function travel(section: HTMLElement) {
  return Number.parseFloat(section.style.getPropertyValue("--gcm-stage-travel")) || 0;
}

function fixture() {
  const result = render(<main>
    <header data-gcm-arrival><h1>Trustworthy answers</h1></header>
    <GcmContentSheet>
      <nav data-gcm-section-nav><a href="#reliability">01 / Reliability</a><a href="#product-work">02 / Product work</a></nav>
      <article data-gcm-reading-content><GcmLedger /><GcmEvidence /><section id="impact">Impact</section></article>
    </GcmContentSheet>
  </main>);
  const reliability = result.container.querySelector<HTMLElement>("#reliability")!;
  const product = result.container.querySelector<HTMLElement>("#product-work")!;
  const article = result.container.querySelector<HTMLElement>("[data-gcm-reading-content]")!;
  return {
    ...result, reliability, product, article,
    start: (section: HTMLElement) => section.getBoundingClientRect().top + window.scrollY - Number.parseFloat(section.style.getPropertyValue("--gcm-stage-top")),
    selected: () => [...reliability.querySelectorAll("button")].findIndex(button => button.getAttribute("aria-pressed") === "true"),
    productSelected: () => product.querySelector("[data-gcm-evidence]")?.getAttribute("data-gcm-evidence"),
    fadeViewportY: () => Number.parseFloat(article.style.getPropertyValue("--gcm-fade-y")) + sheetTop + geometry.navHeight - window.scrollY,
  };
}

beforeEach(() => {
  frameId = 0;
  frames = new Map();
  geometry = { navHeight: 60, reliabilityHeight: 560, productHeight: 600 };
  reduced = Object.assign(new EventTarget(), { matches: false }) as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => reduced));
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("innerHeight", 900);
  vi.stubGlobal("visualViewport", undefined);
  vi.stubGlobal("requestAnimationFrame", vi.fn(callback => { frames.set(++frameId, callback); return frameId; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn(id => frames.delete(id)));
  vi.stubGlobal("ResizeObserver", class {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(callback: ResizeObserverCallback) { resizeCallback = callback; observer = this as unknown as ResizeObserver; }
  });
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(window, "scrollTo").mockImplementation((options: ScrollToOptions | number) => {
    vi.stubGlobal("scrollY", typeof options === "number" ? options : options.top ?? window.scrollY);
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const reliability = document.getElementById("reliability");
    const product = document.getElementById("product-work");
    const reliabilityTravel = reliability?.dataset.gcmPinned === "true" ? travel(reliability) : 0;
    const productTravel = product?.dataset.gcmPinned === "true" ? travel(product) : 0;
    const articleTop = sheetTop + geometry.navHeight;
    const productTop = articleTop + geometry.reliabilityHeight + reliabilityTravel;
    const articleHeight = geometry.reliabilityHeight + reliabilityTravel + geometry.productHeight + productTravel + 1000;
    if (this.hasAttribute("data-gcm-arrival")) throw new Error("Do not measure the transformed intro.");
    if (this.hasAttribute("data-gcm-section-nav")) return new DOMRect(24, Math.max(0, sheetTop - window.scrollY), 1200, geometry.navHeight);
    if (this.hasAttribute("data-gcm-content-sheet")) return new DOMRect(24, sheetTop - window.scrollY, 1200, geometry.navHeight + articleHeight);
    if (this.hasAttribute("data-gcm-reading-content")) return new DOMRect(24, articleTop - window.scrollY, 1200, articleHeight);
    if (this.id === "reliability") return new DOMRect(24, articleTop - window.scrollY, 1200, geometry.reliabilityHeight + reliabilityTravel);
    if (this.id === "product-work") return new DOMRect(24, productTop - window.scrollY, 1200, geometry.productHeight + productTravel);
    if (this.hasAttribute("data-gcm-reading-stage")) {
      const isReliability = this.parentElement?.id === "reliability";
      const parent = isReliability ? reliability : product;
      const top = isReliability ? articleTop : productTop;
      const height = isReliability ? geometry.reliabilityHeight : geometry.productHeight;
      const runway = isReliability ? reliabilityTravel : productTravel;
      const stickyTop = Number.parseFloat(parent?.style.getPropertyValue("--gcm-stage-top") ?? "") || 0;
      const viewportTop = runway ? Math.min(Math.max(top - window.scrollY, stickyTop), top + runway - window.scrollY) : top - window.scrollY;
      return new DOMRect(24, viewportTop, 1200, height);
    }
    return new DOMRect(24, 0, 1200, 0);
  });
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready: new Promise<void>(() => {}) } });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalFonts) Object.defineProperty(document, "fonts", originalFonts);
  else Reflect.deleteProperty(document, "fonts");
});

describe("GCM reading pace", () => {
  it("holds all six reliability requirements below the nav, including a final reading interval, and reverses naturally", () => {
    const view = fixture();
    const start = view.start(view.reliability), runway = travel(view.reliability);
    expect(view.reliability.dataset.gcmPinned).toBe("true");
    expect(Number.parseFloat(view.reliability.style.getPropertyValue("--gcm-stage-top"))).toBeGreaterThan(geometry.navHeight);
    for (let index = 0; index < 6; index++) {
      scrollTo(start + runway * (index + .1) / 6);
      expect(view.selected()).toBe(index);
      expect(view.reliability.dataset.gcmHolding).toBe("true");
      expect(view.fadeViewportY() + 176).toBeLessThanOrEqual(geometry.navHeight);
    }
    scrollTo(start + runway - 1);
    expect(view.selected()).toBe(5);
    expect(view.reliability.dataset.gcmHolding).toBe("true");
    scrollTo(start + runway + 1);
    expect(view.reliability.dataset.gcmHolding).toBe("false");
    expect(view.selected()).toBe(5);
    for (let index = 5; index >= 0; index--) {
      scrollTo(start + runway * (index + .1) / 6);
      expect(view.selected()).toBe(index);
    }
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("returns the varied fade continuously after the final item, without fading the grid layer", () => {
    const view = fixture();
    const end = view.start(view.reliability) + travel(view.reliability);
    scrollTo(end);
    const held = view.fadeViewportY();
    scrollTo(end + 1);
    expect(view.fadeViewportY() - held).toBeCloseTo(1);
    scrollTo(end + 88);
    expect(view.fadeViewportY()).toBeCloseTo(geometry.navHeight - 88);
    scrollTo(end + 177);
    expect(view.fadeViewportY()).toBe(geometry.navHeight);
    const sheet = view.container.querySelector<HTMLElement>("[data-gcm-content-sheet]")!;
    expect(sheet.style.getPropertyValue("--gcm-fade-y")).toBe("");
  });

  it("preserves every manually selected Product Work panel during its single hold and subsequent scrolling", () => {
    const view = fixture();
    const start = view.start(view.product), runway = travel(view.product);
    expect(view.product.dataset.gcmPinned).toBe("true");
    for (const label of ["Data", "Integration", "Evaluation", "Demo"]) {
      fireEvent.click(within(view.product).getByRole("button", { name: new RegExp(` / ${label}$`) }));
      for (const progress of [0, .2, .6, .99, 1.1, .5]) {
        scrollTo(start + runway * progress);
        expect(view.productSelected()).toBe(label.toLowerCase());
      }
    }
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it("lands explicit reliability choices at their own interval and resumes chronological progression", () => {
    const view = fixture();
    const start = view.start(view.reliability), runway = travel(view.reliability);
    scrollTo(start + 10);
    const choice = within(view.reliability).getByRole("button", { name: /Summarize results faithfully/ });
    fireEvent.click(choice);
    flushFrame();
    expect(view.selected()).toBe(3);
    expect(window.scrollY).toBeCloseTo(start + runway * .5);
    fireEvent.scroll(window);
    flushFrame();
    expect(view.selected()).toBe(3);
    scrollTo(start + runway * 4.1 / 6);
    expect(view.selected()).toBe(4);
    const first = within(view.reliability).getByRole("button", { name: /Select the correct tool/ });
    act(() => first.focus());
    flushFrame();
    expect(view.selected()).toBe(0);
    expect(document.activeElement).toBe(first);
    expect(window.scrollY).toBe(start);
  });

  it("ignores incidental hover while scroll is holding the reliability section", () => {
    const view = fixture();
    scrollTo(view.start(view.reliability) + travel(view.reliability) * .36);
    const event = new MouseEvent("pointerover", { bubbles: true });
    Object.assign(event, { pointerType: "mouse" });
    fireEvent(within(view.reliability).getByRole("button", { name: /Surface tool limitations/ }), event);
    expect(view.selected()).toBe(2);
  });

  it("uses actual restored scroll position for direct entry, without replaying earlier requirements", () => {
    // A restored document position is beyond the initial fifth-item boundary.
    vi.stubGlobal("scrollY", 1800);
    const view = fixture();
    expect(view.selected()).toBe(4);
    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  it.each(["reduced", "short", "visual viewport"])("keeps content naturally readable for %s layouts", mode => {
    if (mode === "reduced") Object.assign(reduced, { matches: true });
    if (mode === "short") vi.stubGlobal("innerHeight", 600);
    if (mode === "visual viewport") vi.stubGlobal("visualViewport", Object.assign(new EventTarget(), { height: 600 }));
    const view = fixture();
    expect(view.reliability.dataset.gcmPinned).toBe("false");
    expect(view.product.dataset.gcmPinned).toBe("false");
    fireEvent.click(within(view.reliability).getByRole("button", { name: /Maintain session context/ }));
    scrollTo(800);
    expect(view.selected()).toBe(4);
    expect(window.scrollTo).not.toHaveBeenCalled();
    if (mode === "reduced") expect(view.article.style.getPropertyValue("--gcm-fade-y")).toBe("");
  });

  it("preserves the reading fraction when a resize changes the fitting runway", () => {
    const view = fixture();
    scrollTo(view.start(view.reliability) + travel(view.reliability) * .58);
    expect(view.selected()).toBe(3);
    vi.stubGlobal("innerHeight", 1000);
    resize();
    expect(window.scrollY).toBeCloseTo(view.start(view.reliability) + travel(view.reliability) * .58);
    expect(view.selected()).toBe(3);
  });

  it("preserves later article position when an earlier runway is removed", () => {
    const view = fixture();
    const previousTravel = travel(view.reliability);
    const before = view.start(view.product) + travel(view.product) + 220;
    scrollTo(before);
    geometry.reliabilityHeight = 850;
    resize();
    expect(view.reliability.dataset.gcmPinned).toBe("false");
    expect(window.scrollY).toBeCloseTo(before - previousTravel);
  });

  it("returns to the current section when an expanded panel no longer fits", () => {
    const view = fixture();
    scrollTo(view.start(view.product) + travel(view.product) * .5);
    const summary = within(view.product).getByText("Read the demonstration overview");
    fireEvent.click(summary);
    geometry.productHeight = 950;
    resize();
    expect(view.product.dataset.gcmPinned).toBe("false");
    expect(window.scrollY).toBeCloseTo(view.start(view.product));
    expect(summary.closest("details")?.open).toBe(true);
    expect(view.productSelected()).toBe("demo");
  });

  it("does not skip the current natural section when motion is enabled while reading it", () => {
    Object.assign(reduced, { matches: true });
    const view = fixture();
    scrollTo(view.start(view.reliability) + 180);
    act(() => { Object.assign(reduced, { matches: false }); reduced.dispatchEvent(new Event("change")); });
    expect(view.reliability.dataset.gcmHolding).toBe("true");
    expect(view.selected()).toBe(0);
    expect(window.scrollY).toBeLessThan(view.start(view.reliability) + travel(view.reliability) / 6);
  });

  it("restores the same requirement and reading position after print collapses and clamps the document", () => {
    const view = fixture();
    const before = view.start(view.reliability) + travel(view.reliability) * .93;
    scrollTo(before);
    expect(view.selected()).toBe(5);
    const beforeFade = view.article.style.getPropertyValue("--gcm-fade-y");
    fireEvent(window, new Event("beforeprint"));
    expect(view.reliability.dataset.gcmPinned).toBe("false");
    expect(view.product.dataset.gcmPinned).toBe("false");
    expect(view.article.style.getPropertyValue("--gcm-fade-y")).toBe("");
    // Simulate the browser clamping scrollY when the shorter print layout
    // replaces a document containing both reading runways.
    vi.stubGlobal("scrollY", 700);
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    fireEvent(window, new Event("afterprint"));
    flushFrame();
    expect(view.reliability.dataset.gcmPinned).toBe("true");
    expect(view.product.dataset.gcmPinned).toBe("true");
    expect(window.scrollY).toBeCloseTo(before);
    expect(view.selected()).toBe(5);
    expect(view.article.style.getPropertyValue("--gcm-fade-y")).toBe(beforeFade);
    scrollTo(view.start(view.reliability) + travel(view.reliability) * .55);
    expect(view.selected()).toBe(3);
  });

  it("coalesces native scroll without reading layout and removes pending work on unmount", () => {
    const view = fixture();
    const start = view.start(view.reliability), runway = travel(view.reliability);
    const bounds = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
    bounds.mockClear();
    vi.stubGlobal("scrollY", start + 20);
    fireEvent.scroll(window);
    vi.stubGlobal("scrollY", start + runway * .6);
    fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    flushFrame();
    expect(view.selected()).toBe(3);
    expect(bounds).not.toHaveBeenCalled();
    fireEvent.resize(window);
    view.unmount();
    expect(frames.size).toBe(0);
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(view.reliability.dataset.gcmPinned).toBeUndefined();
    expect(view.reliability.style.getPropertyValue("--gcm-stage-travel")).toBe("");
  });
});
