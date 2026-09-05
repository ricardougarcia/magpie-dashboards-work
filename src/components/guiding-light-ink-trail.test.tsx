import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GuidingLightInkTrail } from "@/components/guiding-light-ink-trail";

class ResizeObserverMock implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

function TestHost({ disabled = false }: { disabled?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={trackRef} data-testid="track">
      <button type="button">Learn</button>
      <button type="button">Grow</button>
      <GuidingLightInkTrail trackRef={trackRef} disabled={disabled} />
    </div>
  );
}

describe("GuidingLightInkTrail", () => {
  const frameCallbacks = new Map<number, FrameRequestCallback>();
  let frameId = 0;
  const context = {
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    clip: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({
      data: new Uint8ClampedArray(width * height * 4),
      width,
      height,
      colorSpace: "srgb",
    } as ImageData)),
    putImageData: vi.fn(),
    imageSmoothingEnabled: true,
    fillStyle: "",
    filter: "none",
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;

  beforeEach(() => {
    frameCallbacks.clear();
    frameId = 0;
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
      frameId += 1;
      frameCallbacks.set(frameId, callback);
      return frameId;
    }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frameCallbacks.delete(id)));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => context);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(() => ({
      x: 100,
      y: 40,
      top: 40,
      left: 100,
      right: 600,
      bottom: 98,
      width: 500,
      height: 58,
      toJSON: () => ({}),
    }));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders one non-interactive decorative surface and leaves the buttons intact", () => {
    const { container } = render(<TestHost />);
    const canvas = container.querySelector("canvas.guiding-light-ink-canvas");

    expect(canvas).toBeTruthy();
    expect(canvas?.getAttribute("aria-hidden")).toBe("true");
    expect(container.querySelectorAll("canvas")).toHaveLength(1);
    expect(container.querySelectorAll("button")).toHaveLength(2);
  });

  it("does not render the effect when reduced motion disables it", () => {
    const { container } = render(<TestHost disabled />);
    expect(container.querySelector("canvas.guiding-light-ink-canvas")).toBeNull();
  });

  it("consumes coalesced input but deposits only from the frame-driven nib", () => {
    const { getByTestId } = render(<TestHost />);
    const track = getByTestId("track");
    const coalesced = vi.fn(() => ([
      { clientX: 220, clientY: 64 },
      { clientX: 300, clientY: 66 },
    ] as PointerEvent[]));

    fireEvent.pointerEnter(track, { pointerType: "mouse", clientX: 140, clientY: 58, isPrimary: true });
    act(() => frameCallbacks.get(1)?.(0));
    const fillsAfterEntryFrame = vi.mocked(context.fill).mock.calls.length;

    const moveEvent = new Event("pointermove", { bubbles: true });
    Object.defineProperties(moveEvent, {
      pointerType: { value: "mouse" },
      clientX: { value: 380 },
      clientY: { value: 68 },
      isPrimary: { value: true },
      getCoalescedEvents: { value: coalesced },
    });
    fireEvent(track, moveEvent);
    expect(coalesced).toHaveBeenCalledTimes(1);
    expect(context.fill).toHaveBeenCalledTimes(fillsAfterEntryFrame);

    act(() => frameCallbacks.get(2)?.(1000 / 60));
    expect(vi.mocked(context.fill).mock.calls.length).toBeGreaterThan(fillsAfterEntryFrame);

    const fillsAfterMovement = vi.mocked(context.fill).mock.calls.length;
    act(() => frameCallbacks.get(3)?.((1000 / 60) * 2));
    expect(vi.mocked(context.fill).mock.calls.length).toBeGreaterThan(fillsAfterMovement);
  });

  it("ignores touch, renders mouse deposits, and keeps animating their dry-out after exit", () => {
    const { getByTestId } = render(<TestHost />);
    const track = getByTestId("track");
    const requestFrame = vi.mocked(window.requestAnimationFrame);

    fireEvent.pointerEnter(track, { pointerType: "touch", clientX: 140, clientY: 58, isPrimary: true });
    expect(requestFrame).not.toHaveBeenCalled();

    fireEvent.pointerEnter(track, { pointerType: "mouse", clientX: 140, clientY: 58, isPrimary: true });
    expect(requestFrame).toHaveBeenCalledTimes(1);

    act(() => frameCallbacks.get(1)?.(0));
    expect(context.beginPath).toHaveBeenCalled();
    expect(context.quadraticCurveTo).toHaveBeenCalled();
    expect(requestFrame).toHaveBeenCalledTimes(2);

    fireEvent.pointerLeave(track, { pointerType: "mouse", clientX: 620, clientY: 58, isPrimary: true });
    act(() => frameCallbacks.get(2)?.(120));
    expect(requestFrame).toHaveBeenCalledTimes(3);
  });
});
