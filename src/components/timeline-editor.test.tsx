import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TimelineEditor } from "@/components/timeline-editor";
import type { TimelineData } from "@/lib/timeline-types";

class ResizeObserverMock implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const data: TimelineData = {
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
      id: "source-item",
      name: "Source item",
      lane: "Eng Build",
      description: "Source context.",
      placement: "Jan - Feb",
      value: "Source value.",
      relations: [{ targetId: "target-item", targetName: "Target item", description: "Existing connected work." }],
      guidingLights: ["Learn"],
      start: 0,
      end: 1,
      planned: false,
      ongoing: false,
      colorToken: "graphite",
      media: null,
    },
    {
      id: "target-item",
      name: "Target item",
      lane: "Product Build",
      description: "Target context.",
      placement: "Mar - Apr",
      value: "Target value.",
      relations: [],
      guidingLights: ["Fix"],
      start: 2,
      end: 3,
      planned: false,
      ongoing: false,
      colorToken: "signal",
      media: null,
    },
    {
      id: "unconnected-item",
      name: "Unconnected item",
      lane: "Product Build",
      description: "Unconnected context.",
      placement: "May - Jun",
      value: "Unconnected value.",
      relations: [],
      guidingLights: ["Grow"],
      start: 4,
      end: 5,
      planned: false,
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
  vi.restoreAllMocks();
});

describe("TimelineEditor orthogonal connector workflow", () => {
  it("opens a line editor only for the selected item’s existing Connected Work relation", () => {
    render(<TimelineEditor initialData={data} />);

    expect(screen.getAllByRole("button", { name: /Edit orthogonal line/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /Edit orthogonal line/ }));

    const workspace = screen.getByLabelText("Edit connector from Source item to Target item");
    const boardItems = Array.from(workspace.querySelectorAll<HTMLElement>(".connector-board-item"));
    const boardItem = (name: string) => boardItems.find((item) => item.textContent === name);
    expect(boardItem("Source item")?.classList.contains("is-source")).toBe(true);
    expect(boardItem("Target item")?.classList.contains("is-target")).toBe(true);
    expect(boardItem("Unconnected item")?.classList.contains("is-context")).toBe(true);
  });

  it("persists terminal changes and a dragged midpoint elbow", async () => {
    let saved: TimelineData | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      saved = JSON.parse(String(init?.body)) as TimelineData;
      return new Response(JSON.stringify(saved), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));
    const { container } = render(<TimelineEditor initialData={data} />);

    fireEvent.click(screen.getByRole("button", { name: /Edit orthogonal line/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "top" })[0]);
    const midpoint = container.querySelector<SVGRectElement>(".connector-mid-handle");
    expect(midpoint).toBeTruthy();
    fireEvent.pointerDown(midpoint!, { clientX: 280, clientY: 90, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 280, clientY: 146, pointerId: 1 });
    fireEvent.pointerUp(window, { clientX: 280, clientY: 146, pointerId: 1 });
    fireEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(saved).not.toBeNull());

    const connector = (saved as TimelineData | null)?.items[0].relations[0].connector;
    expect(connector?.source.side).toBe("top");
    expect(connector?.points.length).toBeGreaterThan(4);
  });

  it("persists an owner-defined route in the existing relation save payload", async () => {
    let saved: TimelineData | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      saved = JSON.parse(String(init?.body)) as TimelineData;
      return new Response(JSON.stringify(saved), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));
    render(<TimelineEditor initialData={data} />);

    fireEvent.click(screen.getByRole("button", { name: /Edit orthogonal line/ }));
    fireEvent.click(screen.getByRole("button", { name: /Reset route/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    expect(screen.getByText("Custom route saved")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(saved).not.toBeNull());

    const connector = (saved as TimelineData | null)?.items[0].relations[0].connector;
    expect(connector?.points.length).toBeGreaterThanOrEqual(2);
    expect(connector?.source.side).toBeTruthy();
    expect(connector?.target.side).toBeTruthy();
  });
});
