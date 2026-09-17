import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { isInaccessible } from "@testing-library/dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pmfAssets, pmfPrototypeFrames } from "@/data/pmf";
import { PmfArtifact } from "./pmf-artifact";

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
const selectorLabels = ["Prototype", "Segment", "Ask", "Enrich"];

beforeEach(() => {
  // JSDOM lacks the native dialog lifecycle. Browser verification covers its
  // top layer and native Escape behavior; these shims exercise React cleanup.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
    (this.querySelector<HTMLElement>("[autofocus]") ?? this.querySelector<HTMLElement>("button"))?.focus();
  }) });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  }) });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalShowModal) Object.defineProperty(HTMLDialogElement.prototype, "showModal", originalShowModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
  if (originalClose) Object.defineProperty(HTMLDialogElement.prototype, "close", originalClose);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

function enter(target: Element, pointerType: "mouse" | "touch") {
  const event = new MouseEvent("pointerover", { bubbles: true });
  Object.assign(event, { pointerType });
  fireEvent(target, event);
}

function gallery() {
  const view = render(<PmfArtifact artifact={pmfPrototypeFrames[0]} sequence={pmfPrototypeFrames} />);
  const selectors = within(screen.getByRole("group", { name: "Prototype views" }));
  const buttons = selectorLabels.map(name => selectors.getByRole("button", { name }));
  return { ...view, buttons };
}

function expectSelected(index: number, buttons: HTMLElement[]) {
  const frame = pmfPrototypeFrames[index];
  const trigger = screen.getByRole("button", { name: `View image: ${frame.title}` });
  expect(buttons.map(button => button.getAttribute("aria-pressed"))).toEqual(buttons.map((_, position) => String(position === index)));
  expect(buttons.map(button => button.tabIndex)).toEqual(buttons.map((_, position) => position === index ? 0 : -1));
  expect(within(trigger).getAllByRole("img")).toHaveLength(1);
  expect(within(trigger).getByRole("img").getAttribute("src")).toBe(frame.src);
  expect(within(trigger).getByRole("img").getAttribute("alt")).toBe(frame.alt);
  expect(isInaccessible(screen.getByText(frame.caption, { exact: true }))).toBe(false);
  return trigger;
}

describe("PMF prototype gallery", () => {
  it("starts with the prototype and exposes only the selected frame to assistive technology", () => {
    const { buttons, container } = gallery();
    expectSelected(0, buttons);
    expect(container.querySelector("figcaption")?.textContent).toContain("Original prototype frame");
    expect(container.textContent).not.toContain("details withheld");
  });

  it("selects on mouse entry and retains the image after the pointer leaves", () => {
    const { buttons } = gallery();
    enter(buttons[1], "mouse");
    expectSelected(1, buttons);
    fireEvent.pointerOut(buttons[1], { relatedTarget: document.body });
    expectSelected(1, buttons);
    enter(buttons[3], "mouse");
    expectSelected(3, buttons);
  });

  it("waits for a tap before changing the selected frame on touch", () => {
    const { buttons } = gallery();
    enter(buttons[2], "touch");
    expectSelected(0, buttons);
    fireEvent.click(buttons[2]);
    expectSelected(2, buttons);
    fireEvent.pointerOut(buttons[2], { relatedTarget: document.body });
    expectSelected(2, buttons);
  });

  it("selects the focused view and moves focus and selection together with the keyboard", () => {
    const { buttons } = gallery();
    act(() => buttons[1].focus());
    expectSelected(1, buttons);

    for (const [key, index] of [["ArrowRight", 2], ["End", 3], ["Home", 0], ["ArrowLeft", 3]] as const) {
      fireEvent.keyDown(document.activeElement!, { key });
      expect(document.activeElement).toBe(buttons[index]);
      expectSelected(index, buttons);
    }
  });

  it("inspects the selected frame, restores scroll and focus, and retains the selection on close", () => {
    document.body.style.overflow = "clip";
    document.documentElement.style.overflow = "auto";
    const { buttons } = gallery();
    fireEvent.click(buttons[2]);
    const frame = pmfPrototypeFrames[2];
    const trigger = expectSelected(2, buttons);
    act(() => trigger.focus());
    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog", { name: frame.title }) as HTMLDialogElement;
    const close = within(dialog).getByRole("button", { name: "Close" });
    expect(dialog.open).toBe(true);
    expect(within(dialog).getByRole("img").getAttribute("src")).toBe(frame.src);
    expect(within(dialog).getByText("Original prototype frame")).toBeDefined();
    expect(document.activeElement).toBe(close);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");

    fireEvent.click(close);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("clip");
    expect(document.documentElement.style.overflow).toBe("auto");
    expectSelected(2, buttons);
  });

  it("preserves the protected overview behavior when no sequence is supplied", () => {
    const artifact = pmfAssets.market;
    const { container } = render(<PmfArtifact artifact={artifact} />);
    expect(screen.queryByRole("group", { name: "Prototype views" })).toBeNull();
    const trigger = screen.getByRole("button", { name: `View overview: ${artifact.title}` });
    expect(within(trigger).getByRole("img").getAttribute("src")).toBe(artifact.src);
    expect(container.querySelector("figcaption")?.textContent).toContain("Original artifact · details withheld");
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: artifact.title });
    expect(within(dialog).getByRole("img").getAttribute("src")).toBe(artifact.src);
    expect(within(dialog).getByText("Original artifact · details withheld")).toBeDefined();
  });
});
