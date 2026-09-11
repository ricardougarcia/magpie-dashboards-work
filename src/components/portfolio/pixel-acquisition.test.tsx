import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PixelAcquisition } from "./pixel-acquisition";

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock("framer-motion", () => ({ useReducedMotion: () => preference.reduced }));
afterEach(() => { cleanup(); preference.reduced = false; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function setup() {
  const size = { width: 812, height: 156 };
  const cells: { x: number; y: number; width: number; height: number; alpha: number }[] = [];
  const context = {
    fillStyle: "", globalAlpha: 1, setTransform: vi.fn(), clearRect: () => { cells.length = 0; },
    fillRect(x: number, y: number, width: number, height: number) {
      cells.push({ x, y, width, height, alpha: this.globalAlpha });
    },
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const encoded = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/png;base64,bWFzaw==");
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({ ...size }) as DOMRect);
  let resized = () => {};
  const disconnected = vi.fn();
  vi.stubGlobal("ResizeObserver", class {
    constructor(callback: () => void) { resized = callback; }
    observe() {} disconnect = disconnected;
  });
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++id, callback); return id; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  const advance = (time: number) => act(() => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(time)); });
  return { size, cells, frames, advance, encoded, disconnected, resize: () => act(() => resized()) };
}

it("masks the text and backing with dense complete squares, then releases the settled mask", () => {
  const fixture = setup();
  const { container, unmount } = render(<PixelAcquisition active><p>Inspection note</p></PixelAcquisition>);
  const layer = container.firstElementChild as HTMLElement;
  const mask = () => layer.style.getPropertyValue("--inspection-mask");
  expect(mask()).toContain("transparent");
  fixture.advance(0); fixture.advance(500);
  expect(mask()).toContain("data:image/png");
  expect(layer.textContent).toBe("Inspection note");
  expect(fixture.cells.length).toBeGreaterThan(256);
  expect(new Set(fixture.cells.map(cell => cell.alpha)).size).toBeGreaterThan(2);
  const assertSquares = () => {
    for (const cell of fixture.cells) {
      expect(cell.width).toBe(4); expect(cell.height).toBe(4);
      expect(cell.x).toBeGreaterThanOrEqual(0); expect(cell.y).toBeGreaterThanOrEqual(0);
      expect(cell.x + cell.width).toBeLessThanOrEqual(fixture.size.width);
      expect(cell.y + cell.height).toBeLessThanOrEqual(fixture.size.height);
    }
  };
  assertSquares();
  // Neighbors in the same column have different timing, not a uniform wipe.
  expect(new Set(fixture.cells.filter(cell => cell.x === 252).map(cell => cell.alpha)).size).toBeGreaterThan(1);
  fixture.size.width = 157; fixture.size.height = 361; fixture.resize(); assertSquares();
  fixture.advance(1150);
  expect(mask()).toBe("none"); expect(fixture.frames.size).toBe(0);
  unmount(); expect(fixture.disconnected).toHaveBeenCalled();
});

it("reverses a partial reveal from exactly the same cells and cleans up pending work", () => {
  const fixture = setup();
  const { container, rerender, unmount } = render(<PixelAcquisition active />);
  fixture.advance(0); fixture.advance(500);
  const previous = [...fixture.cells];
  rerender(<PixelAcquisition active={false} />);
  expect(fixture.cells).toEqual(previous);
  fixture.advance(500); expect(fixture.cells).toEqual(previous);
  fixture.advance(700);
  expect(fixture.cells.reduce((sum, cell) => sum + cell.alpha, 0)).toBeLessThan(previous.reduce((sum, cell) => sum + cell.alpha, 0));
  fixture.advance(900);
  expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--inspection-mask")).toContain("transparent");
  rerender(<PixelAcquisition active />); unmount(); expect(fixture.frames.size).toBe(0);
});

it("uses an immediate semantic state change without drawing under reduced motion", () => {
  preference.reduced = true;
  const fixture = setup();
  const { container, rerender } = render(<PixelAcquisition active />);
  expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("false");
  expect(fixture.encoded).not.toHaveBeenCalled(); expect(fixture.frames.size).toBe(0);
  rerender(<PixelAcquisition active={false} />);
  expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
});
