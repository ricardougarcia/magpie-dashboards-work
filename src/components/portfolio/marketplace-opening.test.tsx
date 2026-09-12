import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import Image from "next/image";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MarketplaceOpening } from "./marketplace-opening";

let entry: IntersectionObserverCallback;
let disconnect: ReturnType<typeof vi.fn>;
let top: number;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let preference: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };

function Sample() {
  return <MarketplaceOpening><a href="/marketplace.png"><Image src="/marketplace.png" width={1200} height={600} alt="Shared Marketplace product experience" /></a></MarketplaceOpening>;
}

function flushFrame() {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach((callback) => callback(0));
  });
}

function intersect(isIntersecting = true) {
  act(() => entry([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver));
}

beforeEach(() => {
  vi.useFakeTimers();
  top = 1200;
  frames = new Map();
  nextFrame = 0;
  disconnect = vi.fn();
  preference = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => preference);
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { entry = callback; }
    observe() {}
    disconnect = disconnect;
  });
  vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ top, height: 600, bottom: top + 600 } as DOMRect));
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

it("server-renders the complete, naturally sized artifact with its opening already open", () => {
  const holder = document.createElement("div");
  holder.innerHTML = renderToStaticMarkup(<Sample />);
  const root = holder.querySelector<HTMLElement>("[data-marketplace-opening]")!;
  const artifact = holder.querySelector<HTMLElement>("[data-opening-artifact]")!;
  expect(root.dataset.openingState).toBe("open");
  expect(root.dataset.openingReady).toBe("false");
  expect(artifact.querySelector("a")?.getAttribute("href")).toBe("/marketplace.png");
  expect(artifact.querySelector("img")?.getAttribute("width")).toBe("1200");
  expect(artifact.querySelector("img")?.getAttribute("height")).toBe("600");
  expect(artifact.closest('[aria-hidden="true"], [hidden], [inert]')).toBeNull();
  expect(holder.querySelector("button")?.hidden).toBe(true);
  expect(holder.querySelectorAll('[data-opening-gate][aria-hidden="true"]')).toHaveLength(2);
});

it("arms below the viewport, opens once on entry, and never closes on scroll-out", () => {
  const { container } = render(<Sample />);
  const root = container.querySelector<HTMLElement>("[data-marketplace-opening]")!;
  const image = screen.getByRole("img");
  expect(root.dataset.openingState).toBe("armed");
  intersect(false);
  expect(root.dataset.openingRun).toBe("0");
  intersect();
  expect(root.dataset.openingState).toBe("opening");
  expect(root.dataset.openingRun).toBe("1");
  expect(disconnect).toHaveBeenCalledOnce();
  act(() => { vi.advanceTimersByTime(1250); });
  expect(root.dataset.openingState).toBe("open");
  intersect(false);
  intersect();
  expect(root.dataset.openingState).toBe("open");
  expect(root.dataset.openingRun).toBe("1");
  expect(screen.getByRole("img")).toBe(image);
  expect(image.getAttribute("width")).toBe("1200");
  expect(image.getAttribute("height")).toBe("600");
});

it("keeps visible hydration and initial deep links open", () => {
  top = 200;
  const visible = render(<Sample />);
  expect(visible.container.querySelector<HTMLElement>("[data-marketplace-opening]")?.dataset.openingState).toBe("open");
  visible.unmount();
  top = 1200;
  window.history.replaceState(null, "", "/#shared-marketplace");
  const linked = render(<Sample />);
  expect(linked.container.querySelector<HTMLElement>("[data-marketplace-opening]")?.dataset.openingState).toBe("open");
  expect(frames.size).toBe(0);
});

it("shows reduced-motion content immediately and cancels a running opening when the preference changes", () => {
  preference.matches = true;
  const reduced = render(<Sample />);
  expect(reduced.container.querySelector<HTMLElement>("[data-marketplace-opening]")?.dataset.openingState).toBe("open");
  const button = screen.getByRole("button", { name: "Replay the Marketplace opening" });
  expect(button.getAttribute("aria-disabled")).toBe("true");
  fireEvent.click(button);
  expect(frames.size).toBe(0);
  reduced.unmount();

  preference.matches = false;
  preference.addEventListener.mockClear();
  const normal = render(<Sample />);
  const root = normal.container.querySelector<HTMLElement>("[data-marketplace-opening]")!;
  intersect();
  expect(root.dataset.openingState).toBe("opening");
  preference.matches = true;
  act(() => preference.addEventListener.mock.calls[0][1]());
  expect(root.dataset.openingState).toBe("open");
  expect(vi.getTimerCount()).toBe(0);
  preference.matches = false;
  act(() => preference.addEventListener.mock.calls[0][1]());
  expect(root.dataset.openingState).toBe("open");
  expect(screen.getByRole("button", { name: "Replay the Marketplace opening" }).getAttribute("aria-disabled")).toBe("false");
});

it("opens immediately on artifact focus without moving focus or re-covering it", () => {
  const { container } = render(<Sample />);
  const root = container.querySelector<HTMLElement>("[data-marketplace-opening]")!;
  const link = screen.getByRole("link", { name: "Shared Marketplace product experience" });
  act(() => link.focus());
  expect(document.activeElement).toBe(link);
  expect(root.dataset.openingState).toBe("open");
  intersect();
  expect(root.dataset.openingRun).toBe("0");
  // A programmatic replay click must not obscure an artifact that still owns focus.
  fireEvent.click(screen.getByRole("button", { name: "Replay the Marketplace opening" }));
  expect(root.dataset.openingState).toBe("open");
  expect(frames.size).toBe(0);
});

it("allows explicit replay, replaces interrupted replays, and preserves button focus", () => {
  top = 100;
  const { container } = render(<Sample />);
  const root = container.querySelector<HTMLElement>("[data-marketplace-opening]")!;
  const button = screen.getByRole("button", { name: "Replay the Marketplace opening" });
  act(() => {
    button.focus();
    // JSDOM queues selectionchange on focus; isolate the opening's timers below.
    vi.advanceTimersByTime(0);
  });
  fireEvent.click(button);
  flushFrame();
  fireEvent.click(button);
  expect(frames.size).toBe(1);
  flushFrame();
  flushFrame();
  expect(root.dataset.openingState).toBe("opening");
  expect(root.dataset.openingRun).toBe("1");
  expect(vi.getTimerCount()).toBe(1);
  fireEvent.click(button);
  expect(root.dataset.openingState).toBe("armed");
  expect(vi.getTimerCount()).toBe(0);
  flushFrame();
  flushFrame();
  act(() => { vi.advanceTimersByTime(1250); });
  expect(root.dataset.openingState).toBe("open");
  expect(root.dataset.openingRun).toBe("2");
  expect(document.activeElement).toBe(button);
});

it("settles for pointer inspection, hash navigation, and hidden-document interruptions", () => {
  const first = render(<Sample />);
  fireEvent.pointerDown(screen.getByRole("link", { name: "Shared Marketplace product experience" }));
  expect(first.container.querySelector<HTMLElement>("[data-marketplace-opening]")?.dataset.openingState).toBe("open");
  first.unmount();
  const second = render(<Sample />);
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(second.container.querySelector<HTMLElement>("[data-marketplace-opening]")?.dataset.openingState).toBe("open");
  second.unmount();
  const third = render(<Sample />);
  intersect();
  vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  fireEvent(document, new Event("visibilitychange"));
  expect(third.container.querySelector<HTMLElement>("[data-marketplace-opening]")?.dataset.openingState).toBe("open");
  expect(vi.getTimerCount()).toBe(0);
});

it("falls back to visible content without IntersectionObserver", () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  const { container } = render(<Sample />);
  expect(container.querySelector<HTMLElement>("[data-marketplace-opening]")?.dataset.openingState).toBe("open");
  expect(screen.getByRole("link", { name: "Shared Marketplace product experience" })).toBeTruthy();
});

it("releases observers, listeners, queued frames, and completion timers on unmount", () => {
  const remove = vi.spyOn(window, "removeEventListener");
  const pending = render(<Sample />);
  pending.unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(preference.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  expect(remove).toHaveBeenCalledWith("hashchange", expect.any(Function));
  intersect();
  expect(vi.getTimerCount()).toBe(0);

  const replaying = render(<Sample />);
  fireEvent.click(screen.getByRole("button", { name: "Replay the Marketplace opening" }));
  flushFrame();
  replaying.unmount();
  expect(frames.size).toBe(0);

  const opening = render(<Sample />);
  intersect();
  expect(vi.getTimerCount()).toBe(1);
  opening.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
