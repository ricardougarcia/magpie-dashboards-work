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

describe("PublicTimeline telemetry ownership", () => {
  it("dismisses a hover-only preview when the page is clicked outside it", async () => {
    render(<PublicTimeline data={data} />);
    fireEvent.pointerEnter(getTimelineItem("First item"), { pointerType: "mouse" });
    expect(screen.getByLabelText("Preview for First item")).toBeTruthy();

    fireEvent.pointerDown(screen.getByRole("heading", { name: "The work, in motion" }), { pointerType: "mouse" });
    await waitFor(() => expect(screen.queryByLabelText("Preview for First item")).toBeNull());
  });

  it("replaces the current telemetry record when another Gantt item is selected", async () => {
    render(<PublicTimeline data={data} />);
    const first = getTimelineItem("First item");
    const second = getTimelineItem("Second item");

    fireEvent.pointerEnter(first, { pointerType: "mouse" });
    expect(screen.getByLabelText("Preview for First item")).toBeTruthy();
    fireEvent.click(first);
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());

    fireEvent.pointerEnter(second, { pointerType: "mouse" });
    await waitFor(() => expect(screen.getByLabelText("Preview for Second item")).toBeTruthy());
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

  it("clears stale hover ownership after viewport movement while preserving a pinned record", async () => {
    render(<PublicTimeline data={data} />);
    const first = getTimelineItem("First item");
    const second = getTimelineItem("Second item");

    fireEvent.click(first);
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());
    fireEvent.pointerEnter(second, { pointerType: "mouse" });
    await waitFor(() => expect(screen.getByLabelText("Preview for Second item")).toBeTruthy());

    fireEvent(window, new Event("resize"));
    await waitFor(() => {
      expect(screen.queryByLabelText("Preview for Second item")).toBeNull();
      expect(screen.getByLabelText("Selected details for First item")).toBeTruthy();
    });
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

  it("retains Escape as a deterministic dismissal path", async () => {
    render(<PublicTimeline data={data} />);
    fireEvent.click(getTimelineItem("First item"));
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());

    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(screen.queryByLabelText("Selected details for First item")).toBeNull());
  });
});
