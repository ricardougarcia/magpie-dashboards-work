import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PanelPersistentElement, PanelReplacement } from "./panel-replacement";

let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let preference: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };

function flush() {
  act(() => {
    const callbacks = [...frames.values()];
    frames.clear();
    callbacks.forEach(callback => callback(0));
  });
}

function scrollTo(y: number) {
  vi.stubGlobal("scrollY", y);
  fireEvent.scroll(window);
  flush();
}

function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Pinned count {count}</button>;
}

function Fixture() {
  return <PanelReplacement outgoing={
    <section data-panel="1"><div data-panel-content>
      <h1>Panel 1</h1>
      <PanelPersistentElement mode="pinned"><Counter /></PanelPersistentElement>
      <PanelPersistentElement mode="morph-in-place" replacement={<button>Panel 2 content</button>}>
        <button>Panel 1 content</button>
      </PanelPersistentElement>
    </div></section>
  }><section data-panel="2"><h2>Panel 2</h2></section></PanelReplacement>;
}

beforeEach(() => {
  frames = new Map();
  nextFrame = 0;
  preference = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("scrollY", 0);
  vi.stubGlobal("innerHeight", 1000);
  vi.stubGlobal("matchMedia", vi.fn(() => preference));
  vi.stubGlobal("CSS", { supports: vi.fn(() => false) });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const shift = Number.parseFloat(this.closest<HTMLElement>(".panel-replacement")?.style.getPropertyValue("--panel-shift") || "0");
    let top = 72 - window.scrollY;
    let height = 1800;
    if (this.matches(".panel-incoming-sheet")) top = 652 - window.scrollY;
    if (this.matches(".panel-outgoing-motion")) top += shift;
    if (this.matches("[data-panel-content]")) top = 136 - window.scrollY + shift;
    if (this.matches("[data-panel-persistence-slot]")) top = 420 - window.scrollY + shift;
    if (this.matches(".panel-persistent-element")) height = 80;
    return { top, bottom: top + height, left: 0, right: 400, x: 0, y: top, width: 400, height, toJSON: () => ({}) };
  });
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Panel 1 / Panel 2 persistent-element mechanism", () => {
  it("lets native scroll timelines own visual motion without per-scroll style mutations", () => {
    vi.mocked(CSS.supports).mockReturnValue(true);
    const { container } = render(<Fixture />);
    flush();
    const root = container.querySelector<HTMLElement>(".panel-replacement")!;
    const originalStyle = root.getAttribute("style");
    expect(root.dataset.panelDriver).toBe("native");
    expect(root.style.getPropertyValue("--panel-range-end")).toBe("688px");
    for (const position of [0.5, 1, 20.5, 600, 750, 20.5, 0]) scrollTo(position);
    expect(root.getAttribute("style")).toBe(originalStyle);
    expect(root.style.getPropertyValue("--panel-shift")).toBe("");
    expect(container.querySelector<HTMLElement>("[data-panel-content]")?.inert).toBe(false);
  });

  it("remeasures native ranges on resize and keeps reduced motion readable", () => {
    vi.mocked(CSS.supports).mockReturnValue(true);
    const { container } = render(<Fixture />);
    flush();
    const root = container.querySelector<HTMLElement>(".panel-replacement")!;
    vi.stubGlobal("innerHeight", 400);
    fireEvent.resize(window);
    flush();
    expect(root.style.getPropertyValue("--panel-range-start")).toBe("252px");
    expect(root.style.getPropertyValue("--panel-range-end")).toBe("940px");
    scrollTo(1000);
    expect(container.querySelector<HTMLElement>("[data-panel-content]")?.inert).toBe(true);
    preference.matches = true;
    act(() => preference.addEventListener.mock.calls[0][1]());
    flush();
    expect(root.dataset.panelMotion).toBe("reduced");
    expect(container.querySelector<HTMLElement>("[data-panel-content]")?.inert).toBe(false);
  });

  it("measures restored scroll positions consistently across Strict Mode remounts", () => {
    vi.stubGlobal("scrollY", 300);
    const { container } = render(<StrictMode><Fixture /></StrictMode>);
    flush();
    expect(container.querySelector<HTMLElement>(".panel-replacement")?.style.getPropertyValue("--panel-shift")).toBe("225px");
  });

  it("keeps one live pinned element outside Panel 1's fade and preserves its state on reversal", () => {
    const { container } = render(<Fixture />);
    flush();
    const counter = screen.getByRole("button", { name: "Pinned count 0" });
    expect(counter.closest(".panel-persistence-layer")).toBeTruthy();
    expect(counter.closest("[data-panel-content]")).toBeNull();
    fireEvent.click(counter);
    scrollTo(300);
    expect(container.querySelector(".panel-replacement")?.getAttribute("style")).toContain("--panel-pin-shift: 300px");
    scrollTo(750);
    expect(container.querySelector<HTMLElement>("[data-panel-content]")?.inert).toBe(true);
    expect(screen.getByRole("button", { name: "Pinned count 1" })).toBe(counter);
    scrollTo(300);
    scrollTo(0);
    expect(screen.getAllByRole("button", { name: "Pinned count 1" })).toHaveLength(1);
    expect(container.querySelector<HTMLElement>("[data-panel-content]")?.inert).toBe(false);
  });

  it("switches the accessible morph content by position, with no container remount", () => {
    const { container } = render(<Fixture />);
    flush();
    const surface = container.querySelector("[data-panel-persistence='morph-in-place']");
    const before = surface?.querySelector<HTMLElement>("[data-panel-morph-before]");
    const after = surface?.querySelector<HTMLElement>("[data-panel-morph-after]");
    expect(before?.inert).toBe(false);
    expect(after?.inert).toBe(true);
    scrollTo(600);
    expect(before?.inert).toBe(true);
    expect(after?.inert).toBe(false);
    scrollTo(0);
    expect(before?.inert).toBe(false);
    expect(after?.inert).toBe(true);
    expect(container.querySelector("[data-panel-persistence='morph-in-place']")).toBe(surface);
  });

  it("restores native presentation for reduced motion and removes scheduled work on unmount", () => {
    preference.matches = true;
    const { container, unmount } = render(<Fixture />);
    scrollTo(750);
    const root = container.querySelector<HTMLElement>(".panel-replacement")!;
    expect(root.dataset.panelMotion).toBe("reduced");
    expect(root.style.getPropertyValue("--panel-shift")).toBe("0px");
    expect(root.style.getPropertyValue("--panel-opacity")).toBe("1");
    fireEvent.scroll(window);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(preference.removeEventListener).toHaveBeenCalled();
  });
});
