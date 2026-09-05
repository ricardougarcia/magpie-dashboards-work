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
      relations: [
        { targetId: "target-item", targetName: "Target item", description: "Existing connected work." },
        { targetId: "second-target-item", targetName: "Second target item", description: "Second connected work." },
      ],
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
      id: "second-target-item",
      name: "Second target item",
      lane: "Product Build",
      description: "Second target context.",
      placement: "Apr - May",
      value: "Second target value.",
      relations: [],
      guidingLights: ["Stabilize"],
      start: 3,
      end: 4,
      planned: false,
      ongoing: false,
      colorToken: "forest",
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
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0)));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => window.clearTimeout(id)));
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
  it("shows the selected item’s complete network and opens one item-level line editor", async () => {
    const { container } = render(<TimelineEditor initialData={data} />);

    await waitFor(() => expect(screen.getByLabelText("Connected Work lines for Source item")).toBeTruthy());
    expect(container.querySelectorAll(".editor-network-preview path")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /Edit all Connected Work lines/ })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /^Edit orthogonal line$/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Edit all Connected Work lines/ }));

    const workspace = screen.getByLabelText("Edit Connected Work lines for Source item");
    const boardItems = Array.from(workspace.querySelectorAll<HTMLElement>(".connector-board-item"));
    const boardItem = (name: string) => boardItems.find((item) => item.textContent === name);
    expect(boardItem("Source item")?.classList.contains("is-source")).toBe(true);
    expect(boardItem("Target item")?.classList.contains("is-target")).toBe(true);
    expect(boardItem("Second target item")?.classList.contains("is-target")).toBe(true);
    expect(boardItem("Unconnected item")?.classList.contains("is-context")).toBe(true);
    expect(workspace.querySelectorAll(".connector-network-route")).toHaveLength(2);
    expect(workspace.querySelectorAll(".connector-terminal-handle")).toHaveLength(2);
  });

  it("derives the Color Signal from the selected lane instead of exposing a manual palette", () => {
    render(<TimelineEditor initialData={data} />);

    expect(screen.getByText("Assigned by lane")).toBeTruthy();
    expect(screen.getByText("steel")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "graphite" })).toBeNull();

    fireEvent.change(screen.getByRole("combobox", { name: "Lane" }), { target: { value: "Product Build" } });
    expect(screen.getByText("forest")).toBeTruthy();
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

    fireEvent.click(screen.getByRole("button", { name: /Edit all Connected Work lines/ }));
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
    expect((saved as TimelineData | null)?.items.map((item) => item.colorToken)).toEqual(["steel", "forest", "forest", "forest"]);
  });

  it("straightens only the active route, preserves its selected border terminal, and persists fewer elbows", async () => {
    let saved: TimelineData | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      saved = JSON.parse(String(init?.body)) as TimelineData;
      return new Response(JSON.stringify(saved), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));
    const { container } = render(<TimelineEditor initialData={data} />);

    fireEvent.click(screen.getByRole("button", { name: /Edit all Connected Work lines/ }));
    fireEvent.click(screen.getAllByRole("button", { name: "top" })[0]);
    const midpoint = container.querySelector<SVGRectElement>(".connector-mid-handle");
    expect(midpoint).toBeTruthy();
    fireEvent.pointerDown(midpoint!, { clientX: 280, clientY: 90, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 280, clientY: 170, pointerId: 1 });
    fireEvent.pointerUp(window, { clientX: 280, clientY: 170, pointerId: 1 });
    const elbowsBefore = container.querySelectorAll(".connector-elbow-handle").length;
    expect(elbowsBefore).toBeGreaterThan(2);

    fireEvent.click(screen.getByRole("button", { name: /Straighten active line/ }));
    expect(container.querySelectorAll(".connector-elbow-handle").length).toBeLessThan(elbowsBefore);
    fireEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(saved).not.toBeNull());

    const relations = (saved as unknown as TimelineData).items[0].relations;
    expect(relations[0].connector?.source.side).toBe("top");
    expect(relations[0].connector?.points.length).toBeLessThan(elbowsBefore + 2);
    expect(relations[1].connector).toBeUndefined();
    expect(relations.map((relation) => relation.targetId)).toEqual(["target-item", "second-target-item"]);
  });

  it("edits one active route while preserving every 1:1 relationship and unrelated item", async () => {
    let saved: TimelineData | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      saved = JSON.parse(String(init?.body)) as TimelineData;
      return new Response(JSON.stringify(saved), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));
    const { container } = render(<TimelineEditor initialData={data} />);

    fireEvent.click(screen.getByRole("button", { name: /Edit all Connected Work lines/ }));
    const secondRoutePicker = Array.from(container.querySelectorAll<HTMLButtonElement>(".connector-network-picker button"))
      .find((button) => button.textContent?.includes("Second target item"));
    expect(secondRoutePicker).toBeTruthy();
    fireEvent.click(secondRoutePicker!);
    expect(container.querySelectorAll(".connector-network-route.is-active")).toHaveLength(1);
    expect(container.querySelector(".connector-board-item.is-active-target")?.textContent).toBe("Second target item");
    expect(container.querySelectorAll(".connector-terminal-handle")).toHaveLength(2);

    expect(screen.queryByRole("button", { name: /Reset active line/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Straighten active line/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    expect(screen.getByText("Custom route saved")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(saved).not.toBeNull());

    const savedData = saved as TimelineData | null;
    expect(savedData?.items[0].relations.map((relation) => relation.targetId)).toEqual(["target-item", "second-target-item"]);
    expect(savedData?.items[0].relations[0].connector).toBeUndefined();
    expect(savedData?.items[0].relations[1].connector?.points.length).toBeGreaterThanOrEqual(2);
    expect(savedData?.items[1].relations).toEqual([]);
    expect(savedData?.items[2].relations).toEqual([]);
    expect(savedData?.items[3]).toEqual({ ...data.items[3], colorToken: "forest" });
  });
});
