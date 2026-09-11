import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BoardRegistration } from "./board-registration";
import { CoordinateCursor } from "@/components/coordinate-cursor";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("keeps Magpie viewport telemetry separate from the scrolling sheet and releases listeners", () => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frames.push(callback); return frames.length; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerType = init.pointerType ?? "mouse"; }
  });
  const flush = () => act(() => { frames.splice(0).forEach((callback) => callback(0)); });
  const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect = disconnect; });
  const remove = vi.spyOn(window, "removeEventListener");
  const { container, unmount } = render(<main data-gantt-region><CoordinateCursor /><div data-board-sheet><BoardRegistration /><article>Artifact</article></div></main>);
  const sheet = container.querySelector("[data-board-sheet]")!;
  let top = 100;
  vi.spyOn(sheet, "getBoundingClientRect").mockImplementation(() => ({ left: 40, top, width: 960, height: 2200 } as DOMRect));
  flush();
  expect(container.textContent).toContain("[0960, 0000]");
  top = -320;
  fireEvent.scroll(window);
  flush();
  expect(container.textContent).toContain("[0000, 0320]");
  fireEvent.pointerMove(sheet, { clientX: 140, clientY: 80, pointerType: "mouse" });
  flush();
  expect(container.querySelector(".coordinate-cursor")?.textContent).toBe("X:140PXY:80PX");
  expect(container.querySelector(".cursor-guides")?.classList.contains("is-visible")).toBe(true);
  expect((container.querySelector(".cursor-guide-horizontal") as HTMLElement).style.top).toBe("80px");
  expect((container.querySelector(".cursor-guide-vertical") as HTMLElement).style.left).toBe("140px");
  fireEvent.pointerMove(sheet, { clientX: 60, clientY: 90, pointerType: "touch" });
  flush();
  expect(container.querySelector(".coordinate-cursor")?.textContent).toBe("X:140PXY:80PX");
  fireEvent.blur(window);
  flush();
  expect(container.querySelector(".cursor-guides")?.classList.contains("is-visible")).toBe(false);
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
  expect(remove).toHaveBeenCalledWith("pointermove", expect.any(Function));
});
