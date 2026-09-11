import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { BoardRegistration } from "./board-registration";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("registers native scroll and region coordinates, ignores touch, and releases listeners", () => {
  let frame: FrameRequestCallback | undefined;
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frame = callback; return 1; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerType = init.pointerType ?? "mouse"; }
  });
  const flush = () => act(() => { const callback = frame; frame = undefined; callback?.(0); });
  const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect = disconnect; });
  const remove = vi.spyOn(window, "removeEventListener");
  const { container, unmount } = render(<div data-board-sheet><BoardRegistration /><article data-region-code="CCP">Artifact</article></div>);
  const sheet = container.firstElementChild!;
  let top = 100;
  vi.spyOn(sheet, "getBoundingClientRect").mockImplementation(() => ({ left: 40, top, width: 960, height: 2200 } as DOMRect));
  Object.defineProperty(document, "elementFromPoint", { configurable: true, value: vi.fn(() => sheet.querySelector("article")) });
  flush();
  expect(container.textContent).toContain("[0960, 0000]");
  top = -320;
  fireEvent.scroll(window);
  flush();
  expect(container.textContent).toContain("[0000, 0320]");
  fireEvent.pointerMove(sheet, { clientX: 140, clientY: 80, pointerType: "mouse" });
  flush();
  expect(container.textContent).toContain("X:0100 Y:0400");
  expect(container.textContent).toContain("R:CCP");
  fireEvent.pointerMove(sheet, { pointerType: "touch" });
  flush();
  expect(container.textContent).not.toContain("R:CCP");
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
  expect(remove).toHaveBeenCalledWith("scroll", expect.any(Function));
  delete (document as Partial<Document>).elementFromPoint;
});
