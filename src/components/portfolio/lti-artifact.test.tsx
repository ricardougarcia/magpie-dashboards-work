import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LtiAsset, LtiInspectionView } from "@/data/lti";
import { LtiArtifact } from "./lti-artifact";

const artifact: LtiAsset = {
  id: "lti-test-source", code: "A080", src: "/portfolio/lti/configuration-paths.png", width: 2612, height: 1484,
  alt: "Original configuration paths board", label: "Configuration paths", surface: "paper",
  caption: "The configuration board shows URL, manual, and JSON setup paths.",
};
const relatedArtifact: LtiAsset = {
  id: "lti-related-source", code: "Planning", src: "/portfolio/lti/planning-schema.png", width: 4448, height: 2308,
  alt: "Original planning and schema board", label: "Planning and schema", surface: "paper",
  caption: "The planning board separates actor journeys and working questions.",
};
const views: readonly LtiInspectionView[] = [
  { id: "all-paths", label: "All paths", artifact, note: artifact.caption },
  { id: "planning-board", label: "Planning board", artifact: relatedArtifact, note: "Explore the complete working board." },
  { id: "provider-journey", label: "Provider journey", artifact: relatedArtifact, note: "The provider flow separates saving from publishing.", region: { x: 1530, y: 300, width: 1390, height: 1700 } },
];
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

function openInspection(inspectionViews?: readonly LtiInspectionView[]) {
  const rendered = render(<LtiArtifact artifact={artifact} views={inspectionViews} />);
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
    expect(page.querySelector("figure")?.getAttribute("data-lti-artifact")).toBe("A080");
    expect(page.querySelectorAll("img")).toHaveLength(1);
    expect(page.querySelector("img")?.getAttribute("width")).toBe("2612");
    expect(page.querySelector("img")?.getAttribute("height")).toBe("1484");
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
    render(<LtiArtifact artifact={artifact} views={views} compact />);
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

  it("switches related originals and source details with the selected note and original-file link", () => {
    const { dialog } = openInspection(views);
    const navigation = within(dialog).getByRole("navigation", { name: "Explore source views" });
    const first = within(navigation).getByRole("button", { name: "All paths" });
    const related = within(navigation).getByRole("button", { name: "Planning board" });
    expect(first.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(related);
    expect(first.getAttribute("aria-pressed")).toBe("false");
    expect(related.getAttribute("aria-pressed")).toBe("true");
    expect(within(dialog).getByRole("heading", { name: relatedArtifact.label })).toBeDefined();
    expect(new URL(within(dialog).getByRole("img").getAttribute("src")!, window.location.href).pathname).toBe(relatedArtifact.src);
    expect(within(dialog).getByText(views[1].note)).toBeDefined();
    expect(within(dialog).getByRole("link", { name: `Open original: ${relatedArtifact.label} (opens in a new tab)` }).getAttribute("href")).toBe(relatedArtifact.src);

    const detail = within(navigation).getByRole("button", { name: "Provider journey" });
    fireEvent.click(detail);
    expect(detail.getAttribute("aria-pressed")).toBe("true");
    expect(related.getAttribute("aria-pressed")).toBe("false");
    const crop = within(dialog).getByRole("img", { name: `Provider journey. ${relatedArtifact.alt}` });
    expect(crop.getAttribute("viewBox")).toBe("1530 300 1390 1700");
    const source = crop.querySelector("image")!;
    expect(source.getAttribute("href")).toBe(relatedArtifact.src);
    expect(source.getAttribute("width")).toBe(String(relatedArtifact.width));
    expect(source.getAttribute("height")).toBe(String(relatedArtifact.height));
    expect(within(dialog).getByText(views[2].note)).toBeDefined();
    expect(within(dialog).getByRole("link").getAttribute("href")).toBe(relatedArtifact.src);
  });

  it("returns a newly selected view to fit size and its starting scroll position", () => {
    const { dialog } = openInspection(views);
    const size = within(dialog).getByRole("button", { name: "Actual size" });
    const viewport = within(dialog).getByRole("region");
    fireEvent.click(size);
    viewport.scrollLeft = 250;
    viewport.scrollTop = 400;
    fireEvent.click(within(dialog).getByRole("button", { name: "Provider journey" }));
    expect(size.getAttribute("aria-pressed")).toBe("false");
    expect(viewport.scrollLeft).toBe(0);
    expect(viewport.scrollTop).toBe(0);
    expect(viewport.getAttribute("aria-label")).toBe("Provider journey: source detail");
    fireEvent.click(size);
    expect(viewport.getAttribute("aria-label")).toBe("Provider journey: actual size, scroll to inspect");
    expect(within(dialog).getByRole("img").getAttribute("width")).toBe("1390");
    expect(within(dialog).getByRole("img").getAttribute("height")).toBe("1700");
  });

  it("recovers from failed complete images and cropped images when another view is selected", () => {
    const { dialog } = openInspection(views);
    fireEvent.error(within(dialog).getByRole("img"));
    expect(within(dialog).getByRole("status").textContent).toContain("could not load");
    fireEvent.click(within(dialog).getByRole("button", { name: "Provider journey" }));
    expect(within(dialog).queryByRole("status")).toBeNull();
    fireEvent.error(within(dialog).getByRole("img").querySelector("image")!);
    expect(within(dialog).getByRole("status").textContent).toContain("could not load");
    expect(within(dialog).getByRole("link").getAttribute("href")).toBe(relatedArtifact.src);
    fireEvent.click(within(dialog).getByRole("button", { name: "All paths" }));
    expect(within(dialog).queryByRole("status")).toBeNull();
    expect(within(dialog).getByRole("link").getAttribute("href")).toBe(artifact.src);
  });

  it("reopens at the initial source after closing a failed detail at actual size", () => {
    const { dialog, trigger } = openInspection(views);
    fireEvent.click(within(dialog).getByRole("button", { name: "Provider journey" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Actual size" }));
    fireEvent.error(within(dialog).getByRole("img").querySelector("image")!);
    fireEvent.click(within(dialog).getByRole("button", { name: "Close source inspection" }));
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    expect(within(dialog).getByRole("button", { name: "All paths" }).getAttribute("aria-pressed")).toBe("true");
    expect(within(dialog).getByRole("button", { name: "Provider journey" }).getAttribute("aria-pressed")).toBe("false");
    expect(within(dialog).getByRole("button", { name: "Actual size" }).getAttribute("aria-pressed")).toBe("false");
    expect(within(dialog).queryByRole("status")).toBeNull();
    expect(new URL(within(dialog).getByRole("img").getAttribute("src")!, window.location.href).pathname).toBe(artifact.src);
    expect(within(dialog).getByRole("link").getAttribute("href")).toBe(artifact.src);
  });

  it("server-renders each additional source once for visitors without JavaScript", () => {
    const page = new DOMParser().parseFromString(renderToString(<LtiArtifact artifact={artifact} views={views} />), "text/html");
    const fallback = page.querySelector("noscript")!;
    const links = fallback.querySelectorAll("a");
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe(relatedArtifact.src);
    expect(links[0].textContent).toBe(relatedArtifact.label);
    expect(links[0].target).toBe("_blank");
    expect(links[0].rel).toContain("noopener");
    expect(page.querySelector("[data-lti-source]")?.getAttribute("href")).toBe(artifact.src);
  });
});
