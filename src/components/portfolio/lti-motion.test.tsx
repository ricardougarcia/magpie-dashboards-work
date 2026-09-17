import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LtiMotion, LtiWorkstreams, ltiBeatProgress, ltiWorkstreamProgress } from "./lti-motion";

let reduced = false;
let preferenceChanged: (() => void) | undefined;
beforeEach(() => {
  reduced = false;
  vi.stubGlobal("matchMedia", () => ({ get matches() { return reduced; }, addEventListener: (_: string, callback: () => void) => { preferenceChanged = callback; }, removeEventListener: vi.fn() }));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
  vi.useFakeTimers();
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

it("keeps a later spread unjoined until it enters and reverses when scrolling back", () => {
  expect(ltiBeatProgress(1000, 600, 1000).join).toBe(0);
  expect(ltiBeatProgress(290, 600, 1000).join).toBe(.5);
  expect(ltiBeatProgress(100, 600, 1000).join).toBe(1);
  expect(ltiBeatProgress(1000, 600, 1000).join).toBe(0);
  expect(ltiWorkstreamProgress(500, 1000)).toBe(0);
  expect(ltiWorkstreamProgress(320, 1000)).toBe(.5);
  expect(ltiWorkstreamProgress(140, 1000)).toBe(1);
});

it("updates on native scrolling and settles immediately when reduced motion changes", () => {
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(4000);
  let top = 1000;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ top, height: 600, bottom: top + 600, left: 0, right: 900, width: 900, x: 0, y: top, toJSON() {} }));
  const { container } = render(<LtiMotion><div data-lti-beat><div data-lti-workstreams /></div></LtiMotion>);
  const beat = container.querySelector<HTMLElement>("[data-lti-beat]")!;
  const work = container.querySelector<HTMLElement>("[data-lti-workstreams]")!;
  expect(beat.style.getPropertyValue("--join")).toBe("0.0000");
  top = 0;
  fireEvent.scroll(window);
  act(() => { vi.runOnlyPendingTimers(); });
  expect(work.style.getPropertyValue("--join")).toBe("1.0000");
  top = 1000;
  fireEvent.scroll(window);
  act(() => { vi.runOnlyPendingTimers(); });
  expect(work.style.getPropertyValue("--join")).toBe("0.0000");
  reduced = true;
  act(() => { preferenceChanged?.(); vi.runOnlyPendingTimers(); });
  expect(beat.style.getPropertyValue("--phase")).toBe("1.0000");
  expect(work.style.getPropertyValue("--join")).toBe("1.0000");
});

it("supports one pinned workstream on touch or keyboard and Escape clears it", () => {
  render(<LtiWorkstreams />);
  const integration = screen.getByRole("button", { name: /^Integration/ });
  const marketplace = screen.getByRole("button", { name: /^Marketplace/ });
  fireEvent.click(integration);
  expect(integration.getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(marketplace);
  expect(integration.getAttribute("aria-pressed")).toBe("false");
  expect(marketplace.getAttribute("aria-pressed")).toBe("true");
  fireEvent.keyDown(marketplace, { key: "Escape" });
  expect(marketplace.getAttribute("aria-pressed")).toBe("false");
});
