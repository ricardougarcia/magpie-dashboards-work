import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GUIDING_LIGHT_EXPAND_MS, GUIDING_LIGHT_HOLD_MS, useGuidingLightTour } from "@/components/use-guiding-light-tour";

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  target: Element | null = null;

  constructor(private callback: IntersectionObserverCallback) {
    IntersectionObserverMock.instances.push(this);
  }

  observe(target: Element) { this.target = target; }
  unobserve() {}
  disconnect = vi.fn();

  notify(ratio: number) {
    this.callback([{
      target: this.target!,
      isIntersecting: ratio > 0,
      intersectionRatio: ratio,
    } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

function TourHarness({ reducedMotion = false }: { reducedMotion?: boolean | null }) {
  const { light, status, viewRef, dispatch, clear } = useGuidingLightTour(reducedMotion);
  return (
    <div ref={viewRef}>
      <h2 className="magpie-guide-heading">The work, in motion.</h2>
      <output aria-label="Selected light">{light ?? "None"}</output>
      <output aria-label="Tour status">{status}</output>
      <button onClick={() => dispatch({ type: "pause" })}>Pause</button>
      <button onClick={() => dispatch({ type: "play" })}>Play</button>
      <button onClick={() => dispatch({ type: "restart" })}>Replay</button>
      <button onClick={() => dispatch({ type: "back" })}>Back</button>
      <button onClick={() => dispatch({ type: "next" })}>Next</button>
      <button onClick={() => dispatch({ type: "select", light: "Govern" })}>Select Govern</button>
      <button onClick={clear}>Explore</button>
    </div>
  );
}

let visibility: DocumentVisibilityState;

beforeEach(() => {
  vi.useFakeTimers();
  IntersectionObserverMock.instances = [];
  vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  visibility = "visible";
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function setVisible(ratio = 1) {
  act(() => IntersectionObserverMock.instances[0].notify(ratio));
}

function advance(milliseconds = GUIDING_LIGHT_HOLD_MS) {
  act(() => vi.advanceTimersByTime(milliseconds));
}

function expectTour(light: string, status: string) {
  expect(screen.getByLabelText("Selected light").textContent).toBe(light);
  expect(screen.getByLabelText("Tour status").textContent).toBe(status);
}

function startTour() {
  fireEvent.click(screen.getByRole("button", { name: "Play" }));
  advance(GUIDING_LIGHT_EXPAND_MS);
}

describe("Guiding Light tour playback", () => {
  it("starts collapsed and never starts from scrolling, visibility changes, or elapsed time", () => {
    render(<TourHarness />);
    expectTour("None", "ready");
    advance(10000);
    setVisible(0.3);
    advance();
    setVisible();
    advance(60000);
    setVisible(0);
    setVisible();
    visibility = "hidden";
    fireEvent(document, new Event("visibilitychange"));
    visibility = "visible";
    fireEvent(document, new Event("visibilitychange"));
    advance(60000);
    expectTour("None", "ready");
  });

  it("opens Learn only on Play, then gives it a full 2.8 seconds after the expansion", () => {
    render(<TourHarness />);
    setVisible();
    expect(GUIDING_LIGHT_HOLD_MS).toBe(2800);
    expect(GUIDING_LIGHT_EXPAND_MS).toBe(360);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expectTour("Learn", "opening");
    advance(359);
    expectTour("Learn", "opening");
    advance(1);
    expectTour("Learn", "playing");
    advance(2799);
    expectTour("Learn", "playing");
    advance(1);
    expectTour("Fix", "playing");
    advance();
    expectTour("Stabilize", "playing");
  });

  it("pauses the current light and resumes from it without skipping the reading time", () => {
    render(<TourHarness />);
    setVisible();
    startTour();
    advance();
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    advance(10000);
    expectTour("Fix", "paused");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expectTour("Fix", "playing");
    advance();
    expectTour("Stabilize", "playing");
  });

  it("can pause while opening and only resumes through an explicit Play", () => {
    render(<TourHarness />);
    setVisible();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(100);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    advance(60000);
    expectTour("Learn", "paused");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expectTour("Learn", "playing");
    advance();
    expectTour("Fix", "playing");
  });

  it("holds a manually selected light and lets the visitor clear it without restarting on reentry", () => {
    render(<TourHarness />);
    setVisible();
    fireEvent.click(screen.getByRole("button", { name: "Select Govern" }));
    advance(10000);
    expectTour("Govern", "paused");
    fireEvent.click(screen.getByRole("button", { name: "Select Govern" }));
    expect(screen.getByLabelText("Selected light").textContent).toBe("None");
    setVisible(0);
    setVisible();
    advance();
    expect(screen.getByLabelText("Selected light").textContent).toBe("None");
  });

  it("stops when the visitor chooses independent exploration and restarts only on explicit replay", () => {
    render(<TourHarness />);
    setVisible();
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    setVisible(0);
    setVisible();
    advance(10000);
    expectTour("None", "exploring");
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expectTour("Learn", "opening");
    advance(GUIDING_LIGHT_EXPAND_MS);
    expectTour("Learn", "playing");
    advance();
    expectTour("Fix", "playing");
  });

  it("finishes once after Grow and preserves the ending until the visitor explicitly replays", () => {
    render(<TourHarness />);
    setVisible();
    startTour();
    for (const light of ["Fix", "Stabilize", "Govern", "Grow"]) {
      advance();
      expectTour(light, "playing");
    }
    advance();
    expectTour("Grow", "complete");
    advance(60000);
    setVisible(0);
    setVisible();
    advance();
    expectTour("Grow", "complete");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    expectTour("Learn", "playing");
    advance();
    expectTour("Fix", "playing");
  });

  it("restarts an already expanded narrative immediately from Learn", () => {
    render(<TourHarness />);
    setVisible();
    fireEvent.click(screen.getByRole("button", { name: "Select Govern" }));
    fireEvent.click(screen.getByRole("button", { name: "Replay" }));
    expectTour("Learn", "playing");
    advance();
    expectTour("Fix", "playing");
  });

  it("allows backward and forward navigation without continuing autoplay", () => {
    render(<TourHarness />);
    setVisible();
    startTour();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expectTour("Fix", "paused");
    advance();
    expectTour("Fix", "paused");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expectTour("Learn", "paused");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    expectTour("Learn", "paused");
  });

  it("holds the current light while offscreen and gives it a full reading interval on return", () => {
    render(<TourHarness />);
    setVisible();
    startTour();
    advance(1000);
    setVisible(0);
    advance(10000);
    expectTour("Learn", "playing");
    setVisible();
    advance(2799);
    expectTour("Learn", "playing");
    advance(1);
    expectTour("Fix", "playing");
  });

  it("holds playback in a hidden tab and resumes the current light when the tab is visible", () => {
    render(<TourHarness />);
    setVisible();
    startTour();
    advance();
    visibility = "hidden";
    fireEvent(document, new Event("visibilitychange"));
    advance(10000);
    expectTour("Fix", "playing");
    visibility = "visible";
    fireEvent(document, new Event("visibilitychange"));
    advance();
    expectTour("Stabilize", "playing");
  });

  it("stays collapsed with any motion preference and skips expansion timing with reduced motion", () => {
    const { rerender } = render(<TourHarness reducedMotion={null} />);
    setVisible();
    advance(10000);
    expectTour("None", "ready");
    rerender(<TourHarness reducedMotion />);
    advance(10000);
    expectTour("None", "ready");
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(0);
    expectTour("Learn", "playing");
    advance(2799);
    expectTour("Learn", "playing");
    advance(1);
    expectTour("Fix", "playing");
  });

  it("cancels opening when a light is manually selected or the guide is cleared", () => {
    render(<TourHarness />);
    setVisible();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Govern" }));
    advance(10000);
    expectTour("Govern", "paused");
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    fireEvent.click(screen.getByRole("button", { name: "Explore" }));
    advance(10000);
    expectTour("None", "exploring");
  });

  it("observes the bounded heading and cancels timers and subscriptions on unmount", () => {
    const removeListener = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<TourHarness />);
    const observer = IntersectionObserverMock.instances[0];
    expect(observer.target).toBe(screen.getByRole("heading", { name: "The work, in motion." }));
    setVisible();
    startTour();
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
  });

  it("holds an explicitly opened guide until the heading is visible", () => {
    render(<TourHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    advance(60000);
    expectTour("Learn", "opening");
    setVisible();
    advance(GUIDING_LIGHT_EXPAND_MS);
    expectTour("Learn", "playing");
    advance();
    expectTour("Fix", "playing");
  });
});
