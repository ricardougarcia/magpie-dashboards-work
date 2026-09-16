import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pmfAssets } from "@/data/pmf";
import { PmfArtifact } from "./pmf-artifact";
import { PmfCheckpoint } from "./pmf-checkpoint";
import { PmfCapabilityMap } from "./pmf-diagrams";

const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");

beforeEach(() => {
  // JSDOM has no dialog implementation. These shims represent the browser's
  // open/close lifecycle; actual Escape/top-layer behavior is checked in-browser.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
    this.querySelector<HTMLElement>("[autofocus]")?.focus();
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
});

function enter(target: Element, pointerType: "mouse" | "touch" | "pen") {
  const event = new MouseEvent("pointerover", { bubbles: true });
  Object.assign(event, { pointerType });
  fireEvent(target, event);
}

function checkpoint(withArtifact = false) {
  const view = render(<>
    <PmfCheckpoint id="question" label="The research choice" title="Make the unfamiliar discussable." reasoning="A prototype makes unfamiliar capabilities discussable without committing to an interface.">
      {withArtifact ? <PmfArtifact artifact={pmfAssets.segmentation} /> : <button type="button">Explore example</button>}
    </PmfCheckpoint>
    <button type="button">Next section</button>
  </>);
  const toggle = screen.getByRole("button", { name: /Make the unfamiliar discussable/ });
  return { ...view, toggle, article: toggle.closest("article")!, detail: document.getElementById(toggle.getAttribute("aria-controls")!)! };
}

describe("PMF checkpoint reasoning", () => {
  it("reveals on mouse entry and dismisses when the visitor leaves an unpinned checkpoint", () => {
    const { article, toggle, detail } = checkpoint();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(detail.getAttribute("aria-hidden")).toBe("true");
    enter(article, "mouse");
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(detail.getAttribute("aria-hidden")).toBe("false");
    fireEvent.pointerOut(article, { relatedTarget: document.body });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("pins reasoning by click, retains it after leaving, and dismisses on a second click", () => {
    const { article, toggle } = checkpoint();
    enter(article, "mouse");
    fireEvent.click(toggle);
    fireEvent.pointerOut(article, { relatedTarget: document.body });
    act(() => screen.getByRole("button", { name: "Next section" }).focus());
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("opens on keyboard focus, stays open within the checkpoint, and closes when focus leaves", () => {
    const { article, toggle } = checkpoint();
    act(() => toggle.focus());
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerOut(article, { relatedTarget: document.body });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    act(() => screen.getByRole("button", { name: "Explore example" }).focus());
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    act(() => screen.getByRole("button", { name: "Next section" }).focus());
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("dismisses a pinned checkpoint with Escape and permits a later keyboard revisit", () => {
    const { toggle } = checkpoint();
    act(() => toggle.focus());
    fireEvent.click(toggle);
    fireEvent.keyDown(toggle, { key: "Escape" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
    act(() => screen.getByRole("button", { name: "Next section" }).focus());
    act(() => toggle.focus());
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    act(() => screen.getByRole("button", { name: "Next section" }).focus());
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("does not expand during touch contact before explicit activation", () => {
    const { article, toggle } = checkpoint();
    enter(article, "touch");
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });

  it("keeps an open checkpoint intact when Escape is handled by its artifact dialog", () => {
    const { toggle } = checkpoint(true);
    fireEvent.click(toggle);
    const trigger = screen.getByRole("button", { name: /View overview:/ });
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    // Emulate the browser default after an uncancelled native Escape event.
    act(() => {
      const cancel = new Event("cancel", { cancelable: true });
      if (dialog.dispatchEvent(cancel)) dialog.close();
    });
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });
});

describe("PMF protected artifact inspection", () => {
  it.each(Object.values(pmfAssets))("opens the same protected overview for $title", artifact => {
    render(<PmfArtifact artifact={artifact} />);
    const trigger = screen.getByRole("button", { name: `View overview: ${artifact.title}` });
    const thumbnail = within(trigger).getByRole("img");
    act(() => trigger.focus());
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: artifact.title }) as HTMLDialogElement;
    const enlarged = within(dialog).getByRole("img");
    expect(dialog.open).toBe(true);
    expect(thumbnail.getAttribute("src")).toBe(artifact.src);
    expect(enlarged.getAttribute("src")).toBe(artifact.src);
    expect(enlarged.getAttribute("src")).toMatch(/^\/portfolio\/pmf\/.+-overview\.png$/);
    expect(enlarged.getAttribute("srcset")).toBeNull();
    expect(within(dialog).queryByRole("link")).toBeNull();
    expect(document.body.style.overflow).toBe("hidden");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("");
  });

  it("preserves existing page overflow when native dialog dismissal restores trigger focus", () => {
    document.body.style.overflow = "clip";
    render(<PmfArtifact artifact={pmfAssets.interview} />);
    const trigger = screen.getByRole("button", { name: /View overview:/ });
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    act(() => {
      const cancel = new Event("cancel", { cancelable: true });
      if (dialog.dispatchEvent(cancel)) dialog.close();
    });
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("clip");
  });

  it("does not dismiss a click inside the dialog, but dismisses one outside its bounds", () => {
    render(<PmfArtifact artifact={pmfAssets.market} />);
    const trigger = screen.getByRole("button", { name: /View overview:/ });
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 20, right: 300, top: 20, bottom: 500 } as DOMRect);
    fireEvent.click(dialog, { clientX: 100, clientY: 100 });
    expect(dialog.open).toBe(true);
    fireEvent.click(dialog, { clientX: 5, clientY: 5 });
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("releases the page scroll lock when an open artifact is unmounted", () => {
    const { unmount } = render(<PmfArtifact artifact={pmfAssets.market} />);
    fireEvent.click(screen.getByRole("button", { name: /View overview:/ }));
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

const capabilityExpectations = [
  ["Population segmentation", "population groups and distributions"],
  ["Attribute generation", "a newly generated attribute"],
  ["Probabilistic inference", "probabilistic output"],
  ["Data imputation", "missing data and confidence information"],
] as const;

describe.each(["mouse", "keyboard", "tap"] as const)("PMF capability exploration by %s", input => {
  it.each(capabilityExpectations)("connects %s to its public research purpose", (label, purpose) => {
    const { container } = render(<PmfCapabilityMap />);
    fireEvent.click(screen.getByRole("button", { name: label === "Data imputation" ? "Population segmentation" : "Data imputation" }));
    const button = screen.getByRole("button", { name: label });
    if (input === "mouse") enter(button, "mouse");
    else if (input === "keyboard") act(() => button.focus());
    else fireEvent.click(button);
    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(1);
    const detail = document.getElementById(button.getAttribute("aria-controls")!)!;
    expect(detail.textContent).toContain(purpose);
    expect(button.getAttribute("aria-describedby")).toBe(detail.id);
    if (input === "keyboard") expect(document.activeElement).toBe(button);
    fireEvent.pointerOut(button, { relatedTarget: document.body });
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });
});

it.each(["touch", "pen"] as const)("retains the current capability on %s contact until explicit activation", pointerType => {
  render(<PmfCapabilityMap />);
  const initial = screen.getByRole("button", { name: "Population segmentation" });
  const target = screen.getByRole("button", { name: "Probabilistic inference" });
  enter(target, pointerType);
  expect(initial.getAttribute("aria-pressed")).toBe("true");
  expect(target.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(target);
  expect(target.getAttribute("aria-pressed")).toBe("true");
});
