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
      guidingLights: ["Learn", "Stabilize"],
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
      guidingLights: ["Fix", "Stabilize"],
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
      guidingLights: ["Grow"],
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
});

function getTimelineItem(name: string) {
  return screen.getByRole("button", { name: new RegExp(`^${name},`) });
}

describe("PublicTimeline presentation safeguards", () => {
  it("renders the simplified copy and role without public Color Signal keys or native Gantt tooltips", () => {
    const { container } = render(<PublicTimeline data={data} />);

    expect(screen.queryByText("Hover to scan. Select a bar to pin its record and trace every connected work item.")).toBeNull();
    expect(screen.getByText("Planned")).toBeTruthy();
    expect(screen.queryByText("Planned. Not yet placed.")).toBeNull();

    expect(screen.getByText("Principal Product Manager")).toBeTruthy();
    expect(screen.queryByText("Sole principal PM")).toBeNull();
    expect(screen.queryByLabelText("Color key")).toBeNull();
    ["Discovery-led", "Corrective", "Reliability", "Governance", "Growth"].forEach((label) => {
      expect(screen.queryByText(label)).toBeNull();
    });
    container.querySelectorAll("[data-timeline-item]").forEach((item) => {
      expect(item.hasAttribute("title")).toBe(false);
    });
  });

  it("shows stacked coordinates globally while restricting viewport guides to the Gantt", async () => {
    const { container } = render(<PublicTimeline data={data} />);
    const gantt = container.querySelector<HTMLElement>("[data-gantt-region]");
    const guides = container.querySelector<HTMLElement>(".cursor-guides");
    const readout = container.querySelector<HTMLElement>(".coordinate-cursor");
    expect(gantt).toBeTruthy();
    expect(guides).toBeTruthy();
    expect(readout).toBeTruthy();

    fireEvent.pointerMove(gantt!, { clientX: 229, clientY: 147 });
    await waitFor(() => expect(guides!.classList.contains("is-visible")).toBe(true));
    expect(readout!.classList.contains("is-visible")).toBe(true);
    expect(readout!.style.left).toBe("229px");
    expect(readout!.style.top).toBe("147px");
    expect(readout!.classList.contains("is-right-of-cursor")).toBe(false);
    expect(readout!.textContent).toContain("X:229PX");
    expect(readout!.textContent).toContain("Y:147PX");

    fireEvent.pointerMove(document.body, { clientX: 31, clientY: 44 });
    await waitFor(() => expect(guides!.classList.contains("is-visible")).toBe(false));
    expect(readout!.classList.contains("is-visible")).toBe(true);
    expect(readout!.style.left).toBe("31px");
    expect(readout!.style.top).toBe("44px");
    expect(readout!.classList.contains("is-right-of-cursor")).toBe(true);
    expect(readout!.textContent).toContain("X:31PX");
    expect(readout!.textContent).toContain("Y:44PX");
  });

  it("contains horizontal movement in the Gantt and synchronizes the accessible technical rail and veil", async () => {
    const { container } = render(<PublicTimeline data={data} />);
    const scroller = container.querySelector<HTMLElement>("#portfolio-timeline-scroll")!;
    const shell = container.querySelector<HTMLElement>(".timeline-scroll-shell")!;
    const slider = screen.getByRole("slider", { name: "Scroll the timeline horizontally" }) as HTMLInputElement;

    Object.defineProperties(scroller, {
      scrollWidth: { configurable: true, value: 1200 },
      clientWidth: { configurable: true, value: 600 },
      scrollLeft: { configurable: true, value: 0, writable: true },
    });
    fireEvent.scroll(scroller);

    await waitFor(() => expect(shell.dataset.scrollable).toBe("true"));
    expect(slider.disabled).toBe(false);
    expect(slider.getAttribute("aria-controls")).toBe("portfolio-timeline-scroll");
    expect(slider.value).toBe("0");
    expect(shell.dataset.scrolled).toBe("false");

    scroller.scrollLeft = 300;
    fireEvent.scroll(scroller);
    await waitFor(() => expect(slider.value).toBe("500"));
    expect(slider.getAttribute("aria-valuetext")).toBe("50 percent");
    expect(screen.getByText("50%")).toBeTruthy();
    expect(shell.dataset.scrolled).toBe("true");

    fireEvent.change(slider, { target: { value: "1000" } });
    expect(scroller.scrollLeft).toBe(600);
  });

  it("replaces the Phase row with five evenly ordered Guiding Light controls", () => {
    render(<PublicTimeline data={data} />);
    const group = screen.getByRole("group", { name: "Focus timeline by Guiding Light" });
    const labels = Array.from(group.querySelectorAll("button")).map((button) => button.textContent?.replace(/\[\d+\]/, ""));

    expect(group.querySelectorAll("canvas.guiding-light-ink-canvas")).toHaveLength(1);
    expect(group.querySelector("canvas.guiding-light-ink-canvas")?.getAttribute("aria-hidden")).toBe("true");
    expect(group.querySelectorAll("button.guiding-light-cell")).toHaveLength(5);
    expect(group.querySelectorAll(".guiding-light-name")).toHaveLength(5);
    expect(labels).toEqual(["Learn", "Fix", "Stabilize", "Govern", "Grow"]);
    expect(screen.queryByText("Phase")).toBeNull();
    expect(screen.queryByText("Learn fast, stabilize faster")).toBeNull();
    expect(screen.getByText("Q4 / PLANNED")).toBeTruthy();
  });

  it("focuses every multi-value match without opening a modal or Connected Work lines", async () => {
    const { container } = render(<PublicTimeline data={data} />);
    const stabilize = screen.getByRole("button", { name: /Stabilize/ });
    fireEvent.click(stabilize);

    await waitFor(() => expect(container.querySelectorAll(".guiding-light-tether-layer path")).toHaveLength(2));
    expect(stabilize.getAttribute("aria-pressed")).toBe("true");
    expect(getTimelineItem("First item").classList.contains("is-guiding-match")).toBe(true);
    expect(getTimelineItem("Second item").classList.contains("is-guiding-match")).toBe(true);
    expect(getTimelineItem("Planned item").classList.contains("is-muted")).toBe(true);
    expect(container.querySelectorAll(".connection-layer path")).toHaveLength(0);
    expect(screen.queryByLabelText(/Selected details for/)).toBeNull();

    fireEvent.pointerEnter(getTimelineItem("First item"), { pointerType: "mouse" });
    expect(screen.queryByLabelText(/Preview for/)).toBeNull();
  });

  it("focuses matching planned work and dismisses Guiding Light focus outside the chosen cell", async () => {
    const { container } = render(<PublicTimeline data={data} />);
    const grow = screen.getByRole("button", { name: /Grow/ });
    fireEvent.click(grow);

    await waitFor(() => expect(getTimelineItem("Planned item").classList.contains("is-guiding-match")).toBe(true));
    expect(getTimelineItem("First item").classList.contains("is-muted")).toBe(true);
    expect(container.querySelectorAll(".guiding-light-tether-layer path")).toHaveLength(1);

    fireEvent.pointerDown(screen.getByRole("heading", { name: "The work, in motion" }), { pointerType: "mouse" });
    await waitFor(() => expect(grow.getAttribute("aria-pressed")).toBe("false"));
    expect(getTimelineItem("Planned item").classList.contains("is-guiding-match")).toBe(false);
    expect(container.querySelectorAll(".guiding-light-tether-layer path")).toHaveLength(0);
  });

  it("clears Guiding Light focus on Escape and when an item is selected", async () => {
    const { container } = render(<PublicTimeline data={data} />);
    const learn = screen.getByRole("button", { name: /Learn/ });
    fireEvent.click(learn);
    fireEvent.keyDown(window, { key: "Escape" });
    await waitFor(() => expect(learn.getAttribute("aria-pressed")).toBe("false"));

    fireEvent.click(learn);
    fireEvent.click(getTimelineItem("First item"));
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());
    expect(learn.getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelectorAll(".guiding-light-tether-layer path")).toHaveLength(0);
    expect(container.querySelectorAll(".connection-layer path")).toHaveLength(1);
  });

  it("uses varied per-pixel timing while preserving the overall left-to-right acquisition", () => {
    const { container } = render(<PublicTimeline data={data} />);
    const pixels = Array.from(container.querySelectorAll<HTMLElement>(".lane-row .lane-pixel-field span")).slice(0, 256);
    const delayAt = (index: number) => Number.parseFloat(pixels[index].style.getPropertyValue("--pixel-in"));
    const durationAt = (index: number) => Number.parseFloat(pixels[index].style.getPropertyValue("--pixel-in-duration"));
    const averageColumnDelay = (column: number) => {
      const values = Array.from({ length: 16 }, (_, row) => delayAt(row * 16 + column));
      return values.reduce((sum, value) => sum + value, 0) / values.length;
    };

    expect(pixels).toHaveLength(256);
    expect(new Set(pixels.map((_, index) => delayAt(index))).size).toBeGreaterThan(180);
    expect(new Set(pixels.map((_, index) => durationAt(index))).size).toBeGreaterThan(120);
    expect(averageColumnDelay(15) - averageColumnDelay(0)).toBeGreaterThan(450);
  });
});

describe("PublicTimeline telemetry ownership", () => {
  it("omits the Artifact field entirely when the selected item has no media", async () => {
    render(<PublicTimeline data={data} />);
    fireEvent.click(getTimelineItem("First item"));
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());

    expect(screen.queryByRole("button", { name: "Open media preview" })).toBeNull();
    expect(screen.queryByText("Artifact")).toBeNull();
    expect(screen.queryByText("Media pending")).toBeNull();
  });

  it("retains the Artifact preview control when the selected item has media", async () => {
    const mediaData: PublicTimelineData = {
      ...data,
      items: data.items.map((item) => item.id === "first-item"
        ? { ...item, media: { url: "/icon.svg", type: "gif", alt: "First item artifact", width: 170, height: 136 } }
        : item),
    };
    const { container } = render(<PublicTimeline data={mediaData} />);
    fireEvent.click(getTimelineItem("First item"));
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());

    expect(screen.getByRole("button", { name: "Open media preview" })).toBeTruthy();
    expect(screen.getByText("Artifact")).toBeTruthy();
    expect(screen.getByText("First item artifact")).toBeTruthy();
    expect(container.querySelector(".telemetry-media-thumb img.media-no-upscale")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Open media preview" }));
    await waitFor(() => expect(container.querySelector(".preview-content img.media-no-upscale")).toBeTruthy());
    expect(screen.queryByText("Media pending")).toBeNull();
  });

  it("keeps only the purposeful top-left and bottom-right aperture corners", async () => {
    const { container } = render(<PublicTimeline data={data} />);
    fireEvent.click(getTimelineItem("First item"));
    await waitFor(() => expect(screen.getByLabelText("Selected details for First item")).toBeTruthy());

    expect(container.querySelector(".corner-nw")).toBeTruthy();
    expect(container.querySelector(".corner-se")).toBeTruthy();
    expect(container.querySelector(".corner-ne")).toBeNull();
    expect(container.querySelector(".corner-sw")).toBeNull();
  });

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

  it("terminates legacy Connected Work lines exactly on fractional item borders", async () => {
    const { container } = render(<PublicTimeline data={data} />);
    const canvas = container.querySelector<HTMLElement>(".timeline-canvas")!;
    const first = getTimelineItem("First item");
    const second = getTimelineItem("Second item");
    const canvasRect = { left: 100, top: 200, width: 1000, height: 600 };
    const sourceRect = { left: 200.25, top: 300.5, width: 220.75, height: 31.25 };
    const targetRect = { left: 500.5, top: 420.25, width: 180.5, height: 32.5 };
    const asDomRect = (rect: { left: number; top: number; width: number; height: number }) => ({
      ...rect,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect,
    } as DOMRect);
    vi.spyOn(canvas, "getBoundingClientRect").mockImplementation(() => asDomRect(canvasRect));
    vi.spyOn(first, "getBoundingClientRect").mockImplementation(() => asDomRect(sourceRect));
    vi.spyOn(second, "getBoundingClientRect").mockImplementation(() => asDomRect(targetRect));

    fireEvent.click(first);
    fireEvent(window, new Event("resize"));

    const connection = await waitFor(() => {
      const path = container.querySelector<SVGPathElement>(".connection-layer path");
      expect(path?.getAttribute("d")).toBeTruthy();
      return path!;
    });
    expect(connection.getAttribute("d")).toBe("M 321 116.125 H 360 V 236.5 H 400.5");
  });

  it("reanchors the tether to the live modal border after its position changes", async () => {
    const { container } = render(<PublicTimeline data={data} />);
    const first = getTimelineItem("First item");
    const sourceRect = { left: 120, top: 420, width: 220, height: 36 };
    let modalRect = { left: 930, top: 76, width: 340, height: 390 };
    vi.spyOn(first, "getBoundingClientRect").mockImplementation(() => ({
      ...sourceRect,
      right: sourceRect.left + sourceRect.width,
      bottom: sourceRect.top + sourceRect.height,
      x: sourceRect.left,
      y: sourceRect.top,
      toJSON: () => sourceRect,
    } as DOMRect));

    fireEvent.click(first);
    const modal = await screen.findByLabelText("Selected details for First item");
    vi.spyOn(modal, "getBoundingClientRect").mockImplementation(() => ({
      ...modalRect,
      right: modalRect.left + modalRect.width,
      bottom: modalRect.top + modalRect.height,
      x: modalRect.left,
      y: modalRect.top,
      toJSON: () => modalRect,
    } as DOMRect));
    fireEvent(window, new Event("resize"));

    const tether = await waitFor(() => {
      const path = container.querySelector<SVGPathElement>(".telemetry-tether path");
      expect(path?.getAttribute("d")).toBeTruthy();
      return path!;
    });
    const firstPath = tether.getAttribute("d");
    expect(firstPath).toMatch(/H 930$/);

    modalRect = { left: 14, top: 510, width: 740, height: 290 };
    fireEvent(window, new Event("resize"));
    await waitFor(() => expect(tether.getAttribute("d")).not.toBe(firstPath));
    const movedPath = tether.getAttribute("d");
    expect(movedPath).toMatch(/V 510$/);
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
