import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { marketplaceArtifacts } from "@/data/marketplace";
import { MarketplaceArtifact, MarketplaceImage } from "./marketplace-artifact";

const artifact = marketplaceArtifacts.discovery;
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
const originalAnimate = Object.getOwnPropertyDescriptor(Element.prototype, "animate");
const originalMatchMedia = Object.getOwnPropertyDescriptor(window, "matchMedia");

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }) });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  }) });
});
afterEach(() => {
  cleanup(); vi.restoreAllMocks();
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  if (originalAnimate) Object.defineProperty(Element.prototype, "animate", originalAnimate);
  else Reflect.deleteProperty(Element.prototype, "animate");
  if (originalMatchMedia) Object.defineProperty(window, "matchMedia", originalMatchMedia);
  else Reflect.deleteProperty(window, "matchMedia");
});

function openInspection() {
  render(<MarketplaceImage artifact={artifact} />);
  const trigger = screen.getByRole("link", { name: `Inspect original: ${artifact.label}` });
  trigger.focus();
  fireEvent.click(trigger);
  return { trigger, dialog: screen.getByRole("dialog") as HTMLDialogElement };
}

describe("Marketplace original inspection", () => {
  it("server-renders a working original link and one unchanged artifact identity", () => {
    const page = document.createElement("div");
    page.innerHTML = renderToString(<MarketplaceArtifact artifact={artifact} code="A" type="Early user flow" />);
    expect(page.querySelectorAll(`#${artifact.id}`)).toHaveLength(1);
    const link = page.querySelector<HTMLAnchorElement>("[data-marketplace-image]")!;
    expect(link.getAttribute("href")).toBe(artifact.src);
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
    expect(page.querySelector("dialog")?.hasAttribute("open")).toBe(false);
    expect(page.querySelectorAll("img")).toHaveLength(1);
    expect(page.querySelector("img")?.getAttribute("width")).toBe(String(artifact.width));
    expect(page.querySelector("img")?.getAttribute("height")).toBe(String(artifact.height));
  });

  it("opens the full original, focuses Close, supports actual size, and restores trigger focus", () => {
    const { trigger, dialog } = openInspection();
    const close = within(dialog).getByRole("button", { name: "Close image inspection" });
    expect(document.activeElement).toBe(close);
    const original = within(dialog).getByRole("img");
    expect(new URL(original.getAttribute("src")!, window.location.href).pathname).toBe(artifact.src);
    expect(original.getAttribute("srcset")).toBeNull();
    const size = within(dialog).getByRole("button", { name: "Actual size" });
    fireEvent.click(size);
    expect(size.getAttribute("aria-pressed")).toBe("true");
    expect(within(dialog).getByRole("region").getAttribute("aria-label")).toContain("scroll to inspect");
    fireEvent.click(close);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    expect(within(dialog).getByRole("button", { name: "Actual size" }).getAttribute("aria-pressed")).toBe("false");
  });

  it("closes on the native Escape cancel event and restores focus", () => {
    const { trigger, dialog } = openInspection();
    const event = new Event("cancel", { cancelable: true });
    act(() => { dialog.dispatchEvent(event); });
    expect(event.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("dismisses only a press and click outside the dialog bounds", () => {
    const { trigger, dialog } = openInspection();
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 20, right: 300, top: 20, bottom: 500 } as DOMRect);
    fireEvent.pointerDown(dialog, { clientX: 50, clientY: 50 });
    fireEvent.click(dialog, { clientX: 5, clientY: 5 });
    expect(dialog.open).toBe(true);
    // JSDOM does not implement PointerEvent coordinates; use a MouseEvent with the native event name.
    fireEvent(dialog, new MouseEvent("pointerdown", { bubbles: true, clientX: 5, clientY: 5 }));
    fireEvent.click(dialog, { clientX: 5, clientY: 5 });
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }])("preserves native activation for %j", (modifier) => {
    render(<MarketplaceImage artifact={artifact} />);
    const trigger = screen.getByRole("link", { name: `Inspect original: ${artifact.label}` });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...modifier });
    // Block JSDOM navigation after recording whether this component intercepted it.
    let intercepted = false;
    const observe = (native: MouseEvent) => { intercepted = native.defaultPrevented; native.preventDefault(); };
    document.addEventListener("click", observe, { once: true });
    act(() => { trigger.dispatchEvent(event); });
    expect(intercepted).toBe(false);
    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  });

  it("keeps the native link when modal inspection is unsupported", () => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: undefined });
    render(<MarketplaceImage artifact={artifact} />);
    const trigger = screen.getByRole("link", { name: `Inspect original: ${artifact.label}` });
    let intercepted = false;
    document.addEventListener("click", (event) => { intercepted = event.defaultPrevented; event.preventDefault(); }, { once: true });
    act(() => { trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); });
    expect(intercepted).toBe(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("retains the direct original link and error context if the inspection image fails", () => {
    const { trigger, dialog } = openInspection();
    fireEvent.error(within(dialog).getByRole("img"));
    expect(within(dialog).getByRole("status").textContent).toContain("could not load");
    expect(within(dialog).getByRole("link").getAttribute("href")).toBe(artifact.src);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close image inspection" }));
    fireEvent.click(trigger);
    expect(within(dialog).getByRole("status").textContent).toContain("could not load");
  });

  it("reveals only the paper surface and cancels superseded, closed and unmounted animation", () => {
    const animations: { cancel: ReturnType<typeof vi.fn> }[] = [];
    const animate = vi.fn(() => { const animation = { cancel: vi.fn() }; animations.push(animation); return animation; });
    Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
    const { trigger, dialog } = openInspection();
    const close = within(dialog).getByRole("button", { name: "Close image inspection" });
    expect(animate.mock.instances[0]).toBe(dialog.querySelector("[data-inspection-paper]"));
    expect(dialog.querySelector("[data-inspection-paper]")?.contains(close)).toBe(false);
    expect(document.activeElement).toBe(close);
    fireEvent.click(trigger);
    expect(animations[0].cancel).toHaveBeenCalledOnce();
    fireEvent.click(close);
    expect(animations[1].cancel).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    cleanup();
    expect(animations[2].cancel).toHaveBeenCalledOnce();
  });

  it("opens immediately without animation when reduced motion is enabled", () => {
    const animate = vi.fn();
    Object.defineProperty(Element.prototype, "animate", { configurable: true, value: animate });
    Object.defineProperty(window, "matchMedia", { configurable: true, value: () => ({ matches: true }) });
    const { trigger, dialog } = openInspection();
    expect(dialog.open).toBe(true);
    expect(animate).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("button", { name: "Close image inspection" }));
    expect(document.activeElement).toBe(trigger);
  });
});
