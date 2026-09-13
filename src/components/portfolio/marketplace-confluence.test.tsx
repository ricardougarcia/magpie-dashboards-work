import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { marketplaceArtifacts as artifacts } from "@/data/marketplace";
import { MarketplaceConfluence } from "./marketplace-confluence";

let top: number;
let scrollY: number;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let disconnect: ReturnType<typeof vi.fn>;
let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };

function flushFrame() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(0));
  });
}

function scrollToProgress(progress: number) {
  top = 24 - progress * 1000;
  scrollY = progress * 1000;
  fireEvent.scroll(window);
  flushFrame();
}

function setup() {
  const { container, unmount } = render(<MarketplaceConfluence />);
  return {
    root: container.querySelector<HTMLElement>("[data-confluence]")!,
    source: container.querySelector<HTMLElement>("[data-source-layer]")!,
    product: container.querySelector<HTMLElement>("[data-product-layer]")!,
    unmount,
  };
}

beforeEach(() => {
  top = 24;
  scrollY = 0;
  frames = new Map();
  nextFrame = 0;
  disconnect = vi.fn();
  media = { matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect = disconnect; });
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
    return this.hasAttribute("data-confluence") ? 1700 : 700;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ top, height: 1700, bottom: top + 1700 } as DOMRect));
  window.history.replaceState(null, "", "/work/marketplace");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

it("provides native catalog destinations and source/product originals before hydration", () => {
  const page = document.createElement("div");
  page.innerHTML = renderToString(<MarketplaceConfluence />);
  expect(page.querySelector<HTMLElement>("[data-confluence]")?.dataset.choreography).toBe("false");
  const choices = page.querySelectorAll<HTMLAnchorElement>("[data-source-choice]");
  expect([...choices].map(link => link.getAttribute("href"))).toEqual([artifacts.ai.src, artifacts.appCenter.src, artifacts.library.src]);
  choices.forEach(link => { expect(link.target).toBe("_blank"); expect(link.rel).toContain("noopener"); });
  for (const artifact of [artifacts.ai, artifacts.catalog]) {
    const original = page.querySelector(`#${artifact.id} [data-marketplace-image]`)!;
    expect(original.closest("[hidden], [inert], [aria-hidden='true']")).toBeNull();
  }
});

it("selects a catalog in place and keeps exactly that original available for inspection", () => {
  const { root } = setup();
  const choice = within(screen.getByRole("group", { name: "Source catalogs" })).getByRole("link", { name: "Edu App Center" });
  fireEvent.click(choice);
  expect(choice.getAttribute("aria-current")).toBe("true");
  expect(root.querySelector<HTMLElement>(`#${artifacts.appCenter.id}`)?.hidden).toBe(false);
  expect(root.querySelector<HTMLElement>(`#${artifacts.ai.id}`)?.hidden).toBe(true);
  expect(root.querySelectorAll("[data-source-layer] > figure:not([hidden])")).toHaveLength(1);
  expect(root.querySelector("[data-source-layer] > figure:not([hidden]) [data-marketplace-image]")?.getAttribute("href")).toBe(artifacts.appCenter.src);
  expect(root.dataset.scene).toBe("source");
});

it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }])("preserves native catalog activation for %j", (modifier) => {
  const { root } = setup();
  const choice = within(screen.getByRole("group", { name: "Source catalogs" })).getByRole("link", { name: "Edu App Center" });
  let intercepted = false;
  document.addEventListener("click", event => { intercepted = event.defaultPrevented; event.preventDefault(); }, { once: true });
  act(() => { choice.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...modifier })); });
  expect(intercepted).toBe(false);
  expect(choice.hasAttribute("aria-current")).toBe(false);
  expect(root.querySelector<HTMLElement>(`#${artifacts.ai.id}`)?.hidden).toBe(false);
});

it("registers, reveals, and reverses while keeping the inactive layer out of interaction", () => {
  const { root, source, product } = setup();
  expect(root.dataset.scene).toBe("source");
  expect(source.inert).toBe(false);
  expect(product.inert).toBe(true);
  scrollToProgress(.5);
  const separated = parseFloat(root.style.getPropertyValue("--separation"));
  expect(separated).toBeGreaterThan(0);
  expect(separated).toBeLessThan(28);
  scrollToProgress(.9);
  expect(root.dataset.scene).toBe("product");
  expect(root.style.getPropertyValue("--reveal")).toBe("100%");
  expect(source.inert).toBe(true);
  expect(product.inert).toBe(false);
  scrollToProgress(0);
  expect(root.dataset.scene).toBe("source");
  expect(root.style.getPropertyValue("--reveal")).toBe("0%");
  expect(source.inert).toBe(false);
  expect(product.inert).toBe(true);
});

it("leaves both partially visible originals pointer-enabled while exposing one keyboard/AT layer", () => {
  const { root, source, product } = setup();
  const sourceLink = source.querySelector<HTMLAnchorElement>(`#${artifacts.ai.id} [data-marketplace-image]`)!;
  const productLink = product.querySelector<HTMLAnchorElement>("[data-marketplace-image]")!;

  // JSDOM cannot hit-test clip paths. These are the interaction prerequisites;
  // browser verification must establish that each visible region hits its own original.
  for (const [progress, productActive] of [[.725, false], [.7875, true]] as const) {
    scrollToProgress(progress);
    const reveal = parseFloat(root.style.getPropertyValue("--reveal"));
    expect(reveal).toBeGreaterThan(0);
    expect(reveal).toBeLessThan(100);
    expect(source.inert).toBe(false);
    expect(product.inert).toBe(false);
    expect(sourceLink.tabIndex).toBe(productActive ? -1 : 0);
    expect(productLink.tabIndex).toBe(productActive ? 0 : -1);
    expect(sourceLink.getAttribute("aria-hidden")).toBe(productActive ? "true" : null);
    expect(productLink.getAttribute("aria-hidden")).toBe(productActive ? null : "true");
  }
});

it("announces the product selection and restores the remembered catalog when scrolling back", () => {
  const { root } = setup();
  const choices = screen.getByRole("group", { name: "Source catalogs" });
  const library = within(choices).getByRole("link", { name: "LearnCommunity Library" });
  fireEvent.click(library);
  expect(library.getAttribute("aria-current")).toBe("true");
  scrollToProgress(.9);
  expect(choices.querySelectorAll("[aria-current]")).toHaveLength(0);
  expect(screen.getByRole("button", { name: "Shared Marketplace in view" }).getAttribute("aria-pressed")).toBe("true");
  scrollToProgress(0);
  expect(library.getAttribute("aria-current")).toBe("true");
  expect(root.querySelector<HTMLElement>(`#${artifacts.library.id}`)?.hidden).toBe(false);
  expect(root.querySelector<HTMLElement>(`#${artifacts.ai.id}`)?.hidden).toBe(true);
  expect(screen.getByRole("button", { name: "View the shared Marketplace" }).getAttribute("aria-pressed")).toBe("false");
});

it("allows explicit product/source choice, then resumes choreography after scrolling", () => {
  const { root } = setup();
  fireEvent.click(screen.getByRole("button", { name: "View the shared Marketplace" }));
  expect(root.dataset.scene).toBe("product");
  expect(screen.getByRole("button", { name: "Shared Marketplace in view" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("group", { name: "Source catalogs" }).querySelectorAll("[aria-current]")).toHaveLength(0);
  fireEvent.click(within(screen.getByRole("group", { name: "Source catalogs" })).getByRole("link", { name: "LearnCommunity Library" }));
  expect(root.dataset.scene).toBe("source");
  expect(screen.getByRole("button", { name: "View the shared Marketplace" }).getAttribute("aria-pressed")).toBe("false");
  expect(root.querySelector<HTMLElement>(`#${artifacts.library.id}`)?.hidden).toBe(false);
  scrollToProgress(.9);
  expect(root.dataset.scene).toBe("product");
});

it("keeps both layers interactive when reduced motion or viewport size disables choreography", () => {
  media.matches = false;
  const { root, source, product } = setup();
  expect(root.dataset.choreography).toBe("false");
  expect(source.inert).toBe(false);
  expect(product.inert).toBe(false);
  media.matches = true;
  act(() => media.addEventListener.mock.calls[0][1]());
  flushFrame();
  scrollToProgress(.9);
  expect(source.inert).toBe(true);
  media.matches = false;
  act(() => media.addEventListener.mock.calls[0][1]());
  flushFrame();
  expect(root.dataset.choreography).toBe("false");
  expect(source.inert).toBe(false);
  expect(product.inert).toBe(false);
  for (const link of [...source.querySelectorAll<HTMLAnchorElement>("[data-marketplace-image]"), product.querySelector<HTMLAnchorElement>("[data-marketplace-image]")!]) {
    expect(link.tabIndex).toBe(0);
    expect(link.hasAttribute("aria-hidden")).toBe(false);
  }
  expect(window.matchMedia).toHaveBeenCalledWith(expect.stringContaining("prefers-reduced-motion: no-preference"));
});

it("holds each focused original through scroll changes and resumes when focus leaves", () => {
  const { root, source, product } = setup();
  const sourceLink = source.querySelector<HTMLAnchorElement>(`#${artifacts.ai.id} [data-marketplace-image]`)!;
  const productLink = product.querySelector<HTMLAnchorElement>("[data-marketplace-image]")!;
  act(() => sourceLink.focus());
  flushFrame();
  scrollToProgress(.9);
  expect(document.activeElement).toBe(sourceLink);
  expect(root.style.getPropertyValue("--reveal")).toBe("0%");
  expect(source.inert).toBe(false);
  expect(sourceLink.tabIndex).toBe(0);
  expect(sourceLink.hasAttribute("aria-hidden")).toBe(false);
  act(() => sourceLink.blur());
  flushFrame();
  expect(root.style.getPropertyValue("--reveal")).toBe("100%");

  act(() => productLink.focus());
  flushFrame();
  scrollToProgress(0);
  expect(document.activeElement).toBe(productLink);
  expect(root.style.getPropertyValue("--reveal")).toBe("100%");
  expect(product.inert).toBe(false);
  expect(productLink.tabIndex).toBe(0);
  expect(productLink.hasAttribute("aria-hidden")).toBe(false);
  act(() => productLink.blur());
  flushFrame();
  expect(root.style.getPropertyValue("--reveal")).toBe("0%");
});

it("keeps an inspected original's scene stable while the document scrolls", () => {
  const { root, source } = setup();
  const dialog = source.querySelector("dialog")!;
  dialog.open = true;
  scrollToProgress(.9);
  expect(root.dataset.scene).toBe("source");
  expect(source.inert).toBe(false);
  dialog.open = false;
  fireEvent.scroll(window);
  flushFrame();
  expect(root.dataset.scene).toBe("product");
});

it.each([artifacts.appCenter, artifacts.library])("honors direct links to the $label original", artifact => {
  window.history.replaceState(null, "", `/work/marketplace#${artifact.id}`);
  const { root, source } = setup();
  expect(root.querySelector<HTMLElement>(`#${artifact.id}`)?.hidden).toBe(false);
  expect(source.inert).toBe(false);
  expect(root.dataset.choreography).toBe("false");
});

it.each(["initial", "navigation"])("makes the product readable on %s artifact links", mode => {
  if (mode === "initial") window.history.replaceState(null, "", `/work/marketplace#${artifacts.catalog.id}`);
  const { root, product } = setup();
  if (mode === "navigation") {
    window.history.replaceState(null, "", `/work/marketplace#${artifacts.catalog.id}`);
    fireEvent(window, new HashChangeEvent("hashchange"));
    flushFrame();
  }
  expect(root.dataset.choreography).toBe("false");
  expect(product.inert).toBe(false);
  expect(product.hidden).toBe(false);
  expect(product.querySelector("[data-marketplace-image]")?.getAttribute("href")).toBe(artifacts.catalog.src);
});

it("waits for source selection and static layout before completing native anchor positioning", () => {
  const { root } = setup();
  const target = root.querySelector<HTMLElement>(`#${artifacts.library.id}`)!;
  const scroll = vi.fn(() => {
    expect(target.hidden).toBe(false);
    expect(root.dataset.choreography).toBe("false");
  });
  target.scrollIntoView = scroll;
  expect(target.hidden).toBe(true);
  window.history.replaceState(null, "", `/work/marketplace#${artifacts.library.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(target.hidden).toBe(false);
  expect(scroll).not.toHaveBeenCalled();
  flushFrame();
  expect(scroll).not.toHaveBeenCalled();
  flushFrame();
  expect(scroll).toHaveBeenCalledExactlyOnceWith({ block: "start", behavior: "instant" });
});

it("replaces a pending artifact landing instead of scrolling to a stale hash", () => {
  const { root } = setup();
  const library = root.querySelector<HTMLElement>(`#${artifacts.library.id}`)!;
  const appCenter = root.querySelector<HTMLElement>(`#${artifacts.appCenter.id}`)!;
  library.scrollIntoView = vi.fn();
  appCenter.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", `/work/marketplace#${artifacts.library.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  // The first target now has its final positioning callback queued.
  window.history.replaceState(null, "", `/work/marketplace#${artifacts.appCenter.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  flushFrame();
  expect(library.scrollIntoView).not.toHaveBeenCalled();
  expect(appCenter.scrollIntoView).toHaveBeenCalledExactlyOnceWith({ block: "start", behavior: "instant" });
  expect(appCenter.hidden).toBe(false);
});

it("drops a queued artifact landing when navigation leaves the artifact or the component unmounts", () => {
  const { root, unmount } = setup();
  const library = root.querySelector<HTMLElement>(`#${artifacts.library.id}`)!;
  library.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", `/work/marketplace#${artifacts.library.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  window.history.replaceState(null, "", "/work/marketplace#impact");
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  expect(library.scrollIntoView).not.toHaveBeenCalled();

  window.history.replaceState(null, "", `/work/marketplace#${artifacts.library.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  expect(frames.size).toBe(1);
  unmount();
  expect(frames.size).toBe(0);
  flushFrame();
  expect(library.scrollIntoView).not.toHaveBeenCalled();
});

it("closes the evidence note with Escape and restores its summary focus", () => {
  const { root } = setup();
  const summary = screen.getByText("What came together");
  const note = summary.closest("details")!;
  note.open = true;
  const close = within(note).getByRole("button", { name: "Close note" });
  close.focus();
  fireEvent.keyDown(close, { key: "Escape" });
  expect(note.open).toBe(false);
  expect(document.activeElement).toBe(summary);
  expect(root.textContent).toContain("does not establish that all three catalogs were retired");
});

it("removes observers, listeners, and pending paint on unmount", () => {
  const remove = vi.spyOn(window, "removeEventListener");
  const { unmount } = setup();
  fireEvent.scroll(window);
  expect(frames.size).toBe(1);
  unmount();
  expect(frames.size).toBe(0);
  expect(disconnect).toHaveBeenCalledOnce();
  expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  for (const event of ["scroll", "resize", "pageshow", "hashchange"]) expect(remove).toHaveBeenCalledWith(event, expect.any(Function));
});
