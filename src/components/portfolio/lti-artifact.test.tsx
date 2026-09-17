import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Artifact } from "@/lib/portfolio-types";
import { LtiArtifact } from "./lti-artifact";

const artifact: Artifact & { code: string } = {
  id: "lti-test-source", code: "A076", src: "/portfolio/lti/configuration.png", width: 810, height: 1006,
  alt: "Original Canvas configuration design", label: "Canvas configuration", surface: "paper",
  caption: "The Add Canvas Configuration dialog presents the LTI 1.3 Dynamic Registration setup.",
};
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");
let previousBodyOverflow: string;
let previousRootOverflow: string;

beforeEach(() => {
  previousBodyOverflow = document.body.style.overflow;
  previousRootOverflow = document.documentElement.style.overflow;
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }) });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  }) });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks();
  document.body.style.overflow = previousBodyOverflow;
  document.documentElement.style.overflow = previousRootOverflow;
  for (const [object, property, descriptor] of [
    [HTMLDialogElement.prototype, "showModal", originalShowModal],
    [HTMLDialogElement.prototype, "close", originalClose],
    [Element.prototype, "animate", originalAnimate],
    [window, "matchMedia", originalMatchMedia],
  ] as const) {
    if (descriptor) Object.defineProperty(object, property, descriptor);
    else Reflect.deleteProperty(object, property);
  }
});

function openInspection() {
  const rendered = render(<LtiArtifact artifact={artifact} />);
  const trigger = screen.getByRole("link", { name: `Inspect source: ${artifact.label}` });
  trigger.focus();
  fireEvent.click(trigger);
  return { ...rendered, trigger, dialog: screen.getByRole("dialog") as HTMLDialogElement };
}

describe("LTI source inspection", () => {
  it("dismisses the hover note with Escape until the pointer leaves and re-enters", () => {
    render(<LtiArtifact artifact={artifact} />);
    const source = screen.getByRole("link", { name: `Inspect source: ${artifact.label}` });
    const figure = source.closest("figure")!;
    fireEvent.pointerEnter(figure);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(figure.getAttribute("data-note-dismissed")).toBe("true");
    fireEvent.pointerMove(figure);
    expect(figure.getAttribute("data-note-dismissed")).toBe("true");
    fireEvent.pointerLeave(figure);
    fireEvent.pointerEnter(figure);
    expect(figure.getAttribute("data-note-dismissed")).toBe("false");
  });

  it("keeps the note dismissed while focus remains and restores it on a later focus entry", () => {
    render(<LtiArtifact artifact={artifact} />);
    const source = screen.getByRole("link", { name: `Inspect source: ${artifact.label}` });
    const figure = source.closest("figure")!;
    act(() => { source.focus(); });
    fireEvent.keyDown(source, { key: "Escape" });
    expect(figure.getAttribute("data-note-dismissed")).toBe("true");
    fireEvent.pointerEnter(figure);
    fireEvent.pointerLeave(figure);
    expect(figure.getAttribute("data-note-dismissed")).toBe("true");
    act(() => { source.blur(); source.focus(); });
    expect(figure.getAttribute("data-note-dismissed")).toBe("false");
  });

  it("server-renders a usable original link, intrinsic preview and artifact identity", () => {
    const page = document.createElement("div");
    page.innerHTML = renderToString(<LtiArtifact artifact={artifact} />);
    const source = page.querySelector<HTMLAnchorElement>("[data-lti-source]")!;
    expect(source.getAttribute("href")).toBe(artifact.src);
    expect(source.target).toBe("_blank");
    expect(source.rel).toContain("noopener");
    expect(page.querySelector("figure")?.getAttribute("data-lti-artifact")).toBe("A076");
    expect(page.querySelectorAll("img")).toHaveLength(1);
    expect(page.querySelector("img")?.getAttribute("width")).toBe("810");
    expect(page.querySelector("img")?.getAttribute("height")).toBe("1006");
    expect(page.querySelector("dialog")?.hasAttribute("open")).toBe(false);
  });

  it("opens the unchanged original, supports fit/actual-size, and restores focus and prior scroll styles", () => {
    document.body.style.overflow = "clip";
    document.documentElement.style.overflow = "auto";
    const { trigger, dialog } = openInspection();
    const close = within(dialog).getByRole("button", { name: "Close source inspection" });
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");
    const original = within(dialog).getByRole("img");
    expect(new URL(original.getAttribute("src")!, window.location.href).pathname).toBe(artifact.src);
    expect(original.getAttribute("srcset")).toBeNull();
    const size = within(dialog).getByRole("button", { name: "Actual size" });
    fireEvent.click(size);
    expect(size.getAttribute("aria-pressed")).toBe("true");
    expect(within(dialog).getByRole("region").getAttribute("aria-label")).toContain("scroll to inspect");
    fireEvent.click(size);
    expect(size.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(close);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("clip");
    expect(document.documentElement.style.overflow).toBe("auto");
  });

  it("closes on Escape and resets actual size on reopening", () => {
    const { trigger, dialog } = openInspection();
    fireEvent.click(within(dialog).getByRole("button", { name: "Actual size" }));
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(trigger.closest("figure")?.getAttribute("data-note-dismissed")).toBe("false");
    const event = new Event("cancel", { cancelable: true });
    act(() => { dialog.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    expect(within(dialog).getByRole("button", { name: "Actual size" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("requires a press and release outside the dialog to dismiss", () => {
    const { dialog } = openInspection();
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 20, right: 300, top: 20, bottom: 500 } as DOMRect);
    fireEvent(dialog, new MouseEvent("pointerdown", { bubbles: true, clientX: 50, clientY: 50 }));
    fireEvent.click(dialog, { clientX: 5, clientY: 5 });
    expect(dialog.open).toBe(true);
    fireEvent(dialog, new MouseEvent("pointerdown", { bubbles: true, clientX: 5, clientY: 5 }));
    fireEvent.click(dialog, { clientX: 5, clientY: 5 });
    expect(dialog.open).toBe(false);
  });

  it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }])("preserves native original-file navigation for %j", (modifier) => {
    render(<LtiArtifact artifact={artifact} />);
    const trigger = screen.getByRole("link", { name: `Inspect source: ${artifact.label}` });
    let intercepted = false;
    document.addEventListener("click", (event) => { intercepted = event.defaultPrevented; event.preventDefault(); }, { once: true });
    act(() => { trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...modifier })); });
    expect(intercepted).toBe(false);
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  });

  it("keeps the native fallback when modal inspection is unavailable", () => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: undefined });
    render(<LtiArtifact artifact={artifact} compact />);
    const trigger = screen.getByRole("link", { name: "Open original planning sheet" });
    let intercepted = false;
    document.addEventListener("click", (event) => { intercepted = event.defaultPrevented; event.preventDefault(); }, { once: true });
    act(() => { trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); });
    expect(intercepted).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("cancels an active reveal when reduced motion changes and leaves the readable inspection open", () => {
    const preference = new EventTarget() as EventTarget & { matches: boolean };
    preference.matches = false;
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => preference });
    const cancel = vi.fn();
    const animate = vi.fn(() => ({ cancel }));
    Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
    const { trigger, dialog } = openInspection();
    expect(animate).toHaveBeenCalledWith([
      { opacity: .35, clipPath: "inset(0 0 9% 0)" }, { opacity: 1, clipPath: "inset(0)" },
    ], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
    expect(animate.mock.instances[0]).toBe(dialog.querySelector("[data-lti-inspection-paper]"));
    preference.matches = true;
    act(() => { preference.dispatchEvent(new Event("change")); });
    expect(cancel).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close source inspection" }));
    fireEvent.click(trigger);
    expect(animate).toHaveBeenCalledOnce();
    expect(dialog.open).toBe(true);
  });

  it("restores page scroll and cancels animation if the source unmounts while open", () => {
    const cancel = vi.fn();
    Object.defineProperty(Element.prototype, "animate", { configurable: true, value: () => ({ cancel }) });
    const { unmount } = openInspection();
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe(previousBodyOverflow);
    expect(document.documentElement.style.overflow).toBe(previousRootOverflow);
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("offers the original file and readable recovery context when the image fails", () => {
    const { dialog } = openInspection();
    fireEvent.error(within(dialog).getByRole("img"));
    expect(within(dialog).getByRole("status").textContent).toContain("could not load");
    expect(within(dialog).getByRole("link").getAttribute("href")).toBe(artifact.src);
  });
});
