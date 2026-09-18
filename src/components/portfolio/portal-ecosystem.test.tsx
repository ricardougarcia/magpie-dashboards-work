import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalEcosystem } from "./portal-ecosystem";

type MockAnimation = {
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  playState: AnimationPlayState;
};

let animations: MockAnimation[];
let intersect: (visible: boolean) => void;
let hidden: boolean;
let disconnectIntersection: ReturnType<typeof vi.fn>;
let disconnectResize: ReturnType<typeof vi.fn>;
const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");

beforeEach(() => {
  animations = [];
  hidden = false;
  disconnectIntersection = vi.fn();
  disconnectResize = vi.fn();
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) {
      intersect = visible => act(() => callback(
        [{ isIntersecting: visible } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      ));
    }
    observe() {}
    disconnect = disconnectIntersection;
  });
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect = disconnectResize;
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    if (this.hasAttribute("data-portal-origin")) return new DOMRect(250, 0, 400, 100);
    if (this.hasAttribute("data-portal-product")) {
      const index = Array.from(this.parentElement!.children).indexOf(this);
      return new DOMRect(index * 225, 165, 200, 150);
    }
    return new DOMRect(0, 0, 900, 315);
  });
  Object.defineProperty(Element.prototype, "animate", {
    configurable: true,
    value: vi.fn(() => {
      const animation: MockAnimation = {
        playState: "running",
        play: vi.fn(() => { animation.playState = "running"; }),
        pause: vi.fn(() => { animation.playState = "paused"; }),
        cancel: vi.fn(() => { animation.playState = "idle"; }),
      };
      animations.push(animation);
      return animation;
    }),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalAnimate) Object.defineProperty(Element.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(Element.prototype, "animate");
});

function expectPlayback(state: AnimationPlayState) {
  expect(animations.length).toBeGreaterThan(0);
  expect(animations.every(animation => animation.playState === state)).toBe(true);
}

describe("Partner Portal ecosystem", () => {
  it("shows each product description immediately without interactive disclosure", () => {
    const { getByRole, getAllByRole, queryByRole, container } = render(<PortalEcosystem active reduced />);
    expect(getByRole("heading", { name: "Partner Portal" })).toBeTruthy();
    const products = getAllByRole("listitem");
    expect(products.map(product => within(product).getByRole("heading").textContent)).toEqual([
      "EdCo Marketplace", "Canvas LMS", "Impact", "LearnPlatform",
    ]);
    for (const [index, text] of [
      "educators discover and evaluate edtech tools",
      "K–12, higher education, and professional learning",
      "Usage analytics and in-app guidance",
      "ESSA-aligned research",
    ].entries()) {
      const description = within(products[index]).getByText(text, { exact: false });
      expect(description.closest("[hidden], [inert], [aria-hidden='true']")).toBeNull();
    }
    expect(queryByRole("button")).toBeNull();
    expect(queryByRole("link")).toBeNull();
    expect(container.querySelector("[tabindex]")).toBeNull();
    intersect(true);
    expect(Element.prototype.animate).not.toHaveBeenCalled();
  });

  it("runs only in view and pauses while the document is hidden", () => {
    render(<PortalEcosystem active reduced={false} />);
    expectPlayback("paused");
    intersect(true);
    expectPlayback("running");
    intersect(false);
    expectPlayback("paused");
    intersect(true);
    expectPlayback("running");
    hidden = true;
    fireEvent(document, new Event("visibilitychange"));
    expectPlayback("paused");
    hidden = false;
    fireEvent(document, new Event("visibilitychange"));
    expectPlayback("running");
  });

  it("stops when the ecosystem milestone becomes inactive and resumes on return", () => {
    const { rerender } = render(<PortalEcosystem active reduced={false} />);
    intersect(true);
    expectPlayback("running");
    const previous = [...animations];
    rerender(<PortalEcosystem active={false} reduced={false} />);
    expect(previous.every(animation => animation.playState === "idle")).toBe(true);
    animations = animations.filter(animation => !previous.includes(animation));
    intersect(true);
    expectPlayback("paused");
    rerender(<PortalEcosystem active reduced={false} />);
    animations = animations.filter(animation => animation.playState !== "idle");
    intersect(true);
    expectPlayback("running");
  });

  it("keeps static two-way connectors and cancels motion when Less motion is enabled", () => {
    const { container, rerender } = render(<PortalEcosystem active reduced={false} />);
    intersect(true);
    expectPlayback("running");
    const callsBeforeReduction = vi.mocked(Element.prototype.animate).mock.calls.length;
    rerender(<PortalEcosystem active reduced />);
    intersect(true);
    expectPlayback("idle");
    expect(vi.mocked(Element.prototype.animate).mock.calls).toHaveLength(callsBeforeReduction);
    const connectors = container.querySelectorAll("[data-connection]");
    expect(connectors).toHaveLength(4);
    for (const connector of connectors) {
      expect(connector.getAttribute("d")).toBeTruthy();
      expect(connector.getAttribute("marker-start")).toMatch(/^url\(#.+\)$/);
      expect(connector.getAttribute("marker-end")).toBe(connector.getAttribute("marker-start"));
    }
  });

  it("cancels animations and disconnects observation when unmounted", () => {
    const { unmount } = render(<PortalEcosystem active reduced={false} />);
    intersect(true);
    unmount();
    expectPlayback("idle");
    expect(disconnectIntersection).toHaveBeenCalledOnce();
    expect(disconnectResize).toHaveBeenCalledOnce();
    const playbackCalls = animations.map(animation => animation.play.mock.calls.length);
    fireEvent(document, new Event("visibilitychange"));
    expect(animations.map(animation => animation.play.mock.calls.length)).toEqual(playbackCalls);
  });
});
