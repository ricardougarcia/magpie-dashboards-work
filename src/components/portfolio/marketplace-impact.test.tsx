import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MarketplaceImpact } from "./marketplace-impact";

type Motion = { target: Element; cancel: ReturnType<typeof vi.fn>; onfinish: (() => void) | null };
const originalAnimate = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "animate");
let observer: IntersectionObserver;
let intersect: IntersectionObserverCallback;
let observed: Set<Element>;
let unobserve: ReturnType<typeof vi.fn>;
let disconnect: ReturnType<typeof vi.fn>;
let reduced: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
let preferenceListeners: Set<() => void>;
let motions: Motion[];
let animate: ReturnType<typeof vi.fn>;
let visibilityChanged: MutationCallback;
let visibilityObserver: MutationObserver;
let visibilityDisconnect: ReturnType<typeof vi.fn>;

function enter(targets: Element[], isIntersecting = true, intersectionRatio = isIntersecting ? 1 : 0) {
  const entries = targets.filter(target => observed.has(target)).map(target => ({ target, isIntersecting, intersectionRatio } as IntersectionObserverEntry));
  act(() => { if (entries.length) intersect(entries, observer); });
}

function advance(milliseconds = 100) {
  act(() => { vi.advanceTimersByTime(milliseconds); });
}

function updateParentVisibility() {
  act(() => { visibilityChanged([], visibilityObserver); });
}

function reduceMotion() {
  reduced.matches = true;
  act(() => { preferenceListeners.forEach(listener => listener()); });
}

function setup() {
  const result = render(<div data-reading><article style={{ opacity: 1 }}><MarketplaceImpact /></article></div>);
  const outcomes = [...result.container.querySelectorAll("dl > div")];
  const article = result.container.querySelector("article")!;
  const reading = article.parentElement!;
  return { ...result, outcomes, article, reading };
}

function expectReadable(container: Element) {
  const values = [...container.querySelectorAll("dl > div > dd:first-of-type")];
  expect(values.map(value => value.textContent)).toEqual(["#1", "102%", "$2M+", "+95%", "40+ hr/wk"]);
  for (const value of values) expect(value.closest("details, [hidden], [inert], [aria-hidden='true']")).toBeNull();
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  observed = new Set(); motions = []; preferenceListeners = new Set();
  unobserve = vi.fn((target: Element) => observed.delete(target));
  disconnect = vi.fn(() => observed.clear());
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback; observer = this as unknown as IntersectionObserver; }
    observe(target: Element) { observed.add(target); }
    unobserve = unobserve;
    disconnect = disconnect;
  });
  visibilityDisconnect = vi.fn();
  vi.stubGlobal("MutationObserver", class {
    constructor(callback: MutationCallback) { visibilityChanged = callback; visibilityObserver = this as unknown as MutationObserver; }
    observe() {}
    disconnect = visibilityDisconnect;
  });
  reduced = {
    matches: false,
    addEventListener: vi.fn((_event: string, listener: () => void) => preferenceListeners.add(listener)),
    removeEventListener: vi.fn((_event: string, listener: () => void) => preferenceListeners.delete(listener)),
  };
  vi.stubGlobal("matchMedia", vi.fn(() => reduced));
  animate = vi.fn(function (this: Element) {
    const motion: Motion = { target: this, cancel: vi.fn(), onfinish: null };
    motions.push(motion);
    return motion;
  });
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, writable: true, value: animate });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, "animate");
});

it("renders all final values before hydration without the removed outcomes disclosure", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(<MarketplaceImpact />);
  expectReadable(container);
  expect(container.querySelector("details")).toBeNull();
  expect(container.textContent).not.toContain("About the reported outcomes");
});

it("keeps final values readable when intersection observation is unavailable", () => {
  vi.stubGlobal("IntersectionObserver", undefined);
  const view = setup();
  expectReadable(view.container);
  expect(animate).not.toHaveBeenCalled();
});

it("reveals each arriving outcome once, without animating its label or other page content", () => {
  const view = setup();
  enter(view.outcomes, false);
  advance();
  expect(animate).not.toHaveBeenCalled();
  enter(view.outcomes.slice(0, 3));
  advance();
  expect(animate).toHaveBeenCalledTimes(3);
  for (const outcome of view.outcomes.slice(0, 3)) expect(unobserve).toHaveBeenCalledWith(outcome);
  expect(motions.every(motion => motion.target.closest("dd") && !motion.target.closest("dt"))).toBe(true);
  enter(view.outcomes.slice(0, 3), false);
  enter(view.outcomes.slice(0, 3));
  advance();
  expect(animate).toHaveBeenCalledTimes(3);
  enter(view.outcomes.slice(3));
  advance();
  expect(animate).toHaveBeenCalledTimes(5);
  expect(observed.size).toBe(0);
  expectReadable(view.container);
});

it("does not consume an outcome at the viewport edge before it is substantially visible", () => {
  const view = setup();
  enter(view.outcomes, true, .59);
  advance(500);
  expect(animate).not.toHaveBeenCalled();
  expect(unobserve).not.toHaveBeenCalled();
  enter(view.outcomes, true, .6);
  advance();
  expect(animate).toHaveBeenCalledTimes(5);
});

it("waits until scrolling settles and leaves outcomes that pass out of view available for a later arrival", () => {
  const view = setup();
  enter(view.outcomes);
  advance(80);
  fireEvent.scroll(window);
  advance(80);
  expect(animate).not.toHaveBeenCalled();
  expect(unobserve).not.toHaveBeenCalled();
  enter(view.outcomes.slice(3), false);
  advance(99);
  expect(animate).not.toHaveBeenCalled();
  advance(1);
  expect(animate).toHaveBeenCalledTimes(3);
  expect(observed.size).toBe(2);
  enter(view.outcomes.slice(3));
  advance();
  expect(animate).toHaveBeenCalledTimes(5);
});

it.each(["opacity", "inert"])("postpones arrival while its parent is hidden by %s, then resumes when the parent becomes visible", reason => {
  const view = setup();
  if (reason === "opacity") view.article.style.opacity = "0.4";
  else view.reading.setAttribute("inert", "");
  enter(view.outcomes);
  advance();
  expect(animate).not.toHaveBeenCalled();
  expect(unobserve).not.toHaveBeenCalled();
  view.article.style.opacity = "1";
  view.reading.removeAttribute("inert");
  updateParentVisibility();
  advance();
  expect(animate).toHaveBeenCalledTimes(5);
  expectReadable(view.container);
});

it("preserves the entrance until a background document is visible again", () => {
  const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  const view = setup();
  enter(view.outcomes);
  advance();
  expect(animate).not.toHaveBeenCalled();
  expect(unobserve).not.toHaveBeenCalled();
  hidden.mockReturnValue(false);
  fireEvent(document, new Event("visibilitychange"));
  advance();
  expect(animate).toHaveBeenCalledTimes(5);
});

it("shows the completed composition immediately when reduced motion is already requested", () => {
  reduced.matches = true;
  const view = setup();
  expectReadable(view.container);
  expect(observed.size).toBe(0);
  expect(animate).not.toHaveBeenCalled();
});

it("cancels running reveals and stops future reveals when reduced motion changes", () => {
  const view = setup();
  enter(view.outcomes.slice(0, 2));
  advance();
  expect(motions).toHaveLength(2);
  enter(view.outcomes.slice(2));
  expect(vi.getTimerCount()).toBe(1);
  reduceMotion();
  expect(vi.getTimerCount()).toBe(0);
  expect(motions.every(motion => motion.cancel.mock.calls.length === 1)).toBe(true);
  expect(disconnect).toHaveBeenCalled();
  enter(view.outcomes.slice(2));
  advance();
  expect(animate).toHaveBeenCalledTimes(2);
  expectReadable(view.container);
});

it.each(["missing", "throws"])("keeps outcomes readable when the Web Animations API %s", failure => {
  if (failure === "missing") Reflect.deleteProperty(HTMLElement.prototype, "animate");
  else animate.mockImplementation(() => { throw new Error("Unsupported animation"); });
  const view = setup();
  expect(() => { enter(view.outcomes); advance(); }).not.toThrow();
  expectReadable(view.container);
  expect(observed.size).toBe(0);
});

it("settles running motion before printing, and cleans up observers, motion, and subscriptions on unmount", () => {
  const removeListener = vi.spyOn(window, "removeEventListener");
  const removeDocumentListener = vi.spyOn(document, "removeEventListener");
  const view = setup();
  enter(view.outcomes.slice(0, 2));
  advance();
  fireEvent(window, new Event("beforeprint"));
  expect(motions.every(motion => motion.cancel.mock.calls.length === 1)).toBe(true);
  expectReadable(view.container);
  enter(view.outcomes.slice(2, 4));
  advance();
  const afterPrint = motions.slice(2);
  act(() => { afterPrint[0].onfinish?.(); });
  enter(view.outcomes.slice(4));
  expect(vi.getTimerCount()).toBe(1);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
  expect(disconnect).toHaveBeenCalled();
  expect(visibilityDisconnect).toHaveBeenCalled();
  expect(afterPrint[0].cancel).not.toHaveBeenCalled();
  expect(afterPrint.slice(1).every(motion => motion.cancel.mock.calls.length === 1)).toBe(true);
  expect(preferenceListeners.size).toBe(0);
  expect(removeListener).toHaveBeenCalledWith("scroll", expect.any(Function));
  expect(removeDocumentListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  expect(removeListener).toHaveBeenCalledWith("beforeprint", expect.any(Function));
});
