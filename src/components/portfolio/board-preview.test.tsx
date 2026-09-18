import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BoardPreview, BoardPreviewToggle } from "./board-preview";
import { PortfolioLink } from "./portfolio-link";

let intersection: IntersectionObserverCallback;
let disconnect: ReturnType<typeof vi.fn>;
let hidden: boolean;

function pointer(element: Element, type: "pointerenter" | "pointerleave" | "pointerdown" | "pointermove", pointerType = "mouse", movementX = 0) {
  const event = new Event(type, { bubbles: type === "pointerdown" || type === "pointermove" });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  Object.defineProperties(event, { movementX: { value: movementX }, movementY: { value: 0 } });
  act(() => element.dispatchEvent(event));
}

function advance(milliseconds = 120) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

function inView(isIntersecting: boolean) {
  act(() => intersection([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));
}

function keyboardFocus(element: HTMLElement) {
  fireEvent.keyDown(document, { key: "Tab" });
  // jsdom does not consistently track input modality across test documents.
  vi.spyOn(element, "matches").mockImplementation((selector) => selector === ":focus-visible" || Element.prototype.matches.call(element, selector));
  act(() => element.focus());
}

function scene() {
  const result = render(<>
    <BoardPreview id="sample" className="sample" aria-labelledby="sample-title" data-work="magpie">
      <h2 id="sample-title"><PortfolioLink href="/work/magpie">Magpie <span>work sample</span></PortfolioLink></h2>
      <PortfolioLink href="/work/magpie#evidence">Explore the evidence</PortfolioLink>
      <BoardPreviewToggle label="Magpie work sample" className="preview-toggle" />
    </BoardPreview>
    <button>Next sample</button>
  </>);
  return {
    ...result,
    article: result.getByRole("article"),
    title: result.getByRole("link", { name: "Magpie work sample" }),
    evidence: result.getByRole("link", { name: "Explore the evidence" }),
    toggle: result.getByRole("button", { name: "Preview motion: Magpie work sample" }),
    outside: result.getByRole("button", { name: "Next sample" }),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  hidden = false;
  disconnect = vi.fn();
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersection = callback; }
    observe() {}
    disconnect = disconnect;
  });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Board preview activation", () => {
  it("waits for deliberate mouse entry anywhere in the article and holds across descendants", () => {
    const { article, title, evidence } = scene();
    expect(article.id).toBe("sample");
    expect(article.className).toBe("sample");
    expect(article.getAttribute("aria-labelledby")).toBe("sample-title");
    expect(article.dataset.work).toBe("magpie");
    expect(article.dataset.previewActive).toBe("false");
    pointer(article, "pointerenter");
    advance(119);
    expect(article.dataset.previewActive).toBe("false");
    advance(1);
    expect(article.dataset.previewActive).toBe("true");
    pointer(title, "pointerleave");
    pointer(evidence, "pointerenter");
    advance(3000);
    expect(article.dataset.previewActive).toBe("true");
    expect(vi.getTimerCount()).toBe(0);
    expect(evidence.getAttribute("href")).toBe("/work/magpie#evidence");
    pointer(article, "pointerleave");
    expect(article.dataset.previewActive).toBe("false");
  });

  it("cancels brief entries and ignores touch hover", () => {
    const { article } = scene();
    pointer(article, "pointerenter");
    advance(60);
    pointer(article, "pointerleave");
    advance(500);
    expect(article.dataset.previewActive).toBe("false");
    pointer(article, "pointerenter", "touch");
    advance(500);
    expect(article.dataset.previewActive).toBe("false");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("supports keyboard focus without clearing it as focus moves within the sample", () => {
    const { article, title, evidence, outside } = scene();
    keyboardFocus(title);
    expect(article.dataset.previewActive).toBe("true");
    pointer(article, "pointerenter");
    advance();
    keyboardFocus(outside);
    expect(article.dataset.previewActive).toBe("true");
    keyboardFocus(title);
    pointer(article, "pointerleave");
    expect(article.dataset.previewActive).toBe("true");
    keyboardFocus(evidence);
    expect(article.dataset.previewActive).toBe("true");
    expect(document.activeElement).toBe(evidence);
    keyboardFocus(outside);
    expect(article.dataset.previewActive).toBe("false");
  });

  it("pins a touch preview and resets it even while the toggle retains focus", () => {
    const { article, toggle, outside, getByRole } = scene();
    pointer(article, "pointerenter", "touch");
    fireEvent.click(toggle);
    expect(article.dataset.previewActive).toBe("true");
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    expect(getByRole("button", { name: "Reset preview: Magpie work sample" })).toBe(toggle);
    keyboardFocus(toggle);
    pointer(article, "pointerleave");
    expect(article.dataset.previewActive).toBe("true");
    fireEvent.click(toggle);
    expect(document.activeElement).toBe(toggle);
    expect(article.dataset.previewActive).toBe("false");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    pointer(article, "pointermove", "mouse", 5);
    advance(3000);
    expect(article.dataset.previewActive).toBe("false");
    fireEvent.click(toggle);
    pointer(outside, "pointerdown", "touch");
    expect(article.dataset.previewActive).toBe("false");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("honors explicit keyboard focus when its scroll into view reaches the observer later", () => {
    const { article, title } = scene();
    inView(false);
    keyboardFocus(title);
    expect(article.dataset.previewActive).toBe("false");
    expect(document.activeElement).toBe(title);
    inView(true);
    expect(article.dataset.previewActive).toBe("true");
    inView(false);
    expect(article.dataset.previewActive).toBe("false");
    inView(true);
    expect(article.dataset.previewActive).toBe("false");
  });

  it("does not treat pointer focus as keyboard intent", () => {
    const { article, title } = scene();
    vi.spyOn(title, "matches").mockReturnValue(false);
    act(() => title.focus());
    advance(500);
    expect(article.dataset.previewActive).toBe("false");
  });

  it("Escape clears input until a fresh hover or keyboard focus", () => {
    const { article, title, evidence, toggle } = scene();
    pointer(article, "pointerenter");
    advance();
    keyboardFocus(title);
    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(article.dataset.previewActive).toBe("false");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    pointer(article, "pointermove", "mouse", 5);
    advance(3000);
    expect(article.dataset.previewActive).toBe("false");
    keyboardFocus(evidence);
    expect(article.dataset.previewActive).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    pointer(article, "pointerleave");
    pointer(article, "pointerenter");
    advance();
    expect(article.dataset.previewActive).toBe("true");
  });

  it("visibility changes stop a preview and never start or resume it", () => {
    const { article, toggle } = scene();
    inView(false);
    inView(true);
    advance(3000);
    expect(article.dataset.previewActive).toBe("false");
    pointer(article, "pointerenter");
    advance(60);
    inView(false);
    advance(120);
    expect(article.dataset.previewActive).toBe("false");
    inView(true);
    fireEvent.click(toggle);
    expect(article.dataset.previewActive).toBe("true");
    inView(false);
    expect(article.dataset.previewActive).toBe("false");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    inView(true);
    expect(article.dataset.previewActive).toBe("false");
    fireEvent.click(toggle);
    hidden = true;
    fireEvent(document, new Event("visibilitychange"));
    expect(article.dataset.previewActive).toBe("false");
    expect(toggle.getAttribute("aria-pressed")).toBe("false");
    pointer(article, "pointerenter");
    fireEvent.click(toggle);
    hidden = false;
    fireEvent(document, new Event("visibilitychange"));
    advance(3000);
    expect(article.dataset.previewActive).toBe("false");
  });

  it("recovers a missed entry only after deliberate movement in the visible sample", () => {
    const { article, title } = scene();
    inView(false);
    pointer(article, "pointerenter");
    inView(true);
    advance(500);
    expect(article.dataset.previewActive).toBe("false");
    pointer(article, "pointermove");
    advance(500);
    expect(article.dataset.previewActive).toBe("false");
    pointer(article, "pointermove", "touch", 5);
    advance(500);
    expect(article.dataset.previewActive).toBe("false");
    pointer(title, "pointermove", "mouse", 5);
    advance(60);
    pointer(article, "pointermove", "mouse", 5);
    advance(59);
    expect(article.dataset.previewActive).toBe("false");
    advance(1);
    expect(article.dataset.previewActive).toBe("true");
    inView(false);
    inView(true);
    pointer(article, "pointermove", "mouse", 5);
    advance();
    expect(article.dataset.previewActive).toBe("true");
    hidden = true;
    fireEvent(document, new Event("visibilitychange"));
    hidden = false;
    fireEvent(document, new Event("visibilitychange"));
    expect(article.dataset.previewActive).toBe("false");
    pointer(article, "pointermove", "mouse", 5);
    advance();
    expect(article.dataset.previewActive).toBe("true");
  });

  it("releases its observer, pending intent, and document listeners on unmount", () => {
    const remove = vi.spyOn(document, "removeEventListener");
    const { article, unmount } = scene();
    pointer(article, "pointerenter");
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("pointerdown", expect.any(Function), true);
    expect(remove).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    pointer(article, "pointerenter");
    advance(3000);
    expect(article.dataset.previewActive).toBe("false");
    expect(vi.getTimerCount()).toBe(0);
  });
});
