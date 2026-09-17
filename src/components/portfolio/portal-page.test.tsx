import type { ReactNode } from "react";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PartnerPortalPage } from "./portal-page";
import { portalAssets } from "./portal-data";

const motion = vi.hoisted(() => ({
  track: { current: null },
  stage: { current: null },
  atlas: { current: null },
  step: 1,
  percent: 14,
  playing: false,
  reduced: true,
  lessMotion: true,
  setLessMotion: vi.fn(),
  stop: vi.fn(),
  go: vi.fn(),
  move: vi.fn(),
  play: vi.fn(),
}));

vi.mock("./portal-motion", () => ({ usePortalMotion: () => motion }));
vi.mock("@/components/coordinate-cursor", () => ({ CoordinateCursor: () => null }));
vi.mock("./portfolio-shell", () => ({ PortfolioShell: ({ children }: { children: ReactNode }) => <>{children}</> }));

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

function setupDiscovery() {
  const result = render(<PartnerPortalPage />);
  const tablist = result.getByRole("tablist", { name: "Discovery artifacts" });
  const workflow = within(tablist).getByRole("tab", { name: "Workflow Map" });
  const journey = within(tablist).getByRole("tab", { name: "Journey Map" });
  const panel = result.getByRole("tabpanel");
  return { ...result, tablist, workflow, journey, panel };
}

function expectSelectedArtifact(panel: HTMLElement, selected: HTMLElement, other: HTMLElement, key: "workflow" | "journey") {
  expect(selected.getAttribute("aria-selected")).toBe("true");
  expect(selected.tabIndex).toBe(0);
  expect(other.getAttribute("aria-selected")).toBe("false");
  expect(other.tabIndex).toBe(-1);
  expect(panel.getAttribute("aria-labelledby")).toBe(selected.id);
  expect(selected.getAttribute("aria-controls")).toBe(panel.id);
  const image = within(panel).getByRole("img");
  expect(image.getAttribute("src")).toBe(portalAssets[key].src);
  expect(image.getAttribute("alt")).toBe(portalAssets[key].description);
  expect(within(panel).getByRole("button").getAttribute("aria-label"))
    .toBe(`Inspect ${key === "workflow" ? "Workflow Map" : "Journey Map"}`);
}

describe("Partner Portal discovery artifacts", () => {
  it("opens the provider-work milestone with Workflow Map first and selected, followed by Journey Map", () => {
    const { getByRole, tablist, panel, workflow, journey } = setupDiscovery();
    expect(getByRole("heading", { level: 1 }).textContent).toBe("Start with the provider’s work.");
    expect(within(tablist).getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Workflow Map", "Journey Map"]);
    expectSelectedArtifact(panel, workflow, journey, "workflow");
    expect(panel.closest("[hidden], [inert], [aria-hidden='true']")).toBeNull();
  });

  it("lets the reader select the secondary journey artifact and return to the workflow", () => {
    const { panel, workflow, journey } = setupDiscovery();
    fireEvent.click(journey);
    expectSelectedArtifact(panel, journey, workflow, "journey");
    fireEvent.click(workflow);
    expectSelectedArtifact(panel, workflow, journey, "workflow");
  });

  it("moves selection, focus, and the displayed artifact together with Arrow keys, Home, and End", () => {
    const { panel, workflow, journey } = setupDiscovery();
    workflow.focus();
    for (const [from, key, selected, other, asset] of [
      [workflow, "ArrowRight", journey, workflow, "journey"],
      [journey, "ArrowRight", workflow, journey, "workflow"],
      [workflow, "ArrowLeft", journey, workflow, "journey"],
      [journey, "Home", workflow, journey, "workflow"],
      [workflow, "End", journey, workflow, "journey"],
      [journey, "ArrowLeft", workflow, journey, "workflow"],
    ] as const) {
      fireEvent.keyDown(from, { key });
      expect(document.activeElement).toBe(selected);
      expectSelectedArtifact(panel, selected, other, asset);
    }
  });

  it("keeps the product contribution and discovery work visible alongside either artifact", () => {
    const { getByRole, journey } = setupDiscovery();
    const work = getByRole("region", { name: "Product work behind this milestone" });
    for (const chooseJourney of [false, true]) {
      if (chooseJourney) fireEvent.click(journey);
      expect(work.closest("[hidden], [inert], [aria-hidden='true'], dialog")).toBeNull();
      expect(within(work).getByRole("heading").textContent).toBe("Understand the work before unifying it.");
      expect(work.textContent).toContain("I developed partner personas to prioritize requirements around provider needs.");
      expect(within(work).getAllByRole("listitem").map(item => item.textContent)).toEqual([
        "Provider + internal interviews", "Journey and workflow mapping", "Prioritization workshops",
      ]);
      expect(within(work).getByRole("button", { name: "Explore the work" })).toBeTruthy();
    }
  });
});
