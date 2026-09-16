import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gcmPmfHref } from "@/data/gcm";
import { GcmCompanion } from "./gcm-companion";

let intersection: IntersectionObserverCallback;
let resize: ResizeObserverCallback;
let visibility = "visible";
let frames: Map<number, FrameRequestCallback>;
let frameNumber: number;
const disconnectIntersection = vi.fn();
const disconnectResize = vi.fn();

beforeEach(() => {
  frames = new Map();
  frameNumber = 0;
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility as DocumentVisibilityState);
  vi.stubGlobal("requestAnimationFrame", vi.fn(callback => { frames.set(++frameNumber, callback); return frameNumber; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn(id => { frames.delete(id); }));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersection = callback; }
    observe() {}
    disconnect = disconnectIntersection;
  });
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: ResizeObserverCallback) { resize = callback; }
    observe() {}
    disconnect = disconnectResize;
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

function visible(value: boolean) {
  act(() => intersection([{ isIntersecting: value } as IntersectionObserverEntry], {} as IntersectionObserver));
}
function flushFrames() {
  act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0)); });
}
function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) };
}

describe("GCM's separate PMF companion", () => {
  it("server-renders the existing question and a single native image-and-title destination", () => {
    const html = document.createElement("div");
    html.innerHTML = renderToString(<GcmCompanion />);
    expect(html.querySelector("h3")?.textContent).toBe("How did we decidewhat was worth building?");
    expect(html.textContent).toContain("Before the MVP / Separate work sample");
    const link = html.querySelector("a")!;
    expect(html.querySelectorAll("a")).toHaveLength(1);
    expect(link.getAttribute("href")).toBe(gcmPmfHref);
    expect(link.textContent).toContain("Product Market Fit…with no product");
    expect(link.textContent).toContain("Research work sample / SaferData");
    expect(link.querySelector("img")?.getAttribute("alt")).toBe("");
    expect(link.querySelector("img")?.getAttribute("src")).toContain("market-overview.png");
    expect(link.closest('[hidden], [aria-hidden="true"]')).toBeNull();
  });

  it("pauses offscreen and in hidden tabs while retaining the visitor's explicit pause choice", () => {
    const { container } = render(<GcmCompanion />);
    const section = container.querySelector("section")!;
    expect(section.dataset.playing).toBe("false");
    visible(true);
    expect(section.dataset.playing).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Pause connector motion" }));
    expect(section.dataset.paused).toBe("true");
    expect(screen.getByRole("button", { name: "Resume connector motion" }).getAttribute("aria-pressed")).toBe("true");
    visible(false);
    expect(section.dataset.playing).toBe("false");
    visible(true);
    expect(section.dataset.paused).toBe("true");
    visibility = "hidden";
    fireEvent(document, new Event("visibilitychange"));
    expect(section.dataset.playing).toBe("false");
    visibility = "visible";
    fireEvent(document, new Event("visibilitychange"));
    expect(section.dataset.playing).toBe("true");
    expect(section.dataset.paused).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Resume connector motion" }));
    expect(section.dataset.paused).toBe("false");
    expect(screen.getByRole("link").getAttribute("href")).toBe(gcmPmfHref);
  });

  it("remeasures the line across desktop and stacked mobile without moving the content", () => {
    const { container } = render(<GcmCompanion />);
    const section = container.querySelector("section")!;
    const question = screen.getByRole("heading");
    const link = screen.getByRole("link");
    const sectionRect = vi.spyOn(section, "getBoundingClientRect").mockReturnValue(rect(20, 100, 1200, 200));
    const questionRect = vi.spyOn(question, "getBoundingClientRect").mockReturnValue(rect(20, 140, 275, 60));
    const linkRect = vi.spyOn(link, "getBoundingClientRect").mockReturnValue(rect(660, 130, 560, 130));
    flushFrames();
    const path = section.querySelector("svg[focusable] path")!;
    expect(section.dataset.measured).toBe("true");
    expect(path.getAttribute("d")).toBe("M 291 70 L 459.5 70 L 459.5 95 L 628 95");
    sectionRect.mockReturnValue(rect(20, 100, 350, 330));
    questionRect.mockReturnValue(rect(20, 140, 275, 60));
    linkRect.mockReturnValue(rect(20, 252, 350, 130));
    act(() => resize([], {} as ResizeObserver));
    flushFrames();
    expect(path.getAttribute("d")).toBe("M 18 110 L 18 127 L 48 127 L 48 144");
    expect(link.getAttribute("style")).toBeNull();
    expect(question.getAttribute("style")).toBeNull();
  });

  it("removes observers, visibility listeners, and pending geometry work on unmount", () => {
    const remove = vi.spyOn(document, "removeEventListener");
    const removeWindow = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<GcmCompanion />);
    expect(frames.size).toBeGreaterThan(0);
    unmount();
    expect(frames.size).toBe(0);
    expect(disconnectIntersection).toHaveBeenCalledOnce();
    expect(disconnectResize).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(removeWindow).toHaveBeenCalledWith("resize", expect.any(Function));
  });

  it("provides a static complete connector and removes the unused control for reduced motion", () => {
    const css = readFileSync(resolve("src/components/portfolio/gcm-companion.module.css"), "utf8");
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toContain("animation: none");
    expect(reduced).toContain("stroke-dashoffset: 0");
    expect(reduced).toContain(".motionControl { display: none; }");
    expect(css).toContain("min-height: 44px");
  });
});
