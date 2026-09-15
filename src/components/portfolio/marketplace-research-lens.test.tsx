import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import type { CSSProperties } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MarketplaceResearchLens } from "./marketplace-research-lens";
import { researchNeeds } from "./marketplace-research-sequence";

const outerTravel = 2400;
const relativeTop = 300;
const stickyTop = 72 + 58 + 16;
const researchStart = 72 + outerTravel + relativeTop - stickyTop;
let scrollY: number;
let clock: number;
let stageHeight: number;
let readingHeight: number;
let stageReads: number;
let fieldWidth: number;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let resizeCallbacks: Array<() => void>;
let resizeDisconnect: ReturnType<typeof vi.fn>;
let mutationDisconnect: ReturnType<typeof vi.fn>;
let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };

function flushFrame(elapsed = 0) {
  clock += elapsed;
  act(() => {
    const pending = [...frames.entries()];
    pending.forEach(([id, callback]) => { if (frames.delete(id)) callback(clock); });
  });
}

function settleLayout() {
  for (let frame = 0; frame < 4; frame++) flushFrame(16);
}

function scrollToY(y: number) {
  scrollY = y;
  fireEvent.scroll(window);
  flushFrame();
}

function scrollToProgress(root: HTMLElement, progress: number) {
  scrollToY(researchStart + progress * parseFloat(root.style.getPropertyValue("--lens-travel")));
}

function movePointer(target: Element) {
  const event = new Event("pointermove", { bubbles: true });
  Object.assign(event, { pointerType: "mouse", movementX: 4, movementY: 0 });
  fireEvent(target, event);
}

function leavePointer(target: Element, relatedTarget: Element | null) {
  fireEvent(target, new MouseEvent("pointerout", { bubbles: true, relatedTarget }));
}

function setup() {
  const result = render(<div data-portfolio-view="project"><header className="masthead">Portfolio</header>
    <div data-confluence data-layout="animated" style={{ "--travel": `${outerTravel}px` } as CSSProperties}>
      <div data-sequence-runway><div data-confluence-stage>
        <nav data-marketplace-navigation>Research</nav><MarketplaceResearchLens /><div id="orchestration" data-after-lens>Delivery</div>
      </div></div>
    </div>
  </div>);
  const root = result.container.querySelector<HTMLElement>("[data-research-lens]")!;
  return { ...result, root, notes: [...root.querySelectorAll<HTMLElement>("[data-lens-note]")] };
}

beforeEach(() => {
  scrollY = 0; clock = 1000; stageHeight = 540; readingHeight = 1500; stageReads = 0; fieldWidth = 1040;
  frames = new Map(); nextFrame = 0; resizeCallbacks = [];
  resizeDisconnect = vi.fn(); mutationDisconnect = vi.fn();
  media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("innerWidth", 1366); vi.stubGlobal("innerHeight", 778);
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal("ResizeObserver", class { constructor(callback: () => void) { resizeCallbacks.push(callback); } observe() {} disconnect = resizeDisconnect; });
  vi.stubGlobal("MutationObserver", class { observe() {} disconnect = mutationDisconnect; });
  vi.spyOn(performance, "now").mockImplementation(() => clock);
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
  vi.spyOn(window, "scrollTo").mockImplementation(((options: ScrollToOptions | number, y?: number) => {
    scrollY = typeof options === "number" ? y ?? scrollY : options.top ?? scrollY;
    fireEvent.scroll(window);
  }) as typeof window.scrollTo);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
    if (this.matches(".masthead")) return 72;
    if (this.hasAttribute("data-marketplace-navigation")) return 58;
    if (this.hasAttribute("data-lens-viewport")) return window.innerHeight;
    if (this.hasAttribute("data-lens-stage")) { stageReads++; return this.closest<HTMLElement>("[data-research-lens]")?.dataset.mode === "reading" ? readingHeight : stageHeight; }
    if (this.hasAttribute("data-research-lens")) return this.dataset.mode === "animated" ? stageHeight + parseFloat(this.style.getPropertyValue("--lens-travel")) : this.dataset.mode === "reading" ? readingHeight : stageHeight;
    return 100;
  });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(function (this: HTMLElement) {
    return this.matches("[data-lens-field], [data-lens-controls]") ? fieldWidth : 100;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const outer = document.querySelector<HTMLElement>("[data-confluence]");
    const currentOuterTravel = outer ? parseFloat(outer.style.getPropertyValue("--travel")) : outerTravel;
    const outerStageTop = 72 - Math.max(0, scrollY - currentOuterTravel);
    const fieldTop = Math.max(stickyTop, outerStageTop + relativeTop) + 76;
    if (this.hasAttribute("data-sequence-runway")) return new DOMRect(0, 72 - scrollY, window.innerWidth, currentOuterTravel + 700);
    if (this.hasAttribute("data-confluence-stage")) return new DOMRect(0, outerStageTop, window.innerWidth, 700);
    if (this.hasAttribute("data-research-lens")) return new DOMRect(100, outerStageTop + relativeTop, fieldWidth, this.offsetHeight);
    if (this.hasAttribute("data-after-lens")) return new DOMRect(100, outerStageTop + relativeTop + this.previousElementSibling!.getBoundingClientRect().height + 400, fieldWidth, 200);
    if (this.hasAttribute("data-lens-field")) return new DOMRect(100, fieldTop, fieldWidth, 370);
    if (this.hasAttribute("data-lens-zone")) return new DOMRect(420, fieldTop + Number(this.dataset.lensZone) * 100, 400, 100);
    if (this.hasAttribute("data-lens-note")) {
      const normalFlow = this.closest<HTMLElement>("[data-research-lens]")?.dataset.mode === "reading";
      const noteTop = normalFlow ? outerStageTop + relativeTop + 250 + Number(this.dataset.topic) * 320 + (this.dataset.perspective === "provider" ? 160 : 0) : fieldTop + 80;
      return new DOMRect(this.dataset.perspective === "educator" ? 100 : 900, noteTop, 200, 140);
    }
    return new DOMRect(0, 0, 100, 100);
  });
});

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function expectReading(root: HTMLElement, notes: HTMLElement[]) {
  expect(root.dataset.mode).toBe("reading");
  expect(root.style.getPropertyValue("--lens-travel")).toBe("0px");
  for (const note of notes) {
    expect(note.hidden).toBe(false);
    expect(note.style.opacity).toBe("1");
    expect(note.style.transform).toBe("none");
    expect(note.getAttribute("aria-hidden")).toBe("false");
  }
  expect(root.querySelector("[data-lens-caption]")?.textContent).toBe("Three paired needs / One listing");
  expect(root.querySelector<HTMLElement>("[data-lens-shared]")?.style.opacity).toBe("1");
  root.querySelectorAll<HTMLButtonElement>("button").forEach(button => expect(button.disabled).toBe(true));
}

it("renders all six paired needs, the illustrative qualification, and the conclusion without JavaScript", () => {
  const page = document.createElement("div");
  page.innerHTML = renderToString(<MarketplaceResearchLens />);
  expect(page.querySelector<HTMLElement>("[data-research-lens]")?.dataset.mode).toBe("reading");
  const notes = page.querySelectorAll<HTMLElement>("[data-lens-note]");
  expect(notes).toHaveLength(6);
  for (const [topic, need] of researchNeeds.entries()) {
    for (const perspective of ["educator", "provider"] as const) {
      const note = page.querySelector(`[data-topic="${topic}"][data-perspective="${perspective}"]`)!;
      expect(note.textContent).toContain(need[perspective].title);
      expect(note.textContent).toContain(need[perspective].body);
      expect(note.closest("[hidden], [inert], [aria-hidden='true']")).toBeNull();
    }
  }
  expect(page.querySelector("figcaption")?.textContent).toBe("Conceptual listing · no specific product or certification");
  expect(page.querySelector("[data-lens-caption]")?.textContent).toBe("Three paired needs / One listing");
  expect(page.querySelector("[data-lens-shared]")?.textContent).toContain("The same point of connection.");
  expect(page.querySelector('a[href="#orchestration"]')?.textContent).toBe("Continue to Delivery");
  expect(page.querySelectorAll("img, video, iframe, details, input[type=range], select, [data-marketplace-artifact]")).toHaveLength(0);
  expect(page.textContent).not.toMatch(/Play sequence|Pause|Tweak|Additional artifacts/i);
  page.querySelectorAll<HTMLButtonElement>("button").forEach(button => expect(button.disabled).toBe(true));
});

it.each([[1366, 778], [1280, 720]])("enables the lens at %sx%s when its measured composition fits", (width, height) => {
  vi.stubGlobal("innerWidth", width); vi.stubGlobal("innerHeight", height);
  const { root } = setup();
  expect(root.dataset.mode).toBe("animated");
  expect(root.dataset.reason).toBe("fits");
  expect(root.style.getPropertyValue("--lens-top")).toBe("146px");
  expect(root.style.getPropertyValue("--lens-height")).toBe("540px");
  expect(root.querySelector<HTMLButtonElement>('[data-lens-choice="educator"]')?.disabled).toBe(false);
});

it.each(["reduced", "short phone", "content overflow", "zero measurement"])("keeps all paired needs in reading flow for %s", reason => {
  if (reason === "reduced") media.matches = true;
  if (reason === "short phone") { vi.stubGlobal("innerWidth", 390); vi.stubGlobal("innerHeight", 700); fieldWidth = 342; }
  if (reason === "content overflow") stageHeight = 900;
  if (reason === "zero measurement") stageHeight = 0;
  const { root, notes } = setup();
  expectReading(root, notes);
});

it("keeps Research at its beginning while the outer Catalog scene is pinned", () => {
  const { root } = setup();
  for (const y of [0, 600, 1200, 2300, 1200]) {
    scrollToY(y);
    expect(root.dataset.progress).toBe("0");
    expect(root.dataset.topic).toBe("0");
    expect(root.dataset.perspective).toBe("educator");
  }
});

it.each([0, 1200, 2300])("derives the same future Research selection destination during the Catalog hold at scrollY %s", y => {
  const { root } = setup();
  scrollToY(y);
  fireEvent.click(root.querySelector('[data-lens-choice="provider"]')!);
  flushFrame(850);
  expect(window.scrollY).toBeCloseTo(researchStart + .57 * parseFloat(root.style.getPropertyValue("--lens-travel")));
  expect(Number(root.dataset.progress)).toBeCloseTo(.57);
  expect(root.dataset.perspective).toBe("provider");
});

it("follows native progress and reverses through all six needs after the outer scene releases", () => {
  const { root, notes } = setup();
  const stops = [[0, 0, "educator"], [.16, 1, "educator"], [.32, 2, "educator"], [.57, 0, "provider"], [.70, 1, "provider"], [.83, 2, "provider"]] as const;
  for (const [progress, topic, perspective] of [...stops, ...[...stops].reverse()]) {
    scrollToProgress(root, progress);
    expect(Number(root.dataset.progress)).toBeCloseTo(progress);
    expect(Number(root.dataset.topic)).toBe(topic);
    expect(root.dataset.perspective).toBe(perspective);
    expect(notes.filter(note => !note.hidden)).toHaveLength(2);
    const active = notes.find(note => Number(note.dataset.topic) === topic && note.dataset.perspective === perspective)!;
    expect(active.style.opacity).toBe("1");
    expect(active.getAttribute("aria-hidden")).toBe("false");
    expect(root.querySelector("[data-lens-caption]")?.textContent).toBe(researchNeeds[topic].label);
  }
});

it("expresses the lens midpoint and shared conclusion in the actual controls and annotations", () => {
  const { root, notes } = setup();
  scrollToProgress(root, .5);
  const active = notes.filter(note => !note.hidden);
  active.forEach(note => expect(parseFloat(note.style.opacity)).toBeCloseTo(.5));
  const marker = root.querySelector<HTMLElement>("[data-lens-marker]")!;
  expect(marker.style.transform).toBe("translateX(498px)");
  scrollToProgress(root, 1);
  expect(root.dataset.perspective).toBe("both");
  expect(marker.style.width).toBe("1040px");
  expect(marker.style.transform).toBe("translateX(0px)");
  root.querySelectorAll('[data-lens-choice]').forEach(button => expect(button.getAttribute("aria-pressed")).toBe("true"));
  expect(root.querySelector("[data-lens-shared]")?.getAttribute("aria-hidden")).toBe("false");
});

it("keeps the selected need when choosing another perspective, then supports a different listing region", () => {
  const { root } = setup();
  scrollToProgress(root, .32);
  fireEvent.click(root.querySelector('[data-lens-choice="provider"]')!);
  flushFrame(850);
  expect(Number(root.dataset.progress)).toBeCloseTo(.83);
  expect(root.dataset.topic).toBe("2");
  expect(root.querySelector("[data-lens-status]")?.textContent).toBe("Provider perspective: Contact & inquiries");
  fireEvent.click(root.querySelector('[data-lens-zone="0"]')!);
  flushFrame(850);
  expect(Number(root.dataset.progress)).toBeCloseTo(.57);
  expect(root.dataset.topic).toBe("0");
});

it("does not change the current need when a pointer crosses a listing region on its way to a perspective control", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const { root } = setup();
  scrollToProgress(root, 0);
  const zone = root.querySelector('[data-lens-zone="2"]')!;
  const provider = root.querySelector('[data-lens-choice="provider"]')!;
  movePointer(zone);
  act(() => vi.advanceTimersByTime(80));
  leavePointer(zone, provider);
  act(() => vi.advanceTimersByTime(200));
  flushFrame(850);
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(root.dataset.topic).toBe("0");
  fireEvent.click(provider);
  flushFrame(850);
  expect(Number(root.dataset.progress)).toBeCloseTo(.57);
  expect(root.dataset.topic).toBe("0");
});

it("selects a listing region only after a deliberate 120ms hover dwell", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const { root } = setup();
  scrollToProgress(root, 0);
  movePointer(root.querySelector('[data-lens-zone="1"]')!);
  act(() => vi.advanceTimersByTime(119));
  flushFrame(850);
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(root.dataset.topic).toBe("0");
  act(() => vi.advanceTimersByTime(1));
  flushFrame(850);
  expect(Number(root.dataset.progress)).toBeCloseTo(.16);
  expect(root.dataset.topic).toBe("1");
  expect(root.querySelector("[data-lens-status]")?.textContent).toBe("Educator perspective: Evaluation & ownership");
});

it.each(["wheel", "pointer leave", "touchstart", "Escape", "Tab", "resize"])("cancels a pending hover selection after %s", input => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const { root } = setup();
  scrollToProgress(root, 0);
  const zone = root.querySelector('[data-lens-zone="2"]')!;
  movePointer(zone);
  act(() => vi.advanceTimersByTime(80));
  if (input === "pointer leave") leavePointer(zone, null);
  else if (input === "Escape" || input === "Tab") fireEvent.keyDown(document, { key: input });
  else fireEvent(window, new Event(input));
  flushFrame();
  act(() => vi.advanceTimersByTime(200));
  flushFrame(850);
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(root.dataset.topic).toBe("0");
});

it("removes a pending hover timer when the lens unmounts", () => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  const { root, unmount } = setup();
  movePointer(root.querySelector('[data-lens-zone="2"]')!);
  expect(vi.getTimerCount()).toBe(1);
  unmount();
  expect(vi.getTimerCount()).toBe(0);
  act(() => vi.advanceTimersByTime(200));
  flushFrame(850);
  expect(window.scrollTo).not.toHaveBeenCalled();
});

it("lets keyboard focus discover a listing region", () => {
  const { root } = setup();
  scrollToProgress(root, 0);
  const zone = root.querySelector<HTMLButtonElement>('[data-lens-zone="1"]')!;
  act(() => zone.focus());
  flushFrame(850);
  expect(document.activeElement).toBe(zone);
  expect(Number(root.dataset.progress)).toBeCloseTo(.16);
  expect(zone.getAttribute("aria-pressed")).toBe("true");
});

it("follows the newest focused listing region when keyboard focus moves before a settle completes", () => {
  const { root } = setup();
  scrollToProgress(root, 0);
  const first = root.querySelector<HTMLButtonElement>('[data-lens-zone="0"]')!;
  const last = root.querySelector<HTMLButtonElement>('[data-lens-zone="2"]')!;
  act(() => first.focus());
  flushFrame(200);
  act(() => last.focus());
  flushFrame(850);
  expect(document.activeElement).toBe(last);
  expect(root.dataset.topic).toBe("2");
  expect(Number(root.dataset.progress)).toBeCloseTo(.32);
  expect(last.getAttribute("aria-pressed")).toBe("true");
});

it.each(["wheel", "touchstart", "Escape", "native scroll"])("stops a direct-selection animation when the reader supplies %s", input => {
  const { root } = setup();
  scrollToProgress(root, 0);
  fireEvent.click(root.querySelector('[data-lens-choice="provider"]')!);
  flushFrame(200);
  const calls = vi.mocked(window.scrollTo).mock.calls.length;
  if (input === "Escape") fireEvent.keyDown(document, { key: "Escape" });
  else if (input === "native scroll") { scrollY += 40; fireEvent.scroll(window); }
  else fireEvent(window, new Event(input));
  const chosenY = window.scrollY;
  flushFrame(1000); flushFrame();
  expect(vi.mocked(window.scrollTo).mock.calls).toHaveLength(calls);
  expect(window.scrollY).toBe(chosenY);
});

it.each(["resize", "reduced motion"])("cancels an in-flight selection when %s requires a fresh layout measurement", change => {
  const { root } = setup();
  scrollToProgress(root, 0);
  fireEvent.click(root.querySelector('[data-lens-choice="provider"]')!);
  flushFrame(200);
  if (change === "resize") fireEvent.resize(window);
  else { media.matches = true; act(() => media.addEventListener.mock.calls[0][1]()); }
  flushFrame();
  const calls = vi.mocked(window.scrollTo).mock.calls.length;
  const settledY = window.scrollY;
  flushFrame(1000); flushFrame();
  expect(vi.mocked(window.scrollTo).mock.calls).toHaveLength(calls);
  expect(window.scrollY).toBe(settledY);
});

it("keeps the measured runway constant during ordinary scroll rendering", () => {
  const { root } = setup();
  const height = root.style.getPropertyValue("--lens-height");
  const travel = root.style.getPropertyValue("--lens-travel");
  const reads = stageReads;
  for (const progress of [0, .16, .32, .5, .57, .7, .83, 1, .5, 0]) {
    scrollToProgress(root, progress);
    expect(root.style.getPropertyValue("--lens-height")).toBe(height);
    expect(root.style.getPropertyValue("--lens-travel")).toBe(travel);
  }
  expect(stageReads).toBe(reads);
});

it("restores all notes when a motion-preference change enters reading mode", () => {
  const { root, notes } = setup();
  scrollToProgress(root, .70);
  media.matches = true;
  act(() => media.addEventListener.mock.calls[0][1]());
  flushFrame();
  expectReading(root, notes);
});

it("keeps the active provider need in view when switching to reading flow within Research", () => {
  const { root, notes } = setup();
  scrollToProgress(root, .70);
  media.matches = true;
  act(() => media.addEventListener.mock.calls[0][1]());
  flushFrame();
  expectReading(root, notes);
  const provider = notes.find(note => note.dataset.topic === "1" && note.dataset.perspective === "provider")!;
  expect(provider.getBoundingClientRect().top).toBeCloseTo(stickyTop);
});

it("preserves the following section's reading position when Research changes modes in either direction", () => {
  const { root, container } = setup();
  scrollToProgress(root, 1.4);
  const following = container.querySelector<HTMLElement>("[data-after-lens]")!;
  const before = following.getBoundingClientRect().top;
  media.matches = true;
  act(() => media.addEventListener.mock.calls[0][1]());
  flushFrame();
  expect(root.dataset.mode).toBe("reading");
  expect(following.getBoundingClientRect().top).toBeCloseTo(before);
  media.matches = false;
  act(() => media.addEventListener.mock.calls[0][1]());
  flushFrame();
  expect(root.dataset.mode).toBe("animated");
  expect(following.getBoundingClientRect().top).toBeCloseTo(before);
});

it("preserves the selected need through sequential viewport changes when the parent repositions scroll before Research measures", () => {
  const { root, notes } = setup();
  const outer = root.closest<HTMLElement>("[data-confluence]")!;
  const provider = notes.find(note => note.dataset.topic === "1" && note.dataset.perspective === "provider")!;
  scrollToProgress(root, .70);

  vi.stubGlobal("innerWidth", 390); vi.stubGlobal("innerHeight", 844); fieldWidth = 342;
  fireEvent.resize(window);
  outer.dataset.layout = "reading"; outer.style.setProperty("--travel", "0px");
  scrollY -= outerTravel;
  fireEvent.scroll(window);
  settleLayout();
  expectReading(root, notes);
  expect(provider.getBoundingClientRect().top).toBeCloseTo(stickyTop);

  vi.stubGlobal("innerHeight", 700);
  fireEvent.resize(window);
  scrollY -= 500; // The outer scene preserves its own anchor before this child measures.
  fireEvent.scroll(window);
  settleLayout();
  expectReading(root, notes);
  expect(provider.getBoundingClientRect().top).toBeCloseTo(stickyTop);

  vi.stubGlobal("innerWidth", 1366); vi.stubGlobal("innerHeight", 778); fieldWidth = 1040;
  fireEvent.resize(window);
  outer.dataset.layout = "animated"; outer.style.setProperty("--travel", `${outerTravel}px`);
  scrollY += outerTravel - 300;
  fireEvent.scroll(window);
  settleLayout();
  expect(root.dataset.mode).toBe("animated");
  expect(Number(root.dataset.progress)).toBeCloseTo(.70);
  expect(root.dataset.topic).toBe("1");
  expect(root.dataset.perspective).toBe("provider");
});

it("preserves Delivery's previous viewport offset when an outer resize repositions scroll before Research measures", () => {
  const { root, container } = setup();
  const outer = root.closest<HTMLElement>("[data-confluence]")!;
  const following = container.querySelector<HTMLElement>("[data-after-lens]")!;
  scrollToProgress(root, 1.4);
  const before = following.getBoundingClientRect().top;

  vi.stubGlobal("innerWidth", 390); vi.stubGlobal("innerHeight", 844); fieldWidth = 342;
  fireEvent.resize(window);
  outer.dataset.layout = "reading"; outer.style.setProperty("--travel", "0px");
  scrollY -= outerTravel - 320;
  fireEvent.scroll(window);
  settleLayout();
  expect(root.dataset.mode).toBe("reading");
  expect(following.getBoundingClientRect().top).toBeCloseTo(before);

  vi.stubGlobal("innerWidth", 1366); vi.stubGlobal("innerHeight", 778); fieldWidth = 1040;
  fireEvent.resize(window);
  outer.dataset.layout = "animated"; outer.style.setProperty("--travel", `${outerTravel}px`);
  scrollY += outerTravel + 200;
  fireEvent.scroll(window);
  settleLayout();
  expect(root.dataset.mode).toBe("animated");
  expect(following.getBoundingClientRect().top).toBeCloseTo(before);
});

it.each(["Research", "Delivery"])("restores %s after a parent clamps scrolling following the child's resize measurement", section => {
  const { root, container } = setup();
  const outer = root.closest<HTMLElement>("[data-confluence]")!;
  const following = container.querySelector<HTMLElement>("[data-after-lens]")!;
  scrollToProgress(root, section === "Research" ? .70 : 1.4);
  const followingTop = following.getBoundingClientRect().top;

  vi.stubGlobal("innerWidth", 390); vi.stubGlobal("innerHeight", 844); fieldWidth = 342;
  fireEvent.resize(window);
  outer.dataset.layout = "reading"; outer.style.setProperty("--travel", "0px");
  scrollY -= outerTravel;
  fireEvent.scroll(window);
  settleLayout();
  expect(root.dataset.mode).toBe("reading");

  vi.stubGlobal("innerWidth", 1366); vi.stubGlobal("innerHeight", 778); fieldWidth = 1040;
  fireEvent.resize(window);
  outer.dataset.layout = "animated"; outer.style.setProperty("--travel", `${outerTravel}px`);
  flushFrame(); // Research measures and restores before the parent observer runs.
  scrollY = 0;
  fireEvent.scroll(window);
  act(() => resizeCallbacks[0]()); // The new outer geometry triggers another child measurement.
  flushFrame();
  flushFrame();

  expect(root.dataset.mode).toBe("animated");
  if (section === "Research") {
    expect(Number(root.dataset.progress)).toBeCloseTo(.70);
    expect(root.dataset.topic).toBe("1");
    expect(root.dataset.perspective).toBe("provider");
  } else expect(following.getBoundingClientRect().top).toBeCloseTo(followingTop);
  const settledY = window.scrollY;
  const calls = vi.mocked(window.scrollTo).mock.calls.length;
  settleLayout();
  expect(window.scrollY).toBe(settledY);
  expect(vi.mocked(window.scrollTo).mock.calls).toHaveLength(calls);
});

it.each(["wheel", "touchstart", "Tab"])("cancels delayed resize restoration when the reader supplies %s", input => {
  const { root } = setup();
  scrollToProgress(root, .70);
  vi.stubGlobal("innerHeight", 825);
  fireEvent.resize(window);
  flushFrame();
  flushFrame(); // The final restoration is pending on the next animation frame.
  if (input === "Tab") fireEvent.keyDown(document, { key: "Tab" });
  else fireEvent(window, new Event(input));
  scrollY += 80;
  fireEvent.scroll(window);
  const chosenY = window.scrollY;
  const calls = vi.mocked(window.scrollTo).mock.calls.length;
  settleLayout();
  expect(window.scrollY).toBe(chosenY);
  expect(vi.mocked(window.scrollTo).mock.calls).toHaveLength(calls);
});

it("cancels motion and measurement work and removes its observers and listeners on unmount", () => {
  const removeWindow = vi.spyOn(window, "removeEventListener");
  const removeDocument = vi.spyOn(document, "removeEventListener");
  const { root, unmount } = setup();
  fireEvent.click(root.querySelector('[data-lens-choice="provider"]')!);
  act(() => resizeCallbacks[0]());
  expect(frames.size).toBeGreaterThan(0);
  unmount();
  expect(frames.size).toBe(0);
  flushFrame(1000);
  expect(window.scrollTo).not.toHaveBeenCalled();
  expect(resizeDisconnect).toHaveBeenCalledOnce();
  expect(mutationDisconnect).toHaveBeenCalledOnce();
  for (const event of ["scroll", "resize", "pageshow", "wheel", "touchstart"]) expect(removeWindow).toHaveBeenCalledWith(event, expect.any(Function));
  for (const event of ["keydown", "visibilitychange"]) expect(removeDocument).toHaveBeenCalledWith(event, expect.any(Function));
  expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
});
