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

function enter(targets: Element[], isIntersecting = true) {
  const entries = targets.filter(target => observed.has(target)).map(target => ({ target, isIntersecting } as IntersectionObserverEntry));
  act(() => { if (entries.length) intersect(entries, observer); });
}

function reduceMotion() {
  reduced.matches = true;
  act(() => { preferenceListeners.forEach(listener => listener()); });
}

function setup() {
  const result = render(<MarketplaceImpact />);
  const outcomes = [...result.container.querySelectorAll("dl > div")];
  return { ...result, outcomes };
}

function expectReadable(container: Element) {
  const values = [...container.querySelectorAll("dl > div > dd:first-of-type")];
  expect(values.map(value => value.textContent)).toEqual(["#1", "102%", "$2M+", "+95%", "40+ hr/wk"]);
  for (const value of values) expect(value.closest("details, [hidden], [inert], [aria-hidden='true']")).toBeNull();
}

beforeEach(() => {
  observed = new Set(); motions = []; preferenceListeners = new Set();
  unobserve = vi.fn((target: Element) => observed.delete(target));
  disconnect = vi.fn(() => observed.clear());
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { intersect = callback; observer = this as unknown as IntersectionObserver; }
    observe(target: Element) { observed.add(target); }
    unobserve = unobserve;
    disconnect = disconnect;
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalAnimate) Object.defineProperty(HTMLElement.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(HTMLElement.prototype, "animate");
});

it("renders final values before hydration with the source disclosure separately available", () => {
  const container = document.createElement("div");
  container.innerHTML = renderToString(<MarketplaceImpact />);
  expectReadable(container);
  expect(container.querySelector("details summary")?.textContent).toContain("About the reported outcomes");
  expect(container.querySelector("details")?.open).toBe(false);
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
  expect(animate).not.toHaveBeenCalled();
  enter(view.outcomes.slice(0, 3));
  expect(animate).toHaveBeenCalledTimes(3);
  for (const outcome of view.outcomes.slice(0, 3)) expect(unobserve).toHaveBeenCalledWith(outcome);
  expect(motions.every(motion => motion.target.closest("dd") && !motion.target.closest("dt"))).toBe(true);
  enter(view.outcomes.slice(0, 3), false);
  enter(view.outcomes.slice(0, 3));
  expect(animate).toHaveBeenCalledTimes(3);
  enter(view.outcomes.slice(3));
  expect(animate).toHaveBeenCalledTimes(5);
  expect(observed.size).toBe(0);
  expectReadable(view.container);
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
  expect(motions).toHaveLength(2);
  reduceMotion();
  expect(motions.every(motion => motion.cancel.mock.calls.length === 1)).toBe(true);
  expect(disconnect).toHaveBeenCalled();
  enter(view.outcomes.slice(2));
  expect(animate).toHaveBeenCalledTimes(2);
  expectReadable(view.container);
});

it.each(["missing", "throws"])("keeps outcomes readable when the Web Animations API %s", failure => {
  if (failure === "missing") Reflect.deleteProperty(HTMLElement.prototype, "animate");
  else animate.mockImplementation(() => { throw new Error("Unsupported animation"); });
  const view = setup();
  expect(() => enter(view.outcomes)).not.toThrow();
  expectReadable(view.container);
  expect(observed.size).toBe(0);
});

it("settles running motion before printing, and cleans up observers, motion, and subscriptions on unmount", () => {
  const removeListener = vi.spyOn(window, "removeEventListener");
  const view = setup();
  enter(view.outcomes.slice(0, 2));
  fireEvent(window, new Event("beforeprint"));
  expect(motions.every(motion => motion.cancel.mock.calls.length === 1)).toBe(true);
  expectReadable(view.container);
  enter(view.outcomes.slice(2));
  const afterPrint = motions.slice(2);
  act(() => { afterPrint[0].onfinish?.(); });
  view.unmount();
  expect(disconnect).toHaveBeenCalled();
  expect(afterPrint[0].cancel).not.toHaveBeenCalled();
  expect(afterPrint.slice(1).every(motion => motion.cancel.mock.calls.length === 1)).toBe(true);
  expect(preferenceListeners.size).toBe(0);
  expect(removeListener).toHaveBeenCalledWith("beforeprint", expect.any(Function));
});
