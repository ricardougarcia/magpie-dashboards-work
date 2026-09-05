import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LaneGraphiteShadow } from "@/components/lane-graphite-shadow";

let resizeCallback: ResizeObserverCallback | null = null;
const disconnect = vi.fn();
const putImageData = vi.fn();
const createImageData = vi.fn((width: number, height: number) => ({
  width,
  height,
  data: new Uint8ClampedArray(width * height * 4),
}));

class ResizeObserverMock implements ResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {
    disconnect();
  }
}

beforeEach(() => {
  resizeCallback = null;
  disconnect.mockClear();
  putImageData.mockClear();
  createImageData.mockClear();
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  vi.stubGlobal("devicePixelRatio", 2);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    createImageData,
    putImageData,
  } as unknown as CanvasRenderingContext2D);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("LaneGraphiteShadow", () => {
  it("renders once per measured size and remains a static non-interactive surface", () => {
    const { container, unmount } = render(
      <LaneGraphiteShadow laneName="Eng Build" laneIndex={0} colorToken="steel" />,
    );
    const canvas = container.querySelector<HTMLCanvasElement>("canvas.lane-graphite-shadow");

    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    expect(canvas?.dataset.laneGraphite).toBe("Eng Build");
    expect(resizeCallback).toBeTruthy();

    act(() => {
      resizeCallback?.([
        { contentRect: { width: 420, height: 100 } } as unknown as ResizeObserverEntry,
      ], {} as ResizeObserver);
    });
    expect(canvas?.width).toBe(840);
    expect(canvas?.height).toBe(200);
    expect(canvas?.dataset.colorToken).toBe("steel");
    expect(putImageData).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrame).not.toHaveBeenCalled();

    act(() => {
      resizeCallback?.([
        { contentRect: { width: 420, height: 100 } } as unknown as ResizeObserverEntry,
      ], {} as ResizeObserver);
    });
    expect(putImageData).toHaveBeenCalledTimes(1);

    act(() => {
      resizeCallback?.([
        { contentRect: { width: 500, height: 100 } } as unknown as ResizeObserverEntry,
      ], {} as ResizeObserver);
    });
    expect(canvas?.width).toBe(1000);
    expect(canvas?.height).toBe(200);
    expect(putImageData).toHaveBeenCalledTimes(2);

    unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
