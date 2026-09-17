import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MarketplaceBoardMotion } from "./marketplace-board-motion";
import { PortfolioLink } from "./portfolio-link";

let preference: MediaQueryList;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let now: number;

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

function setReducedMotion(matches: boolean) {
  act(() => {
    Object.assign(preference, { matches });
    preference.dispatchEvent(new Event("change"));
  });
}

function keyboardFocus(element: HTMLElement) {
  fireEvent.keyDown(document, { key: "Tab" });
  act(() => element.focus());
}

function value(element: HTMLElement, name: string) {
  return Number(element.style.getPropertyValue(`--marketplace-${name}`));
}

function scene() {
  const result = render(<>
    <MarketplaceBoardMotion aria-label="EdCo Marketplace">
      <h2><PortfolioLink href="/work/marketplace">EdCo Marketplace</PortfolioLink></h2>
      <PortfolioLink href="/work/marketplace">Explore the catalog</PortfolioLink>
    </MarketplaceBoardMotion>
    <button>Next work sample</button>
  </>);
  return {
    ...result,
    article: result.getByRole("article"),
    title: result.getByRole("link", { name: "EdCo Marketplace" }),
    catalog: result.getByRole("link", { name: "Explore the catalog" }),
    outside: result.getByRole("button", { name: "Next work sample" }),
  };
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  now = 100;
  preference = Object.assign(new EventTarget(), { matches: false }) as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => preference));
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
    frames.set(++nextFrame, callback);
    return nextFrame;
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Marketplace Board hover motion", () => {
  it("plays once across the whole sample without restarting when crossing child links", () => {
    const { article, title, catalog } = scene();
    pointer(article, "pointerenter");
    advance(350);
    const progress = value(article, "trace-offset");
    pointer(title, "pointerleave");
    pointer(catalog, "pointerenter");
    expect(article.dataset.marketplaceActive).toBe("true");
    expect(value(article, "trace-offset")).toBe(progress);
    advance(64);
    expect(value(article, "trace-offset")).toBeLessThan(progress);
    advance(1000);
    expect(frames.size).toBe(0);
    expect(value(article, "hover-opacity")).toBe(1);
    expect(value(article, "endpoint-opacity")).toBe(1);
    const settled = article.getAttribute("style");
    pointer(catalog, "pointerleave");
    pointer(title, "pointerenter");
    advance(1000);
    expect(frames.size).toBe(0);
    expect(article.getAttribute("style")).toBe(settled);
  });

  it("stays active while either the mouse or keyboard focus remains inside", () => {
    const { article, title, catalog, outside } = scene();
    pointer(article, "pointerenter");
    keyboardFocus(title);
    advance(300);
    keyboardFocus(outside);
    expect(article.dataset.marketplaceActive).toBe("true");
    keyboardFocus(title);
    pointer(article, "pointerleave");
    expect(article.dataset.marketplaceActive).toBe("true");
    keyboardFocus(catalog);
    advance(1000);
    expect(article.dataset.marketplaceActive).toBe("true");
    expect(value(article, "hover-opacity")).toBe(1);
    expect(document.activeElement).toBe(catalog);
    expect(catalog.getAttribute("href")).toBe("/work/marketplace");
    keyboardFocus(outside);
    expect(article.dataset.marketplaceActive).toBe("false");
    advance(400);
    expect(value(article, "hover-opacity")).toBe(0);
    expect(frames.size).toBe(0);
  });

  it("fades from the current position and resumes smoothly if the mouse returns during exit", () => {
    const { article } = scene();
    pointer(article, "pointerenter");
    advance(350);
    const sheets = [article.style.getPropertyValue("--marketplace-sheet-a"), article.style.getPropertyValue("--marketplace-sheet-b")];
    const progress = value(article, "trace-offset");
    pointer(article, "pointerleave");
    advance(64);
    const fadingOpacity = value(article, "hover-opacity");
    expect(fadingOpacity).toBeGreaterThan(0);
    expect(fadingOpacity).toBeLessThan(1);
    expect([article.style.getPropertyValue("--marketplace-sheet-a"), article.style.getPropertyValue("--marketplace-sheet-b")]).toEqual(sheets);
    expect(value(article, "trace-offset")).toBe(progress);
    pointer(article, "pointerenter");
    expect(value(article, "hover-opacity")).toBe(fadingOpacity);
    expect(value(article, "trace-offset")).toBe(progress);
    advance(64);
    expect(value(article, "hover-opacity")).toBeGreaterThan(fadingOpacity);
    expect(value(article, "trace-offset")).toBeLessThan(progress);
    advance(1000);
    expect(value(article, "endpoint-opacity")).toBe(1);
    expect(frames.size).toBe(0);
  });

  it("cancels motion immediately when the preference changes and can resume when motion is allowed", () => {
    const { article } = scene();
    pointer(article, "pointerenter");
    advance(300);
    expect(value(article, "hover-opacity")).toBeGreaterThan(0);
    expect(frames.size).toBe(1);
    setReducedMotion(true);
    expect(frames.size).toBe(0);
    expect(value(article, "hover-opacity")).toBe(0);
    expect(value(article, "endpoint-opacity")).toBe(0);
    const quiet = article.getAttribute("style");
    pointer(article, "pointerleave");
    pointer(article, "pointerenter");
    advance(1000);
    expect(article.dataset.marketplaceActive).toBe("true");
    expect(frames.size).toBe(0);
    expect(article.getAttribute("style")).toBe(quiet);
    setReducedMotion(false);
    expect(frames.size).toBe(1);
    advance(200);
    expect(value(article, "hover-opacity")).toBeGreaterThan(0);
  });

  it("ignores touch entry and leaves the project links intact", () => {
    const { article, catalog } = scene();
    pointer(article, "pointerenter", "touch");
    pointer(catalog, "pointerenter", "touch");
    advance(1000);
    expect(article.dataset.marketplaceActive).toBe("false");
    expect(value(article, "hover-opacity")).toBe(0);
    expect(frames.size).toBe(0);
    expect(catalog.getAttribute("href")).toBe("/work/marketplace");
    pointer(article, "pointerleave", "touch");
    expect(frames.size).toBe(0);
  });

  it("cancels a pending frame and removes input and preference listeners on unmount", () => {
    const { article, unmount } = scene();
    pointer(article, "pointerenter");
    advance(80);
    expect(frames.size).toBe(1);
    const current = article.getAttribute("style");
    unmount();
    expect(frames.size).toBe(0);
    pointer(article, "pointerleave");
    pointer(article, "pointerenter");
    setReducedMotion(true);
    setReducedMotion(false);
    advance(1000);
    expect(frames.size).toBe(0);
    expect(article.getAttribute("style")).toBe(current);
  });
});
