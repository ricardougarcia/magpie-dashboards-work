import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { upload } from "@vercel/blob/client";
import { TimelineEditor } from "@/components/timeline-editor";
import { reverseConnectorRoute } from "@/lib/connector-parity";
import { resolveConnectorPoints, routeFromPixelPoints } from "@/lib/orthogonal-connectors";
import { readMediaDimensions } from "@/lib/media-dimensions.client";
import type { TimelineData } from "@/lib/timeline-types";

vi.mock("@vercel/blob/client", () => ({ upload: vi.fn() }));
vi.mock("@/lib/media-dimensions.client", () => ({ readMediaDimensions: vi.fn() }));

const uploadMock = vi.mocked(upload);
const readMediaDimensionsMock = vi.mocked(readMediaDimensions);

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
  uploadMock.mockReset();
  readMediaDimensionsMock.mockReset();
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
    const routeLayer = workspace.querySelector(".connector-editor-routes");
    const firstBoardItem = workspace.querySelector(".connector-board-item");
    const controlLayer = workspace.querySelector(".connector-editor-controls");
    expect(routeLayer).toBeTruthy();
    expect(firstBoardItem).toBeTruthy();
    expect(controlLayer).toBeTruthy();
    if (!routeLayer || !firstBoardItem || !controlLayer) throw new Error("Expected split connector layers and board items");
    expect(routeLayer.compareDocumentPosition(firstBoardItem) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(firstBoardItem.compareDocumentPosition(controlLayer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(controlLayer.querySelectorAll(".connector-terminal-handle")).toHaveLength(2);
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

  it("snaps a dragged square terminal to a nearby parallel segment and saves the collapsed route", async () => {
    let saved: TimelineData | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      saved = JSON.parse(String(init?.body)) as TimelineData;
      return new Response(JSON.stringify(saved), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));
    const sourceRect = { left: 195, top: 81, width: 174, height: 27 };
    const targetRect = { left: 379, top: 161, width: 174, height: 27 };
    const snapData = structuredClone(data);
    snapData.items[0].relations[0].connector = routeFromPixelPoints({
      source: { side: "right", offset: 0.5 },
      target: { side: "top", offset: (432 - targetRect.left) / targetRect.width },
      points: [
        { x: 369, y: 94.5 },
        { x: 420, y: 94.5 },
        { x: 420, y: 100 },
        { x: 432, y: 100 },
        { x: 432, y: 140 },
        { x: 432, y: 161 },
      ],
    }, sourceRect, targetRect);
    const { container } = render(<TimelineEditor initialData={snapData} />);

    fireEvent.click(screen.getByRole("button", { name: /Edit all Connected Work lines/ }));
    expect(container.querySelectorAll(".connector-elbow-handle").length).toBeGreaterThan(1);
    const sourceTerminal = container.querySelector<SVGRectElement>(".connector-terminal-handle.is-source");
    expect(sourceTerminal).toBeTruthy();
    fireEvent.pointerDown(sourceTerminal!, { clientX: 369, clientY: 95, pointerId: 1 });
    fireEvent.pointerMove(window, { clientX: 369, clientY: 99, pointerId: 1 });
    fireEvent.pointerUp(window, { clientX: 369, clientY: 99, pointerId: 1 });

    await waitFor(() => expect(container.querySelectorAll(".connector-elbow-handle")).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(saved).not.toBeNull());

    const connector = (saved as TimelineData | null)?.items[0].relations[0].connector;
    expect(connector).toBeDefined();
    const points = resolveConnectorPoints(connector!, sourceRect, targetRect);
    expect(points).toEqual([{ x: 369, y: 100 }, { x: 432, y: 100 }, { x: 432, y: 161 }]);
  });

  it("straightens the active route while materializing every displayed default for persistence", async () => {
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
    expect(container.querySelectorAll(".connector-elbow-handle").length).toBeLessThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(saved).not.toBeNull());

    const relations = (saved as unknown as TimelineData).items[0].relations;
    expect(relations[0].connector?.points.length).toBeLessThanOrEqual(3);
    expect(relations[1].connector?.points.length).toBeGreaterThanOrEqual(2);
    expect(relations.map((relation) => relation.targetId)).toEqual(["target-item", "second-target-item"]);
  });

  it("saves one canonical route into both directions of reciprocal Connected Work", async () => {
    let saved: TimelineData | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      saved = JSON.parse(String(init?.body)) as TimelineData;
      return new Response(JSON.stringify(saved), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }));
    const reciprocalData = structuredClone(data);
    reciprocalData.items[1].relations = [{
      targetId: "source-item",
      targetName: "Source item",
      description: "Reverse connected work.",
      connector: {
        source: { side: "left", offset: 0.5 },
        target: { side: "bottom", offset: 0.4 },
        points: [{ x: 0.8, y: 0.7 }, { x: 0.3, y: 0.7 }, { x: 0.3, y: 0.2 }],
      },
    }];
    render(<TimelineEditor initialData={reciprocalData} />);

    fireEvent.click(screen.getByRole("button", { name: /Edit all Connected Work lines/ }));
    fireEvent.click(screen.getByRole("button", { name: /Straighten active line/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Done$/ }));
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(saved).not.toBeNull());

    const savedData = saved as TimelineData | null;
    const forward = savedData?.items[0].relations[0].connector;
    const reverse = savedData?.items[1].relations[0].connector;
    expect(forward).toBeDefined();
    expect(reverse).toEqual(reverseConnectorRoute(forward!));
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
    expect(screen.getAllByText("Custom route saved")).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(saved).not.toBeNull());

    const savedData = saved as TimelineData | null;
    expect(savedData?.items[0].relations.map((relation) => relation.targetId)).toEqual(["target-item", "second-target-item"]);
    expect(savedData?.items[0].relations[0].connector?.points.length).toBeGreaterThanOrEqual(2);
    expect(savedData?.items[0].relations[1].connector?.points.length).toBeGreaterThanOrEqual(2);
    expect(savedData?.items[1].relations).toEqual([]);
    expect(savedData?.items[2].relations).toEqual([]);
    expect(savedData?.items[3]).toEqual({ ...data.items[3], colorToken: "forest" });
  });
});


describe("TimelineEditor direct media uploads", () => {
  it("uploads a file above the former Function limit directly to Blob and reports progress", async () => {
    let finishUpload: (() => void) | null = null;
    const result = {
      url: "https://example.public.blob.vercel-storage.com/demo.mp4",
      downloadUrl: "https://example.public.blob.vercel-storage.com/demo.mp4?download=1",
      pathname: "magpie/media/source-item/demo.mp4-random",
      contentType: "video/mp4",
      contentDisposition: "inline",
    } as Awaited<ReturnType<typeof upload>>;
    uploadMock.mockImplementation(async () => {
      await new Promise<void>((resolve) => { finishUpload = resolve; });
      return result;
    });
    readMediaDimensionsMock.mockResolvedValue({ width: 1280, height: 720 });

    const { container } = render(<TimelineEditor initialData={data} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    const file = new File(["video"], "Demo Clip.MP4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: 6_300_000 });
    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => expect(uploadMock).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByText("Uploading 0%")).toBeTruthy());
    expect(uploadMock.mock.calls[0][2].onUploadProgress).toBeTypeOf("function");
    act(() => uploadMock.mock.calls[0][2].onUploadProgress?.({ loaded: 2_330_000, total: 6_300_000, percentage: 37 }));
    await waitFor(() => expect(screen.getByRole("progressbar", { name: "Media upload progress" }).getAttribute("aria-valuenow")).toBe("37"));
    expect(screen.getByText("Uploading 37%")).toBeTruthy();
    expect(uploadMock.mock.calls[0][0]).toBe("magpie/media/source-item/demo-clip.mp4");
    expect(uploadMock.mock.calls[0][2]).toMatchObject({
      access: "public",
      handleUploadUrl: "/api/media",
      contentType: "video/mp4",
      clientPayload: JSON.stringify({ itemId: "source-item", filename: "Demo Clip.MP4" }),
    });

    finishUpload!();
    await waitFor(() => expect(screen.getByText(/Upload complete/)).toBeTruthy());
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("captures GIF dimensions, warns about low resolution, and persists the metadata on save", async () => {
    let saved: TimelineData | null = null;
    vi.stubGlobal("fetch", vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      saved = JSON.parse(String(init?.body)) as TimelineData;
      return new Response(JSON.stringify(saved), { status: 200, headers: { "Content-Type": "application/json" } });
    }));
    uploadMock.mockResolvedValue({
      url: "https://example.public.blob.vercel-storage.com/tiny.gif",
      downloadUrl: "https://example.public.blob.vercel-storage.com/tiny.gif?download=1",
      pathname: "magpie/media/source-item/tiny.gif-random",
      contentType: "image/gif",
      contentDisposition: "inline",
    } as Awaited<ReturnType<typeof upload>>);
    readMediaDimensionsMock.mockResolvedValue({ width: 170, height: 136 });

    const { container } = render(<TimelineEditor initialData={data} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input!, { target: { files: [new File(["gif"], "tiny.gif", { type: "image/gif" })] } });

    await waitFor(() => expect(screen.getByText(/This animation is 170×136/)).toBeTruthy());
    expect(container.querySelector(".media-editor-preview img.media-no-upscale")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Save changes/ }));
    await waitFor(() => expect(saved).not.toBeNull());

    expect((saved as TimelineData | null)?.items[0].media).toEqual({
      url: "https://example.public.blob.vercel-storage.com/tiny.gif",
      type: "gif",
      alt: "Source item",
      width: 170,
      height: 136,
    });
  });

  it("rejects files above 25 MB before requesting an upload token", async () => {
    const { container } = render(<TimelineEditor initialData={data} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    const file = new File(["video"], "too-large.mp4", { type: "video/mp4" });
    Object.defineProperty(file, "size", { value: 25 * 1024 * 1024 + 1 });
    fireEvent.change(input!, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText("Media must be 25 MB or smaller.")).toBeTruthy());
    expect(uploadMock).not.toHaveBeenCalled();
    expect(readMediaDimensionsMock).not.toHaveBeenCalled();
  });
});
