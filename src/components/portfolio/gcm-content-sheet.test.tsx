import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GcmContentSheet } from "./gcm-content-sheet";

let reduced: MediaQueryList;
let frames: Map<number, FrameRequestCallback>;
let frameId = 0;
let sheetTop = 600;
let sheetLeft = 24;
let resizeCallback: ResizeObserverCallback;
let resizeObserver: ResizeObserver;
let finishFonts: () => void;
const originalFonts = Object.getOwnPropertyDescriptor(document, "fonts");

function flushFrame() {
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => callbacks.forEach(callback => callback(0)));
}

function scrollToPosition(position: number) {
  vi.stubGlobal("scrollY", position);
  fireEvent.scroll(window);
  flushFrame();
}

function scene() {
  const result = render(<main>
    <header data-gcm-arrival data-arrival-settled="true" data-count-settled="true"><h1>What makes an AI answer worth trusting?</h1><strong>97%</strong></header>
    <GcmContentSheet><nav><a href="#reliability">01 / Reliability</a></nav><article id="reliability"><button>Choose a requirement</button></article></GcmContentSheet>
  </main>);
  return {
    ...result,
    hero: result.container.querySelector<HTMLElement>("[data-gcm-arrival]")!,
    sheet: result.container.querySelector<HTMLElement>("[data-gcm-content-sheet]")!,
  };
}

function readingScene() {
  const geometry = { navHeight: 60, articleGap: 0, sheetHeight: 2000 };
  vi.mocked(HTMLElement.prototype.getBoundingClientRect).mockImplementation(function (this: HTMLElement) {
    if (this.hasAttribute("data-gcm-arrival")) throw new Error("Translated intro geometry must not drive the foreground.");
    if (this.hasAttribute("data-gcm-section-nav")) {
      return new DOMRect(sheetLeft, Math.max(0, sheetTop - window.scrollY), 1000, geometry.navHeight);
    }
    if (this.hasAttribute("data-gcm-reading-content")) {
      return new DOMRect(sheetLeft, sheetTop + geometry.navHeight + geometry.articleGap - window.scrollY, 1000, geometry.sheetHeight - geometry.navHeight);
    }
    return new DOMRect(sheetLeft, sheetTop - window.scrollY, 1000, geometry.sheetHeight);
  });
  const result = render(<main>
    <header data-gcm-arrival data-arrival-settled="true" data-count-settled="true"><h1>What makes an AI answer worth trusting?</h1><strong>97%</strong></header>
    <GcmContentSheet>
      <nav data-gcm-section-nav><a href="#reliability">01 / Reliability</a></nav>
      <article data-gcm-reading-content><section id="reliability"><button>Choose a requirement</button></section></article>
    </GcmContentSheet>
  </main>);
  const article = result.container.querySelector<HTMLElement>("[data-gcm-reading-content]")!;
  return {
    ...result,
    geometry,
    hero: result.container.querySelector<HTMLElement>("[data-gcm-arrival]")!,
    sheet: result.container.querySelector<HTMLElement>("[data-gcm-content-sheet]")!,
    nav: result.container.querySelector<HTMLElement>("[data-gcm-section-nav]")!,
    article,
    // Express the mask boundary in viewport coordinates, independently of the
    // article's document position. CSS appearance is verified in the browser.
    fadeViewportY: () => Number.parseFloat(article.style.getPropertyValue("--gcm-fade-y")) +
      sheetTop + geometry.navHeight + geometry.articleGap - window.scrollY,
  };
}

beforeEach(() => {
  frameId = 0;
  frames = new Map();
  sheetTop = 600;
  sheetLeft = 24;
  reduced = Object.assign(new EventTarget(), { matches: false }) as MediaQueryList;
  vi.stubGlobal("matchMedia", vi.fn(() => reduced));
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("innerHeight", 800);
  vi.stubGlobal("requestAnimationFrame", vi.fn(callback => { frames.set(++frameId, callback); return frameId; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn(id => frames.delete(id)));
  vi.stubGlobal("ResizeObserver", class {
    observe = vi.fn();
    disconnect = vi.fn();
    constructor(callback: ResizeObserverCallback) { resizeCallback = callback; resizeObserver = this as unknown as ResizeObserver; }
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    if (this.hasAttribute("data-gcm-arrival")) throw new Error("Translated intro geometry must not drive the foreground.");
    return new DOMRect(sheetLeft, sheetTop - window.scrollY, 1000, 2000);
  });
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready: new Promise<void>(resolve => { finishFonts = resolve; }) } });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalFonts) Object.defineProperty(document, "fonts", originalFonts);
  else Reflect.deleteProperty(document, "fonts");
});

describe("GCM foreground sheet", () => {
  it("moves only the outgoing intro, bounds its travel, and reverses through native scroll", () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const { hero, sheet, getByRole } = scene();
    const button = getByRole("button", { name: "Choose a requirement" });
    act(() => button.focus());
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("0px");
    scrollToPosition(200);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("130px");
    expect(hero.dataset.gcmDepth).toBe("moving");
    scrollToPosition(1000);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("390px");
    expect(hero.dataset.gcmDepth).toBe("resting");
    scrollToPosition(200);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("130px");
    scrollToPosition(0);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("0px");
    expect(sheet.style.transform).toBe("");
    expect(sheet.style.position).toBe("");
    expect(document.activeElement).toBe(button);
    expect(getByRole("link").getAttribute("href")).toBe("#reliability");
    expect(scroll).not.toHaveBeenCalled();
  });

  it("allows native reading of a tall intro before adding depth", () => {
    sheetTop = 1300;
    const { hero } = scene();
    scrollToPosition(400);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("0px");
    scrollToPosition(700);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("130px");
    scrollToPosition(1500);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("520px");
  });

  it("leaves the existing question/count completion state and content intact", () => {
    const { hero } = scene();
    const text = hero.textContent;
    scrollToPosition(300);
    fireEvent(window, new Event("beforeprint"));
    expect(hero.dataset.arrivalSettled).toBe("true");
    expect(hero.dataset.countSettled).toBe("true");
    expect(hero.textContent).toBe(text);
    expect(hero.hasAttribute("data-gcm-arrival")).toBe(true);
  });

  it("remeasures the untransformed foreground when responsive geometry changes", () => {
    const { hero, sheet } = scene();
    scrollToPosition(200);
    sheetTop = 1000;
    sheetLeft = 40;
    vi.stubGlobal("innerHeight", 600);
    act(() => resizeCallback([], resizeObserver));
    flushFrame();
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("0px");
    expect(sheet.style.getPropertyValue("--gcm-sheet-left")).toBe("-40px");
    scrollToPosition(500);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("65px");
    expect(resizeObserver.observe).toHaveBeenCalledWith(hero);
    expect(resizeObserver.observe).toHaveBeenCalledWith(sheet);
  });

  it("clears pending depth motion for reduced motion and resumes from the actual scroll position", () => {
    const { hero } = scene();
    scrollToPosition(200);
    vi.stubGlobal("scrollY", 300);
    fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    act(() => { Object.assign(reduced, { matches: true }); reduced.dispatchEvent(new Event("change")); });
    expect(frames.size).toBe(0);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("");
    expect(hero.dataset.gcmDepth).toBeUndefined();
    scrollToPosition(400);
    expect(frames.size).toBe(0);
    act(() => { Object.assign(reduced, { matches: false }); reduced.dispatchEvent(new Event("change")); });
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("260px");
  });

  it("resets for print and restores the current geometry afterwards", () => {
    const { hero } = scene();
    scrollToPosition(250);
    fireEvent(window, new Event("beforeprint"));
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("");
    expect(hero.dataset.gcmDepth).toBeUndefined();
    scrollToPosition(350);
    expect(frames.size).toBe(0);
    fireEvent(window, new Event("afterprint"));
    expect(frames.size).toBe(1);
    flushFrame();
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("227.5px");
  });

  it("coalesces scroll events and stops requesting frames once the intro is covered", () => {
    const { hero } = scene();
    vi.stubGlobal("scrollY", 100);
    fireEvent.scroll(window);
    vi.stubGlobal("scrollY", 300);
    fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    flushFrame();
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("195px");
    scrollToPosition(600);
    const request = vi.mocked(requestAnimationFrame);
    request.mockClear();
    scrollToPosition(900);
    scrollToPosition(2000);
    expect(request).not.toHaveBeenCalled();
    scrollToPosition(400);
    expect(request).toHaveBeenCalledOnce();
    expect(hero.dataset.gcmDepth).toBe("moving");
  });

  it("cleans up observers, passive listeners, frames, and deferred font callbacks", async () => {
    const added = vi.spyOn(window, "addEventListener");
    const removed = vi.spyOn(window, "removeEventListener");
    const documentRemoved = vi.spyOn(document, "removeEventListener");
    const preferenceRemoved = vi.spyOn(reduced, "removeEventListener");
    const { hero, unmount } = scene();
    expect(added).toHaveBeenCalledWith("scroll", expect.any(Function), { passive: true });
    vi.stubGlobal("scrollY", 200);
    fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(resizeObserver.disconnect).toHaveBeenCalledOnce();
    for (const event of ["scroll", "resize", "pageshow", "beforeprint", "afterprint"]) {
      const registration = added.mock.calls.find(([name]) => name === event)!;
      expect(removed).toHaveBeenCalledWith(event, registration[1]);
    }
    expect(documentRemoved).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(preferenceRemoved).toHaveBeenCalledWith("change", expect.any(Function));
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("");
    await act(async () => { finishFonts(); await Promise.resolve(); });
    fireEvent.scroll(window);
    fireEvent.resize(window);
    expect(frames.size).toBe(0);
  });
});

describe("GCM pinned navigation reading fade", () => {
  it("keeps the fade at the panel edge after intro travel ends without layout reads on scroll", () => {
    const { hero, article, sheet, nav, fadeViewportY } = readingScene();
    scrollToPosition(600);
    const introOffset = hero.style.getPropertyValue("--gcm-intro-offset");
    const startFade = article.style.getPropertyValue("--gcm-fade-y");
    const bounds = vi.mocked(HTMLElement.prototype.getBoundingClientRect);
    bounds.mockClear();

    vi.stubGlobal("scrollY", 900);
    fireEvent.scroll(window);
    vi.stubGlobal("scrollY", 1100);
    fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    flushFrame();

    expect(article.style.getPropertyValue("--gcm-fade-y")).not.toBe(startFade);
    expect(fadeViewportY()).toBe(60);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe(introOffset);
    expect(hero.dataset.gcmDepth).toBe("resting");
    expect(bounds).not.toHaveBeenCalled();
    expect(sheet.style.getPropertyValue("--gcm-fade-y")).toBe("");
    expect(nav.style.getPropertyValue("--gcm-fade-y")).toBe("");
    expect(frames.size).toBe(0);
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
  });

  it("reverses the fade and grid registration without changing content or replaying the intro", () => {
    const { hero, article, nav } = readingScene();
    const originalText = article.textContent;
    const initialFade = article.style.getPropertyValue("--gcm-fade-y");
    scrollToPosition(920);
    const forward = [article.style.getPropertyValue("--gcm-fade-y"), nav.style.getPropertyValue("--gcm-nav-paper-y")];
    scrollToPosition(1500);
    expect(article.style.getPropertyValue("--gcm-fade-y")).not.toBe(forward[0]);
    scrollToPosition(920);
    expect([article.style.getPropertyValue("--gcm-fade-y"), nav.style.getPropertyValue("--gcm-nav-paper-y")]).toEqual(forward);
    scrollToPosition(0);
    expect(article.style.getPropertyValue("--gcm-fade-y")).toBe(initialFade);
    expect(article.textContent).toBe(originalText);
    expect(hero.dataset.arrivalSettled).toBe("true");
    expect(hero.dataset.countSettled).toBe("true");
  });

  it("remeasures wrapped navigation and changed article geometry before aligning the fade", () => {
    const { geometry, hero, sheet, nav, article, fadeViewportY } = readingScene();
    expect(resizeObserver.observe).toHaveBeenCalledWith(nav);
    expect(resizeObserver.observe).toHaveBeenCalledWith(article);
    scrollToPosition(1000);
    expect(fadeViewportY()).toBe(60);
    geometry.navHeight = 104;
    geometry.articleGap = 24;
    geometry.sheetHeight = 2500;
    act(() => resizeCallback([], resizeObserver));
    expect(frames.size).toBe(1);
    flushFrame();
    expect(sheet.style.getPropertyValue("--gcm-nav-height")).toBe("104px");
    expect(fadeViewportY()).toBe(104);
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("390px");
    scrollToPosition(2800);
    expect(fadeViewportY()).toBe(104);
  });

  it("removes the fade for reduced motion and print, then restores the current scroll position", () => {
    const { hero, article, nav, fadeViewportY } = readingScene();
    scrollToPosition(900);
    vi.stubGlobal("scrollY", 1000);
    fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    act(() => { Object.assign(reduced, { matches: true }); reduced.dispatchEvent(new Event("change")); });
    expect(frames.size).toBe(0);
    expect(article.style.getPropertyValue("--gcm-fade-y")).toBe("");
    expect(hero.style.getPropertyValue("--gcm-intro-offset")).toBe("");
    const reducedGrid = nav.style.getPropertyValue("--gcm-nav-paper-y");
    scrollToPosition(1100);
    expect(article.style.getPropertyValue("--gcm-fade-y")).toBe("");
    expect(nav.style.getPropertyValue("--gcm-nav-paper-y")).not.toBe(reducedGrid);
    act(() => { Object.assign(reduced, { matches: false }); reduced.dispatchEvent(new Event("change")); });
    expect(fadeViewportY()).toBe(60);

    fireEvent(window, new Event("beforeprint"));
    expect(article.style.getPropertyValue("--gcm-fade-y")).toBe("");
    vi.stubGlobal("scrollY", 1300);
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    fireEvent(window, new Event("afterprint"));
    flushFrame();
    expect(fadeViewportY()).toBe(60);
  });

  it("pauses hidden-page work and cleans up the reading styles and queued callbacks", async () => {
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const { article, nav, fadeViewportY, unmount } = readingScene();
    scrollToPosition(900);
    vi.stubGlobal("scrollY", 1000);
    fireEvent.scroll(window);
    hidden.mockReturnValue(true);
    fireEvent(document, new Event("visibilitychange"));
    expect(frames.size).toBe(0);
    vi.stubGlobal("scrollY", 1200);
    fireEvent.scroll(window);
    expect(frames.size).toBe(0);
    hidden.mockReturnValue(false);
    fireEvent(document, new Event("visibilitychange"));
    flushFrame();
    expect(fadeViewportY()).toBe(60);

    vi.stubGlobal("scrollY", 1400);
    fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(article.style.getPropertyValue("--gcm-fade-y")).toBe("");
    expect(nav.style.getPropertyValue("--gcm-nav-paper-y")).toBe("");
    expect(resizeObserver.disconnect).toHaveBeenCalledOnce();
    await act(async () => { finishFonts(); await Promise.resolve(); });
    fireEvent.scroll(window);
    fireEvent.resize(window);
    expect(frames.size).toBe(0);
  });
});
