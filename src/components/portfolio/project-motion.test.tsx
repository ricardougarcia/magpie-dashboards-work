import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProjectReadingRail } from "./project-reading-rail";
import { WorkflowTrace } from "./workflow-trace";
import { ArtifactViewer } from "./artifact-viewer";
import { portfolioProjects } from "@/data/portfolio";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
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

it("connects decisions to their actual workflow steps and preserves keyboard focus over hover", async () => {
  const { ProjectSurface } = await import("./project-surface");
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerType = init.pointerType ?? "mouse"; }
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, bottom: 50, width: 150, height: 50 } as DOMRect);
  const { container } = render(<ProjectSurface id="solution" kind="solution" className="" enabled>
    <div id="new-create" data-flow-step="new-create">Create locally</div><div id="new-match" data-flow-step="new-match">Match and merge</div>
    <div id="local-creation" data-decision-step="new-create"><a data-related-step="new-create" href="#new-create">Local creation</a><p>Creation description</p></div>
    <div id="global-matching" data-decision-step="new-match"><a data-related-step="new-match" href="#new-match">Global matching</a><p>Matching description</p></div>
  </ProjectSurface>);
  const section = container.querySelector("section")!;
  const local = screen.getByRole("link", { name: "Local creation" });
  const global = screen.getByRole("link", { name: "Global matching" });
  fireEvent.pointerOver(local, { pointerType: "touch" });
  expect(section.querySelector("svg")).toBeNull();
  fireEvent.pointerOver(local, { pointerType: "mouse" });
  expect(section.getAttribute("data-related-step")).toBe("new-create");
  expect(section.querySelector("svg path")).not.toBeNull();
  fireEvent.focusIn(global);
  fireEvent.pointerOut(local, { relatedTarget: document.body });
  expect(section.getAttribute("data-related-step")).toBe("new-match");
  fireEvent.focusOut(global, { relatedTarget: document.body });
  expect(section.querySelector("svg")).toBeNull();
  fireEvent.pointerOver(screen.getByText("Matching description"), { pointerType: "mouse" });
  expect(section.getAttribute("data-related-step")).toBe("new-match");
  fireEvent.pointerOut(screen.getByText("Matching description"), { relatedTarget: section });
  expect(section.querySelector("svg")).toBeNull();
});

it("previews map views on hover, retains the clicked selection, and ignores touch hover cleanup", () => {
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerType = init.pointerType ?? "mouse"; }
  });
  const { container } = render(<ArtifactViewer artifact={portfolioProjects[0].artifacts[0]} />);
  const viewer = container.querySelector<HTMLElement>("[data-artifact-viewer]")!;
  const tabs = screen.getByRole("group", { name: "Workflow map views" });
  const creation = screen.getByRole("button", { name: "Creation handoff" });
  const matching = screen.getByRole("button", { name: "Matching & merge" });
  fireEvent.pointerEnter(creation, { pointerType: "mouse" });
  expect(viewer.dataset.mapView).toBe("creation-handoff");
  expect(viewer.dataset.pinnedView).toBe("overview");
  fireEvent.pointerLeave(tabs, { pointerType: "mouse" });
  expect(viewer.dataset.mapView).toBe("overview");
  fireEvent.click(matching);
  fireEvent.pointerEnter(creation, { pointerType: "mouse" });
  expect(viewer.dataset.mapView).toBe("creation-handoff");
  fireEvent.pointerLeave(tabs, { pointerType: "mouse" });
  expect(viewer.dataset.mapView).toBe("matching-handoff");
  fireEvent.pointerEnter(creation, { pointerType: "touch" });
  expect(viewer.dataset.mapView).toBe("matching-handoff");
  fireEvent.click(creation);
  fireEvent.pointerLeave(tabs, { pointerType: "touch" });
  expect(viewer.dataset.mapView).toBe("creation-handoff");
  expect(creation.getAttribute("aria-pressed")).toBe("true");
});

it("keeps section shells and focus stable while the mini-map follows scrolling, and disables parallax under reduced motion", async () => {
  const { ProjectPageMotion } = await import("./project-page-motion");
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.push(callback); return frames.length; });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  const preference = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => preference);
  let scroll = 0;
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => scroll);
  vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);
  vi.spyOn(document.documentElement, "scrollHeight", "get").mockReturnValue(3000);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function(this: HTMLElement) {
    return { top: (this.id === "second" ? 900 : 100) - scroll, bottom: 400, height: 800 } as DOMRect;
  });
  const { container } = render(<main><ProjectPageMotion sections={[{ id: "first", title: "First" }, { id: "second", title: "Second" }]} /><nav aria-label="Project sections"><a href="#first">First</a></nav><section id="first"><div data-section-content>First section</div></section><section id="second"><div data-section-content>Second section</div></section></main>);
  const marker = container.querySelector("[data-page-window]")!;
  const initial = Number(marker.getAttribute("y"));
  const shell = container.querySelector<HTMLElement>("#first")!;
  const content = shell.firstElementChild as HTMLElement;
  screen.getByRole("link").focus();
  scroll = 600; fireEvent.scroll(window); act(() => frames.splice(0).forEach((callback) => callback(0)));
  expect(Number(marker.getAttribute("y"))).toBeGreaterThan(initial);
  expect(parseFloat(content.style.getPropertyValue("--section-shift"))).toBeGreaterThan(0);
  expect(shell.style.transform).toBe("");
  expect(document.activeElement).toBe(screen.getByRole("link"));
  fireEvent.click(screen.getByRole("link"), { ctrlKey: true });
  expect(parseFloat(content.style.getPropertyValue("--section-shift"))).toBeGreaterThan(0);
  fireEvent.click(screen.getByRole("link"));
  expect(content.style.getPropertyValue("--section-shift")).toBe("0px");
  preference.matches = true;
  act(() => preference.addEventListener.mock.calls[0][1]());
  act(() => frames.splice(0).forEach((callback) => callback(0)));
  expect(content.style.getPropertyValue("--section-shift")).toBe("0px");
  expect(content.style.getPropertyValue("--section-opacity")).toBe("1");
});
