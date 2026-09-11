import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProjectReadingRail } from "./project-reading-rail";
import { WorkflowTrace } from "./workflow-trace";
import { ArtifactViewer } from "./artifact-viewer";
import { portfolioProjects } from "@/data/portfolio";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("updates one current section when scrolling in either direction without moving keyboard focus", () => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  let secondTop = 600;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function(this: HTMLElement) {
    return { top: this.id === "second" ? secondTop : 0 } as DOMRect;
  });
  const { container, unmount } = render(<><ProjectReadingRail sections={[{ id: "first", title: "First" }, { id: "second", title: "Second" }]} /><section id="first" /><section id="second" /></>);
  const flush = () => act(() => frames.splice(0).forEach((callback) => callback(0)));
  flush();
  const first = screen.getByRole("link", { name: /First/ });
  const second = screen.getByRole("link", { name: /Second/ });
  first.focus();
  secondTop = 80;
  fireEvent.scroll(window); flush();
  expect(second.getAttribute("aria-current")).toBe("location");
  expect(container.querySelectorAll('[aria-current="location"]')).toHaveLength(1);
  expect(document.activeElement).toBe(first);
  secondTop = 600;
  fireEvent.scroll(window); flush();
  expect(first.getAttribute("aria-current")).toBe("location");
  vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(1000 + window.innerHeight);
  fireEvent.scroll(window); flush();
  expect(second.getAttribute("aria-current")).toBe("location");
  unmount();
  expect(cancelAnimationFrame).toHaveBeenCalled();
});

it("keeps workflow content visible, introduces the trace once, and permits explicit replay", () => {
  let enter: IntersectionObserverCallback = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", class {
    constructor(callback: IntersectionObserverCallback) { enter = callback; }
    observe() {}
    disconnect = disconnect;
  });
  const block = portfolioProjects[0].sections.flatMap((section) => section.blocks).find((block) => block.type === "flow")!;
  if (block.type !== "flow") throw new Error("Expected a workflow");
  const { container } = render(<WorkflowTrace block={block} />);
  const figure = container.querySelector("figure")!;
  expect(screen.getAllByRole("listitem")).toHaveLength(block.steps.length);
  expect(figure.querySelector('[hidden], [aria-hidden="true"] li')).toBeNull();
  expect(figure.getAttribute("data-trace-run")).toBe("0");
  act(() => enter([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(figure.getAttribute("data-trace-run")).toBe("1");
  expect(disconnect).toHaveBeenCalledOnce();
  act(() => enter([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));
  expect(figure.getAttribute("data-trace-run")).toBe("1");
  fireEvent.click(screen.getByRole("button", { name: /^Replay/ }));
  expect(figure.getAttribute("data-trace-run")).toBe("2");
});

it("retains the same map image across interrupted view changes and resets magnification", () => {
  const artifact = portfolioProjects[0].artifacts[0];
  const { container } = render(<ArtifactViewer artifact={artifact} />);
  const image = container.querySelector("[data-map-camera] img") as HTMLImageElement;
  fireEvent.click(screen.getByRole("button", { name: "Creation handoff" }));
  fireEvent.click(screen.getByRole("button", { name: "Zoom in on map" }));
  fireEvent.click(screen.getByRole("button", { name: "Matching & merge" }));
  expect(container.querySelector("[data-map-camera] img")).toBe(image);
  expect(screen.getByRole("region", { name: /Matching & merge, 1 times/ })).toBeTruthy();
  const crop = artifact.details![1].crop;
  expect(parseFloat(image.style.width)).toBeCloseTo(100 / crop.width);
  expect(parseFloat(image.style.left)).toBeCloseTo(-100 * crop.x / crop.width);
  fireEvent.click(screen.getByRole("button", { name: "Overview" }));
  expect(image.style.width).toBe("100%");
  expect(image.style.left).toBe("0%");
  expect(image.alt).toBe(artifact.alt);
});

it("settles map motion before section navigation while preserving modified clicks", () => {
  render(<><ArtifactViewer artifact={portfolioProjects[0].artifacts[0]} /><a href="#destination">Next section</a><section id="destination" /></>);
  const finish = vi.fn();
  Object.defineProperty(screen.getByRole("region"), "getAnimations", { value: () => [{ playState: "running", finish }] });
  const link = screen.getByRole("link", { name: "Next section" });
  fireEvent.click(link, { ctrlKey: true });
  expect(finish).not.toHaveBeenCalled();
  fireEvent.click(link);
  expect(finish).toHaveBeenCalledOnce();
});
