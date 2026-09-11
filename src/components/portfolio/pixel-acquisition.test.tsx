import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PixelAcquisition } from "./pixel-acquisition";

vi.mock("framer-motion", () => ({ useReducedMotion: () => false }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("draws dense complete squares across wide and tall annotations, then stops", () => {
  let width = 812, height = 156;
  const cells: { x: number; y: number; width: number; height: number; color: string }[] = [];
  const context = {
    fillStyle: "", globalAlpha: 1, setTransform: vi.fn(), clearRect: vi.fn(),
    fillRect(x: number, y: number, width: number, height: number) {
      cells.push({ x, y, width, height, color: this.fillStyle });
    },
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ width, height }) as DOMRect);
  let resized = () => {};
  const disconnected = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resized = callback; }
    observe() {} disconnect = disconnected;
  });
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
  const cancelled = vi.fn();
  vi.stubGlobal("cancelAnimationFrame", cancelled);
  const advance = (time: number) => act(() => { frames.splice(0).forEach((callback) => callback(time)); });
  const { unmount } = render(<PixelAcquisition active />);
  advance(0);
  advance(450);
  expect(cells.length).toBeGreaterThan(256);
  const assertSquares = () => {
    for (const cell of cells) {
      expect(cell.width).toBe(4); expect(cell.height).toBe(4);
      expect(cell.x).toBeGreaterThanOrEqual(0); expect(cell.y).toBeGreaterThanOrEqual(0);
      expect(cell.x + cell.width).toBeLessThanOrEqual(width);
      expect(cell.y + cell.height).toBeLessThanOrEqual(height);
      const channels = cell.color.slice(1).match(/../g)!.map((channel) => parseInt(channel, 16));
      expect(Math.min(...channels)).toBeGreaterThanOrEqual(40);
    }
  };
  assertSquares();
  cells.length = 0;
  width = 157; height = 361;
  act(() => resized());
  assertSquares();
  advance(900);
  expect(frames).toHaveLength(0);
  expect(cells.at(-1)).toEqual({ x: 0, y: 0, width, height, color: "#282828" });
  unmount();
  expect(disconnected).toHaveBeenCalled();
  expect(cancelled).toHaveBeenCalled();
});
