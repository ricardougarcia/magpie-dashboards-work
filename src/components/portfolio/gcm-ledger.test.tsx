import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GcmLedger } from "./gcm-ledger";

afterEach(cleanup);

const expectations = [
  { label: "Select the correct tool", active: ["llm"], requirement: "Choose the right operation.", detail: "correct GCM function" },
  { label: "Clarify ambiguous queries", active: ["llm"], requirement: "Clarify before execution.", detail: "multiple tools" },
  { label: "Preserve conditions and filters", active: ["llm", "mcp"], requirement: "Keep the conditions intact.", detail: "assumptions and filters" },
  { label: "Summarize results faithfully", active: ["llm", "gcm"], requirement: "Represent the result faithfully.", detail: "GCM actually returned" },
  { label: "Maintain session context", active: ["llm"], requirement: "Carry context forward.", detail: "earlier question or result" },
  { label: "Surface tool limitations", active: ["llm", "mcp"], requirement: "Make the limits visible.", detail: "unsupported operations" },
];

function enter(target: Element, pointerType: "mouse" | "touch" | "pen") {
  const event = new MouseEvent("pointerover", { bubbles: true });
  Object.assign(event, { pointerType });
  fireEvent(target, event);
}

describe.each(["mouse", "keyboard", "tap"] as const)("GCM ledger using %s", (input) => {
  it.each(expectations)("connects $label to its requirement and responsible components", ({ label, active, requirement, detail }) => {
    const { container, getByRole } = render(<GcmLedger />);
    const button = getByRole("button", { name: new RegExp(label) });
    // Start on a different behavior so the default row must also prove its interaction.
    fireEvent.click(getByRole("button", { name: label === "Surface tool limitations" ? /Select the correct tool/ : /Surface tool limitations/ }));
    if (input === "mouse") enter(button, "mouse");
    else if (input === "keyboard") act(() => button.focus());
    else fireEvent.click(button);

    expect(button.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(1);
    if (input === "keyboard") expect(document.activeElement).toBe(button);
    const panel = container.querySelector(`#${button.getAttribute("aria-controls")}`)!;
    expect(panel).toBeTruthy();
    expect(getByRole("heading", { level: 3, name: requirement })).toBeTruthy();
    const description = container.querySelector(`#${button.getAttribute("aria-describedby")}`)!;
    expect(description.textContent).toContain(detail);
    expect([...panel.querySelectorAll('[data-component][data-active="true"]')].map(node => node.getAttribute("data-component"))).toEqual(active);
    expect(panel.querySelectorAll("[data-component]")).toHaveLength(3);
    expect(panel.textContent).toContain("Generative Consumer Model");
  });
});

it.each(["touch", "pen"] as const)("does not change the ledger during %s contact before explicit activation", pointerType => {
  const { getByRole } = render(<GcmLedger />);
  const initial = getByRole("button", { name: /Select the correct tool/ });
  const target = getByRole("button", { name: /Summarize results faithfully/ });
  enter(target, pointerType);
  expect(initial.getAttribute("aria-pressed")).toBe("true");
  expect(target.getAttribute("aria-pressed")).toBe("false");
  fireEvent.click(target);
  expect(target.getAttribute("aria-pressed")).toBe("true");
});

it("keeps a selected responsibility available after leaving the row", () => {
  const { getByRole } = render(<GcmLedger />);
  const target = getByRole("button", { name: /Preserve conditions and filters/ });
  enter(target, "mouse");
  fireEvent.pointerOut(target, { relatedTarget: document.body });
  expect(target.getAttribute("aria-pressed")).toBe("true");
  expect(getByRole("heading", { name: "Keep the conditions intact." })).toBeTruthy();
});
