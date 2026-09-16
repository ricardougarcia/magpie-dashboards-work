import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { boardEntries } from "@/data/board";
import { gcmPmfHref } from "@/data/gcm";
import { GcmBoardCluster, GcmPmfBoardSlip } from "./gcm-board-cluster";
import { GcmBoardField } from "./gcm-board-field";
import { gcmBoardGeometry } from "./gcm-board-geometry";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false })));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

function renderStudies() {
  return render(<GcmBoardField className="board-field"><GcmBoardCluster entry={boardEntries[2]} /><GcmPmfBoardSlip /></GcmBoardField>);
}

describe("GCM's distributed Board family", () => {
  it("keeps both destinations directly accessible before any relationship interaction", () => {
    const { container } = renderStudies();
    expect(screen.getByRole("link", { name: "GCM" }).getAttribute("href")).toBe("/work/gcm");
    expect(screen.getByRole("link", { name: /Product Market Fit/ }).getAttribute("href")).toBe(gcmPmfHref);
    expect(screen.getByRole("link", { name: /Original case study/ }).getAttribute("href")).toBe(gcmPmfHref);
    expect(screen.getByText("Sole product lead")).toBeTruthy();
    expect(container.querySelector('[data-gcm-connected="false"]')).toBeTruthy();
    expect(container.querySelectorAll("[data-board-number]")).toHaveLength(1);
    expect(container.querySelector('[data-board-subentry="03.B"]')).toBeTruthy();
  });

  it("draws from the keyboard-focused entry without moving the viewport or changing links", () => {
    const { container } = renderStudies();
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const field = container.querySelector("[data-gcm-connected]")!;
    const pmf = screen.getByRole("link", { name: /Product Market Fit/ });
    fireEvent.focus(pmf);
    expect(field.getAttribute("data-gcm-connected")).toBe("true");
    expect(field.getAttribute("data-gcm-origin")).toBe("pmf");
    expect(screen.getByRole("button", { name: "Related MVP [03.A]" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.keyDown(pmf, { key: "Escape" });
    expect(field.getAttribute("data-gcm-connected")).toBe("false");
    expect(scroll).not.toHaveBeenCalled();
    expect(pmf.getAttribute("href")).toBe(gcmPmfHref);
  });

  it("pins with a tap, dismisses outside or on a second tap, and retains the native destination", () => {
    const { container } = renderStudies();
    const field = container.querySelector("[data-gcm-connected]")!;
    const button = screen.getByRole("button", { name: "Related discovery [03.B]" });
    fireEvent.pointerOver(button, { pointerType: "touch" });
    expect(field.getAttribute("data-gcm-connected")).toBe("false");
    fireEvent.click(button);
    expect(field.getAttribute("data-gcm-connected")).toBe("true");
    expect(button.getAttribute("aria-pressed")).toBe("true");
    fireEvent.pointerDown(document.body);
    expect(field.getAttribute("data-gcm-connected")).toBe("false");
    expect(button.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(button);
    fireEvent.click(button);
    expect(field.getAttribute("data-gcm-connected")).toBe("false");
    expect(button.getAttribute("aria-pressed")).toBe("false");
  });

  it("maintains the connection while keyboard focus moves within one entry, then releases it", () => {
    const { container } = renderStudies();
    const field = container.querySelector("[data-gcm-connected]")!;
    const link = screen.getByRole("link", { name: "GCM" });
    const related = screen.getByRole("button", { name: "Related discovery [03.B]" });
    fireEvent.focus(link);
    fireEvent.blur(link, { relatedTarget: related });
    expect(field.getAttribute("data-gcm-connected")).toBe("true");
    fireEvent.focus(related);
    fireEvent.blur(related, { relatedTarget: document.body });
    expect(field.getAttribute("data-gcm-connected")).toBe("false");
  });

  it("draws on mouse entry and preserves a deliberate pin after pointer exit", () => {
    vi.useFakeTimers();
    // JSDOM does not supply PointerEvent; retain the pointer-type signal for this behavior check.
    class PointerEventWithType extends MouseEvent { pointerType: string; constructor(type: string, properties: PointerEventInit) { super(type, properties); this.pointerType = properties.pointerType || ""; } }
    vi.stubGlobal("PointerEvent", PointerEventWithType);
    const { container } = renderStudies();
    const field = container.querySelector("[data-gcm-connected]")!;
    const gcm = container.querySelector('[data-gcm-entry="gcm"]')!;
    fireEvent.pointerOver(gcm, { pointerType: "mouse" });
    expect(field.getAttribute("data-gcm-connected")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Related discovery [03.B]" }));
    fireEvent.pointerOut(gcm, { pointerType: "mouse", relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(100));
    expect(field.getAttribute("data-gcm-connected")).toBe("true");
    fireEvent.keyDown(document.body, { key: "Escape" });
    expect(field.getAttribute("data-gcm-connected")).toBe("false");
  });
});

describe("measured Board relationship", () => {
  const sheet = { left: 100, top: -300, right: 1100, width: 1000, height: 2000 };
  const gcm = { left: 100, top: 200, right: 560, width: 460, height: 300 };
  const pmf = { left: 640, top: 900, right: 1100, width: 460, height: 220 };

  it("stays within the central gutter and reverses its drawing origin", () => {
    const forward = gcmBoardGeometry(sheet, gcm, pmf, false, "gcm");
    expect(forward.path).toBe("M 460 554 L 500 554 L 500 1242 L 540 1242");
    const reverse = gcmBoardGeometry(sheet, gcm, pmf, false, "pmf");
    expect(reverse.start).toEqual(forward.end);
    expect(reverse.end).toEqual(forward.start);
    expect(reverse.path).toBe("M 540 1242 L 500 1242 L 500 554 L 460 554");
  });

  it("uses the left sheet margin on mobile and is invariant under native scrolling", () => {
    const mobilePmf = { ...pmf, left: 100, right: 560 };
    const original = gcmBoardGeometry(sheet, gcm, mobilePmf, true, "gcm");
    expect(original.path).toBe("M 0 554 L -9 554 L -9 1242 L 0 1242");
    const scrolled = gcmBoardGeometry({ ...sheet, top: sheet.top - 275 }, { ...gcm, top: gcm.top - 275 }, { ...mobilePmf, top: mobilePmf.top - 275 }, true, "gcm");
    expect(scrolled).toEqual(original);
  });
});
