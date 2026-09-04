import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PublicTimeline } from "@/components/public-timeline";
import type { PublicTimelineData } from "@/lib/timeline-types";

class ResizeObserverMock implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const data: PublicTimelineData = {
  version: 1,
  updatedAt: "2026-09-03T00:00:00.000Z",
  meta: {
    title: "Magpie Dashboards",
    subtitle: "Product leadership through rebuild, recovery, and scale",
    owner: "Rico Garcia",
    period: "January–September 2026",
  },
  lanes: [
    { id: "eng-build", name: "Eng Build", displayName: "Eng Build", index: 1 },
    { id: "product-build", name: "Product Build", displayName: "Product Build", index: 2 },
    { id: "in-flight-future", name: "In-Flight / Future", displayName: "In-Flight / Future", index: 6 },
  ],
  items: [
    {
      id: "first-item",
      name: "First item",
      lane: "Eng Build",
      description: "First item context.",
      placement: "Jan - Feb",
      value: "First item value.",
      relations: [{ targetId: "second-item", targetName: "Second item", description: "Connected work." }],
      start: 0,
      end: 1,
      planned: false,
      ongoing: false,
      colorToken: "graphite",
      media: null,
    },
    {
      id: "second-item",
      name: "Second item",
      lane: "Product Build",
      description: "Second item context.",
      placement: "Feb - Mar",
      value: "Second item value.",
      relations: [],
      start: 1,
      end: 2,
      planned: false,
      ongoing: false,
      colorToken: "signal",
      media: null,
    },
    {
      id: "planned-item",
      name: "Planned item",
      lane: "In-Flight / Future",
      description: "Planned item context.",
      placement: "Oct - Nov (planned)",
      value: "Future value.",
      relations: [],
      start: 9,
      end: 10,
      planned: true,
      ongoing: false,
      colorToken: "forest",
      media: null,
    },
  ],
};

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.stubGlobal("matchMedia", vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function getTimelineItem(name: string) {
  return screen.getByRole("button", { name: new RegExp(`^${name},`) });
}

describe("PublicTimeline presentation safeguards", () => {
  it("renders the simplified copy, mapped legend tokens, and no native Gantt tooltips", () => {
    const { container } = render(<PublicTimeline data={data} />);

    expect(screen.queryByText("Hover to scan. Select a bar to pin its record and trace every connected work item.")).toBeNull();
    expect(screen.getByText("Planned")).toBeTruthy();
    expect(screen.queryByText("Planned. Not yet placed.")).toBeNull();

    const legend = screen.getByLabelText("Color key");
    expect(Array.from(legend.querySelectorAll("i")).map((swatch) => swatch.className)).toEqual([
      "color-graphite",
      "color-signal",
      "color-steel",
      "color-umber",
      "color-forest",
    ]);
    container.querySelectorAll("[data-timeline-item]").forEach((item) => {
      expect(item.hasAttribute("title")).toBe(false);
    });
  });
});

describe("PublicTimeline telemetry ownership", () => {
  it("dismisses a hover-only preview when the page is clicked outside it", async () => {
    render(<PublicTimeline data={data} />);
    fireEvent.pointerEnter(getTimelineItem("First item"), { pointerType: "mouse" });
    expect(screen.getByLabelText("Preview for First item")).toBeTruthy();

    fireEvent.pointerDown(screen.getByRole("heading", { name: "The work, in motion" }), { pointerType: "mouse" });
    await waitFor(() => expect(screen.queryByLabelText("Preview for First item")).toBeNull());
  });

  it("ignores hover while pinned but replaces the record when another Gantt item is selected", async () => {
    render(<PublicTimeline data={data} />);
    const first = getTimelineItem("First item");
    const second = getTimelineItem("Second item");

    fireEvent.pointerEnter(first, { pointerType: "mouse" });
    expect(screen.getByLabelText("Preview for First item")).toBeTruthy();
    fireEvent.click(first);
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());

    fireEvent.pointerEnter(second, { pointerType: "mouse" });
    expect(screen.queryByLabelText("Preview for Second item")).toBeNull();
    expect(screen.getByLabelText("Selected details for First item")).toBeTruthy();
    fireEvent.click(second);

    await waitFor(() => {
      expect(screen.queryByLabelText("Preview for First item")).toBeNull();
      expect(screen.queryByLabelText("Selected details for First item")).toBeNull();
      expect(screen.getByLabelText("Selected details for Second item")).toBeTruthy();
    });
  });

  it("closes a pinned record when the page is clicked outside the telemetry surface", async () => {
    render(<PublicTimeline data={data} />);
    fireEvent.click(getTimelineItem("First item"));
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());

    fireEvent.pointerDown(screen.getByRole("heading", { name: "The work, in motion" }), { pointerType: "mouse" });
    await waitFor(() => expect(screen.queryByLabelText("Selected details for First item")).toBeNull());
  });

  it("preserves a pinned record across hover and viewport movement", async () => {
    render(<PublicTimeline data={data} />);
    const first = getTimelineItem("First item");
    const second = getTimelineItem("Second item");

    fireEvent.click(first);
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());
    fireEvent.pointerEnter(second, { pointerType: "mouse" });
    expect(screen.queryByLabelText("Preview for Second item")).toBeNull();

    fireEvent(window, new Event("resize"));
    expect(screen.getByLabelText("Selected details for First item")).toBeTruthy();
  });

  it("clears an unpinned hover preview when the document pointer boundary is left", async () => {
    render(<PublicTimeline data={data} />);
    fireEvent.pointerEnter(getTimelineItem("First item"), { pointerType: "mouse" });
    expect(screen.getByLabelText("Preview for First item")).toBeTruthy();

    fireEvent.pointerLeave(document.documentElement, { pointerType: "mouse" });
    await waitFor(() => expect(screen.queryByLabelText("Preview for First item")).toBeNull());
  });

  it("keeps the pinned record open when its own controls are used", async () => {
    render(<PublicTimeline data={data} />);
    fireEvent.click(getTimelineItem("First item"));
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());

    fireEvent.click(screen.getByRole("tab", { name: /Connected work/ }));
    const relationButton = await waitFor(() => screen.getByRole("button", { name: "Second item" }));
    fireEvent.click(relationButton);

    expect(screen.getByLabelText("Selected details for First item")).toBeTruthy();
    expect(relationButton.getAttribute("aria-pressed")).toBe("true");
  });

  it("does not create a hover-owned modal from touch entry before selection", async () => {
    render(<PublicTimeline data={data} />);
    const first = getTimelineItem("First item");

    fireEvent.pointerEnter(first, { pointerType: "touch" });
    expect(screen.queryByLabelText("Preview for First item")).toBeNull();
    fireEvent.click(first);
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());
  });

  it("renders a saved owner-defined route without blocking the selected modal", async () => {
    const routedData = structuredClone(data);
    routedData.items[0].relations[0].connector = {
      source: { side: "right", offset: 0.5 },
      target: { side: "left", offset: 0.5 },
      points: [
        { x: 0.12, y: 0.32 },
        { x: 0.48, y: 0.32 },
        { x: 0.48, y: 0.7 },
        { x: 0.88, y: 0.7 },
      ],
    };
    const { container } = render(<PublicTimeline data={routedData} />);

    fireEvent.click(getTimelineItem("First item"));
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());
    const connector = container.querySelector<SVGPathElement>(".connection-layer path");
    expect(connector?.getAttribute("d")).toMatch(/^M /);
  });

  it("retains Escape as a deterministic dismissal path", async () => {
    render(<PublicTimeline data={data} />);
    fireEvent.click(getTimelineItem("First item"));
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByLabelText("Selected details for First item")).toBeNull());
  });
});
