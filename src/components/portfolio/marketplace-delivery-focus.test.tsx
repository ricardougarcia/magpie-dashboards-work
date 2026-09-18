import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { marketplaceArtifacts, marketplaceWorkstreams } from "@/data/marketplace";
import { MarketplaceDeliveryFocus } from "./marketplace-delivery-focus";

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");

type MediaStub = {
  matches: boolean;
  media: string;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  listeners: Set<() => void>;
};
type MotionStub = {
  target: Element;
  cancel: ReturnType<typeof vi.fn<() => void>>;
  finish: ReturnType<typeof vi.fn<() => void>>;
  onfinish: (() => void) | null;
  playState: string;
};

let media: Map<string, MediaStub>;
let motions: MotionStub[];
let animate: ReturnType<typeof vi.fn>;
let scrollIntoView: ReturnType<typeof vi.fn>;
let resizeDisconnect: ReturnType<typeof vi.fn>;

function mediaFor(query: string) {
  if (!media.has(query)) {
    const listeners = new Set<() => void>();
    media.set(query, {
      media: query,
      matches: !query.includes("prefers-reduced-motion"),
      listeners,
      addEventListener: vi.fn((_event: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_event: string, listener: () => void) => listeners.delete(listener)),
    });
  }
  return media.get(query)!;
}

function setMedia(part: string, matches: boolean) {
  act(() => {
    for (const [query, match] of media) {
      if (!query.includes(part)) continue;
      match.matches = matches;
      match.listeners.forEach(listener => listener());
    }
  });
}

function advance(milliseconds: number) {
  act(() => { vi.advanceTimersByTime(milliseconds); });
}

function finishMotions(target: Element) {
  act(() => {
    motions.filter(motion => motion.playState === "running" && (motion.target === target || target.contains(motion.target)))
      .forEach(motion => motion.finish());
  });
}

function measuredDisclosure(panel: HTMLElement) {
  const details = panel.querySelector("details")!;
  const summary = details.querySelector("summary")!;
  vi.spyOn(details, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 0, 400, details.open ? 180 : 48));
  vi.spyOn(summary, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 400, 48));
  return { details, summary };
}

function pointer(target: Element, type: "over" | "out", pointerType = "mouse", relatedTarget: Element | null = null) {
  const event = new MouseEvent(`pointer${type}`, { bubbles: true, relatedTarget });
  Object.assign(event, { pointerType });
  fireEvent(target, event);
  const boundary = new MouseEvent(type === "over" ? "pointerenter" : "pointerleave", { relatedTarget });
  Object.assign(boundary, { pointerType });
  fireEvent(target, boundary);
}

function setup(parentOpening = false) {
  const result = render(parentOpening
    ? <div data-confluence data-layout="animated" data-progress="0.5"><MarketplaceDeliveryFocus /></div>
    : <MarketplaceDeliveryFocus />);
  const root = result.container.querySelector<HTMLElement>("[data-delivery-focus]")!;
  const choices = marketplaceWorkstreams.map(work => root.querySelector<HTMLElement>(`[data-delivery-choice="${work.id}"]`)!);
  const panels = marketplaceWorkstreams.map(work => root.querySelector<HTMLElement>(`[data-delivery-panel="${work.id}"]`)!);
  return { ...result, root, choices, panels };
}

function expectSelection(view: ReturnType<typeof setup>, index: number) {
  expect(view.root.dataset.selected).toBe(marketplaceWorkstreams[index].id);
  for (const [position, choice] of view.choices.entries()) {
    expect(choice.getAttribute("aria-pressed")).toBe(String(position === index));
    expect(choice.getAttribute("aria-expanded")).toBe(String(position === index));
    expect(view.panels[position].getAttribute("aria-hidden")).toBe(String(position !== index));
    expect(view.panels[position].hasAttribute("inert")).toBe(position !== index);
  }
  expect(view.panels[index].textContent).toContain(marketplaceWorkstreams[index].body);
}

beforeEach(() => {
  vi.useFakeTimers();
  media = new Map(); motions = [];
  window.history.replaceState(null, "", "/work/marketplace");
  vi.stubGlobal("innerWidth", 1440);
  vi.stubGlobal("innerHeight", 1000);
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("scrollTo", vi.fn((options: ScrollToOptions) => { vi.stubGlobal("scrollY", options.top ?? 0); }));
  vi.stubGlobal("matchMedia", vi.fn(mediaFor));
  resizeDisconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect = resizeDisconnect;
  });
  animate = vi.fn(function (this: Element) {
    const motion: MotionStub = {
      target: this,
      cancel: vi.fn(() => { motion.playState = "idle"; }),
      finish: vi.fn(() => { motion.playState = "finished"; motion.onfinish?.(); }),
      onfinish: null,
      playState: "running",
    };
    motions.push(motion);
    return motion;
  });
  vi.stubGlobal("Animation", class {});
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, writable: true, value: animate });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", {
    configurable: true,
    writable: true,
    value: function (this: Element, options?: { subtree?: boolean }) {
      return motions.filter(motion => motion.playState === "running" && (motion.target === this || (options?.subtree && this.contains(motion.target))));
    },
  });
  scrollIntoView = vi.fn();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, writable: true, value: scrollIntoView });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
  if (originalScrollIntoView) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  window.history.replaceState(null, "", "/");
});

it("keeps all four complete workstreams and native disclosures available in server-rendered reading order", () => {
  const page = document.createElement("div");
  page.innerHTML = renderToString(<MarketplaceDeliveryFocus />);
  expect(page.querySelector<HTMLElement>("[data-delivery-focus]")?.dataset.mode).toBe("reading");
  expect(page.querySelectorAll("[data-delivery-panel]")).toHaveLength(4);
  for (const work of marketplaceWorkstreams) {
    const panel = page.querySelector<HTMLElement>(`#${work.id}`)!;
    expect(panel.textContent).toContain(work.title);
    expect(panel.textContent).toContain(work.body);
    expect(panel.textContent).toContain(work.detail);
    expect(panel.closest("[hidden], [inert], [aria-hidden='true']")).toBeNull();
    const disclosure = panel.querySelector("details")!;
    expect(disclosure.querySelector("summary")?.textContent).toContain(work.detailLabel);
    expect(disclosure.open).toBe(false);
    expect(page.querySelector(`[data-delivery-choice="${work.id}"]`)?.getAttribute("href")).toBe(`#${work.id}`);
  }
});

it("starts with A visible and exposes one selected, reachable tray after enhancement", () => {
  const view = setup();
  expect(view.root.dataset.mode).toBe("focused");
  expectSelection(view, 0);
  for (const [index, choice] of view.choices.entries()) {
    expect(choice.getAttribute("role")).toBe("button");
    expect(choice.getAttribute("aria-controls")).toBe(view.panels[index].id);
  }
});

it("keeps A051 directly inspectable with its planning qualification and native original fallback", () => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }) });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  }) });
  const view = setup();
  const artifact = marketplaceArtifacts.canvasPlan;
  const concept = view.root.querySelector<HTMLElement>(`#${artifact.id}`)!;
  expect(concept.closest("details, [hidden], [inert], [aria-hidden='true']")).toBeNull();
  expect(concept.querySelector("figcaption")?.textContent).toContain(artifact.caption);
  const trigger = view.getByRole("link", { name: "Explore the in-platform discovery concept · A051" }) as HTMLAnchorElement;
  expect(concept.contains(trigger)).toBe(true);
  expect(trigger.getAttribute("aria-label")).toBe(concept.querySelector('span[aria-hidden="true"]')?.textContent);
  expect(trigger.getAttribute("href")).toBe(artifact.src);
  expect(trigger.target).toBe("_blank");
  expect(trigger.rel).toContain("noopener");
  fireEvent.click(trigger);
  const dialog = concept.querySelector("dialog")!;
  expect(dialog.open).toBe(true);
  expect(dialog.textContent).toContain("not a claim that every pictured feature shipped");
  expect(dialog.querySelector("img")?.getAttribute("alt")).toBe(artifact.alt);
  const close = dialog.querySelector<HTMLButtonElement>('button[aria-label="Close image inspection"]')!;
  expect(document.activeElement).toBe(close);
  fireEvent.click(close);
  expect(dialog.open).toBe(false);
  expect(document.activeElement).toBe(trigger);
});

it("opens the primary B tray after a 120ms mouse dwell without clicking or opening its nested disclosure", () => {
  const view = setup();
  pointer(view.choices[1], "over");
  advance(119);
  expectSelection(view, 0);
  advance(1);
  expectSelection(view, 1);
  expect(view.panels[1].querySelector("details")?.open).toBe(false);
});

it("cancels a passing hover before its dwell completes", () => {
  const view = setup();
  pointer(view.choices[1], "over");
  advance(80);
  pointer(view.choices[1], "out");
  advance(200);
  expectSelection(view, 0);
});

it("keeps a selected tray open when the pointer leaves its index item and enters the tray", () => {
  const view = setup();
  pointer(view.choices[2], "over");
  advance(120);
  pointer(view.choices[2], "out", "mouse", view.panels[2]);
  pointer(view.panels[2], "over", "mouse", view.choices[2]);
  advance(1000);
  expectSelection(view, 2);
});

it("cancels a pending next-item hover when the pointer enters the currently open tray", () => {
  const view = setup();
  pointer(view.choices[2], "over");
  advance(70);
  pointer(view.panels[0], "over");
  advance(200);
  expectSelection(view, 0);
});

it.each(["wheel", "touchstart", "keydown"])("cancels pending hover on native %s input", type => {
  const view = setup();
  pointer(view.choices[1], "over");
  advance(70);
  fireEvent(view.root, type === "keydown" ? new KeyboardEvent(type, { key: "PageDown", bubbles: true }) : new Event(type, { bubbles: true }));
  advance(200);
  expectSelection(view, 0);
});

it("ignores touch hover while supporting immediate tap selection", () => {
  const view = setup();
  pointer(view.choices[3], "over", "touch");
  advance(500);
  expectSelection(view, 0);
  fireEvent.click(view.choices[3]);
  expectSelection(view, 3);
});

it.each(["hover", "min-width"])("does not arm mouse hover when the %s capability is unavailable", query => {
  const view = setup();
  setMedia(query, false);
  pointer(view.choices[1], "over");
  advance(300);
  expectSelection(view, 0);
  fireEvent.click(view.choices[1]);
  expectSelection(view, 1);
});

it("brings the phone workspace into view only after explicit selection, not focus or hover", () => {
  const view = setup();
  setMedia("min-width", false);
  fireEvent.focus(view.choices[1]);
  expectSelection(view, 1);
  pointer(view.choices[2], "over");
  advance(120);
  expect(scrollIntoView).not.toHaveBeenCalled();
  fireEvent.click(view.choices[2]);
  expectSelection(view, 2);
  expect(scrollIntoView).toHaveBeenCalledOnce();
  const scrolled = scrollIntoView.mock.instances[0] as HTMLElement;
  expect(scrolled.contains(view.choices[2])).toBe(true);
  expect(scrolled.contains(view.panels[2])).toBe(true);
});

it("selects immediately on keyboard focus and cancels a stale hover on another item", () => {
  const view = setup();
  pointer(view.choices[1], "over");
  advance(50);
  fireEvent.focus(view.choices[3]);
  expectSelection(view, 3);
  advance(200);
  expectSelection(view, 3);
});

it("supports Space activation on the enhanced index without scrolling the page", () => {
  const view = setup();
  const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
  fireEvent(view.choices[2], event);
  expect(event.defaultPrevented).toBe(true);
  expectSelection(view, 2);
});

it("keeps only the latest intent during rapid movement across A, B, and C", () => {
  const view = setup();
  pointer(view.choices[0], "over");
  advance(40);
  pointer(view.choices[1], "over");
  advance(40);
  pointer(view.choices[2], "over");
  advance(119);
  expectSelection(view, 0);
  advance(1);
  expectSelection(view, 2);
  advance(500);
  expectSelection(view, 2);
});

it("keeps nested evidence manual and preserves its open state when reselecting the same workstream", () => {
  const view = setup();
  fireEvent.click(view.choices[1]);
  const details = view.panels[1].querySelector("details")!;
  expect(details.open).toBe(false);
  fireEvent.click(details.querySelector("summary")!);
  expect(details.open).toBe(true);
  const motionCount = animate.mock.calls.length;
  pointer(view.choices[1], "over");
  advance(120);
  fireEvent.focus(view.choices[1]);
  fireEvent.click(view.choices[1]);
  expect(details.open).toBe(true);
  expect(animate.mock.calls.length).toBe(motionCount);
  fireEvent.click(details.querySelector("summary")!);
  finishMotions(details);
  expect(details.open).toBe(false);
});

it("reverses a manual disclosure without stale close callbacks hiding a reopened body", () => {
  const view = setup();
  const { details, summary } = measuredDisclosure(view.panels[0]);
  fireEvent.click(summary);
  const opening = motions.findLast(motion => motion.target === details)!;
  expect(opening).toBeDefined();
  fireEvent.click(summary);
  const closing = motions.findLast(motion => motion.target === details)!;
  expect(closing).not.toBe(opening);
  expect(opening.cancel).toHaveBeenCalled();
  const obsoleteClose = closing.onfinish;
  expect(obsoleteClose).toBeTypeOf("function");
  fireEvent.click(summary);
  expect(closing.cancel).toHaveBeenCalled();
  act(() => { obsoleteClose?.(); });
  finishMotions(details);
  expect(details.open).toBe(true);
  expect(details.style.height).toBe("");
  expect(details.style.overflow).toBe("");
  fireEvent.click(summary);
  finishMotions(details);
  expect(details.open).toBe(false);
});

it.each([true, false])("settles a disclosure to its intended open=%s state when reduced motion changes", open => {
  const view = setup();
  const { details, summary } = measuredDisclosure(view.panels[0]);
  fireEvent.click(summary);
  if (!open) {
    finishMotions(details);
    fireEvent.click(summary);
  }
  const running = motions.filter(motion => motion.playState === "running" && (motion.target === details || details.contains(motion.target)));
  expect(running.length).toBeGreaterThan(0);
  setMedia("prefers-reduced-motion", true);
  expect(details.open).toBe(open);
  expect(details.style.height).toBe("");
  expect(details.style.overflow).toBe("");
  expect(running.every(motion => motion.cancel.mock.calls.length > 0 || motion.finish.mock.calls.length > 0)).toBe(true);
});

it("cancels a disclosure reveal when switching workstreams so it cannot reopen the old tray", () => {
  const view = setup();
  const { details, summary } = measuredDisclosure(view.panels[0]);
  fireEvent.click(summary);
  const opening = motions.findLast(motion => motion.target === details)!;
  const obsoleteOpen = opening.onfinish;
  fireEvent.click(view.choices[1]);
  expect(opening.cancel).toHaveBeenCalled();
  act(() => { obsoleteOpen?.(); });
  expectSelection(view, 1);
  expect(details.open).toBe(false);
});

it("does not hide a keyboard-focused disclosure because a pointer crosses another item", () => {
  const view = setup();
  const summary = view.panels[0].querySelector("summary")!;
  fireEvent.keyDown(view.root, { key: "Tab" });
  act(() => { summary.focus(); });
  pointer(view.choices[2], "over");
  advance(120);
  expectSelection(view, 0);
  expect(document.activeElement).toBe(summary);
  expect(summary.closest("[inert], [aria-hidden='true']")).toBeNull();
});

it("allows hovering another workstream after the mouse has focused a disclosure", () => {
  const view = setup();
  const summary = view.panels[0].querySelector("summary")!;
  const down = new MouseEvent("pointerdown", { bubbles: true, button: 0 });
  Object.assign(down, { pointerType: "mouse" });
  fireEvent(summary, down);
  act(() => { summary.focus(); });
  fireEvent.click(summary);
  expect(document.activeElement).toBe(summary);
  pointer(view.choices[2], "over");
  advance(120);
  expectSelection(view, 2);
  expect(view.panels[0].querySelector("details")?.open).toBe(false);
});

it.each(marketplaceWorkstreams.map((work, index) => [work.id, index] as const))("opens the linked %s tray during initial hydration", (id, index) => {
  window.history.replaceState(null, "", `/work/marketplace#${id}`);
  const view = setup();
  expectSelection(view, index);
  expect(view.panels[index].closest("[hidden], [inert], [aria-hidden='true']")).toBeNull();
});

it("makes later workstream hash targets reachable without changing unrelated section links", () => {
  const view = setup();
  window.history.replaceState(null, "", "/work/marketplace#sunset-legacy");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expectSelection(view, 3);
  window.history.replaceState(null, "", "/work/marketplace#impact");
  fireEvent(window, new HashChangeEvent("hashchange"));
  expectSelection(view, 3);
});

it("keeps selection and disclosures operable with reduced motion and starts no panel animations", () => {
  mediaFor("(prefers-reduced-motion: reduce)").matches = true;
  const view = setup();
  setMedia("prefers-reduced-motion", true);
  animate.mockClear();
  fireEvent.click(view.choices[2]);
  expectSelection(view, 2);
  pointer(view.choices[3], "over");
  advance(120);
  expectSelection(view, 3);
  const disclosure = view.panels[3].querySelector("details")!;
  fireEvent.click(disclosure.querySelector("summary")!);
  expect(disclosure.open).toBe(true);
  expect(animate).not.toHaveBeenCalled();
});

it("keeps the workstreams selectable when the browser has no Web Animations API", () => {
  delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  delete (HTMLElement.prototype as Partial<HTMLElement>).getAnimations;
  const view = setup();
  fireEvent.click(view.choices[2]);
  expectSelection(view, 2);
  pointer(view.choices[3], "over");
  advance(120);
  expectSelection(view, 3);
});

it("settles an in-flight selection and cancels delayed hover when reduced motion changes", () => {
  const view = setup();
  fireEvent.click(view.choices[1]);
  const running = motions.filter(motion => motion.playState === "running");
  expect(running.length).toBeGreaterThan(0);
  pointer(view.choices[3], "over");
  advance(60);
  setMedia("prefers-reduced-motion", true);
  advance(200);
  expectSelection(view, 1);
  expect(running.every(motion => motion.cancel.mock.calls.length > 0 || motion.finish.mock.calls.length > 0)).toBe(true);
});

it("cleans up pending hover, motion, and subscribed media on unmount", () => {
  const view = setup();
  fireEvent.click(view.choices[1]);
  const running = motions.filter(motion => motion.playState === "running");
  pointer(view.choices[2], "over");
  const mediaBefore = [...media.values()].filter(match => match.listeners.size > 0);
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
  advance(1000);
  expect(running.every(motion => motion.cancel.mock.calls.length > 0 || motion.finish.mock.calls.length > 0)).toBe(true);
  expect(mediaBefore.every(match => match.listeners.size === 0)).toBe(true);
  expect(resizeDisconnect).toHaveBeenCalled();
});

function measureSequence(view: ReturnType<typeof setup>, height = 620) {
  const stage = view.root.querySelector<HTMLElement>("[data-delivery-stage]")!;
  let stageHeight = height;
  Object.defineProperty(stage, "offsetHeight", { configurable: true, get: () => stageHeight });
  Object.defineProperty(view.root, "offsetHeight", { configurable: true, get: () => stageHeight + (view.root.dataset.scroll === "pinned" ? parseFloat(view.root.style.getPropertyValue("--delivery-travel")) : 0) });
  vi.spyOn(view.root, "getBoundingClientRect").mockImplementation(() => new DOMRect(0, 1000 - window.scrollY, 1280, view.root.offsetHeight));
  fireEvent.resize(window);
  const start = 1000 - parseFloat(view.root.style.getPropertyValue("--delivery-top"));
  const travel = parseFloat(view.root.style.getPropertyValue("--delivery-travel"));
  return {
    start, travel,
    move: (progress: number) => {
      vi.stubGlobal("scrollY", start + travel * progress);
      fireEvent.scroll(window);
      advance(20);
    },
    height: (value: number) => { stageHeight = value; fireEvent.resize(window); },
  };
}

it("pins a fitting section below both headers and reports the first scroll before advancing A through D", () => {
  const view = setup();
  const scroll = measureSequence(view);
  expect(view.root.dataset.scroll).toBe("pinned");
  expect(view.root.style.getPropertyValue("--delivery-top")).toBe("132px");
  const cue = view.root.querySelector<HTMLElement>("[data-scroll-progress]")!;
  scroll.move(.001);
  expectSelection(view, 0);
  expect(parseFloat(cue.style.getPropertyValue("--scroll-progress"))).toBeGreaterThan(0);
  scroll.move(.3); expectSelection(view, 1);
  scroll.move(.6); expectSelection(view, 2);
  scroll.move(.9); expectSelection(view, 3);
  expect(cue.querySelector<HTMLAnchorElement>("[data-scroll-next]")?.hidden).toBe(false);
  expect(cue.querySelector("[data-scroll-next]")?.getAttribute("href")).toBe("#impact");
  scroll.move(1.2); expectSelection(view, 3);
  scroll.move(.6); expectSelection(view, 2);
  scroll.move(.3); expectSelection(view, 1);
  scroll.move(-.1); expectSelection(view, 0);
});

it("synchronizes an explicit selection with native scroll so the following movement continues from that workstream", () => {
  const view = setup();
  const scroll = measureSequence(view);
  scroll.move(.1);
  fireEvent.click(view.choices[2]);
  expectSelection(view, 2);
  expect(window.scrollTo).toHaveBeenLastCalledWith({ top: scroll.start + scroll.travel * .56, behavior: "instant" });
  scroll.move(.57);
  expectSelection(view, 2);
  scroll.move(.85);
  expectSelection(view, 3);
});

it("aligns a workstream deep link after the parent handoff lands so the next scroll does not replace the linked panel", () => {
  const view = setup(true);
  const scroll = measureSequence(view);
  window.history.replaceState(null, "", `/work/marketplace#${marketplaceWorkstreams[3].id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  expectSelection(view, 3);
  view.root.closest<HTMLElement>("[data-confluence]")!.dataset.progress = "1";
  fireEvent(view.root, new CustomEvent("delivery-navigate", { detail: marketplaceWorkstreams[3].id }));
  expect(window.scrollY).toBe(scroll.start + scroll.travel * .84);
  scroll.move(.85);
  expectSelection(view, 3);
});

it("does not advance Delivery from the parent catalog's temporary sticky geometry", () => {
  const view = setup(true);
  const scroll = measureSequence(view);
  scroll.move(.9);
  expectSelection(view, 0);
  view.root.closest<HTMLElement>("[data-confluence]")!.dataset.progress = "1";
  scroll.move(.91);
  expectSelection(view, 3);
});

it("releases the runway when content no longer fits and retains the selected disclosure for natural reading", () => {
  const view = setup();
  const scroll = measureSequence(view);
  scroll.move(.3);
  const detail = view.panels[1].querySelector("details")!;
  fireEvent.click(detail.querySelector("summary")!);
  finishMotions(detail);
  scroll.height(950);
  expect(view.root.dataset.scroll).toBe("natural");
  expect(detail.open).toBe(true);
  scroll.move(.9);
  expectSelection(view, 1);
  expect(detail.open).toBe(true);
});

it.each(["min-width", "prefers-reduced-motion"])("keeps native reading and direct choices available for the %s fallback", query => {
  const view = setup();
  const scroll = measureSequence(view);
  setMedia(query, query === "prefers-reduced-motion");
  expect(view.root.dataset.scroll).toBe("natural");
  scroll.move(.9);
  expectSelection(view, 0);
  fireEvent.click(view.choices[2]);
  expectSelection(view, 2);
});

it("does not replace a keyboard-focused disclosure during scroll or leave an animation frame after unmount", () => {
  const view = setup();
  const scroll = measureSequence(view);
  scroll.move(.01);
  fireEvent.keyDown(view.root, { key: "Tab" });
  act(() => { view.panels[0].querySelector("summary")!.focus(); });
  scroll.move(.6);
  expectSelection(view, 0);
  vi.stubGlobal("scrollY", scroll.start + scroll.travel * .9);
  fireEvent.scroll(window);
  expect(vi.getTimerCount()).toBeGreaterThan(0);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
