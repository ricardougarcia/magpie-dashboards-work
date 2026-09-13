import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { marketplaceArtifacts as artifacts } from "@/data/marketplace";
import { MarketplaceConfluence } from "./marketplace-confluence";

const catalogs = [artifacts.ai, artifacts.appCenter, artifacts.library, artifacts.catalog];
let scrollY: number;
let openingHeight: number;
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let disconnect: ReturnType<typeof vi.fn>;
let media: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
const originalScrollIntoView = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");

function content() {
  return <MarketplaceConfluence intro={<header data-marketplace-intro><h1>EdCo Marketplace</h1><p>Product strategy and delivery</p></header>}>
    <div data-marketplace-navigation><nav aria-label="Project sections" data-marketplace-nav>
      <a href="#repositories" data-nav-section="repositories">01 <span data-catalog-destination>Catalogs</span></a>
      <a href="#investigation" data-nav-section="investigation">02 Research</a>
      <a href="#impact" data-nav-section="impact">04 Impact</a>
    </nav></div>
    <article><section id="investigation" data-marketplace-section><h2>Research</h2><a href="#impact">Continue to impact</a></section>
      <section id="impact" data-marketplace-section><h2>Impact</h2></section></article>
  </MarketplaceConfluence>;
}

function flushFrame() {
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach(callback => callback(0));
  });
}

function scrollToProgress(progress: number) {
  scrollY = progress * (window.innerHeight - 72) * (window.innerWidth < 720 ? 2.5 : 2.8);
  fireEvent.scroll(window);
  flushFrame();
}

function mockRect(element: HTMLElement, read: () => DOMRect) {
  Object.defineProperty(element, "getBoundingClientRect", { configurable: true, value: vi.fn(read) });
}

function setup() {
  const { container, unmount } = render(<div data-portfolio-view="project"><header className="masthead">Portfolio</header>{content()}</div>);
  const root = container.querySelector<HTMLElement>("[data-confluence]")!;
  return {
    root,
    opening: root.querySelector<HTMLElement>("[data-opening]")!,
    reading: root.querySelector<HTMLElement>("[data-sequence-reading]")!,
    catalogFrames: [...root.querySelectorAll<HTMLElement>("[data-catalog-frame]")],
    unmount,
  };
}

beforeEach(() => {
  scrollY = 0;
  openingHeight = 600;
  frames = new Map();
  nextFrame = 0;
  disconnect = vi.fn();
  media = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("innerWidth", 1440);
  vi.stubGlobal("innerHeight", 1000);
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect = disconnect; });
  vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollY);
  vi.spyOn(window, "scrollTo").mockImplementation(((options: ScrollToOptions | number, y?: number) => {
    scrollY = typeof options === "number" ? y ?? scrollY : options.top ?? scrollY;
    fireEvent.scroll(window);
  }) as typeof window.scrollTo);
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, writable: true, value: vi.fn() });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockImplementation(function (this: HTMLElement) {
    if (this.matches(".masthead")) return 72;
    if (this.hasAttribute("data-opening")) return openingHeight;
    if (this.hasAttribute("data-confluence-stage")) return window.innerHeight - 72;
    if (this.hasAttribute("data-sequence-runway")) return (window.innerHeight - 72) * 3.8;
    if (this.hasAttribute("data-marketplace-navigation")) return 58;
    return 6000;
  });
  vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(6000);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    let top = 72 - scrollY;
    let height = this.offsetHeight;
    let left = 40;
    let width = 1300;
    if (this.matches(".masthead")) top = 0;
    if (this.hasAttribute("data-confluence-stage")) top = 72;
    if (this.hasAttribute("data-catalog-destination")) { top = 92; left = 70; width = 48; height = 18; }
    if (this.id === "investigation") top = 130;
    if (this.id === "impact") top = 5000;
    return { top, left, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON() {} } as DOMRect;
  });
  window.history.replaceState(null, "", "/work/marketplace");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (originalScrollIntoView) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", originalScrollIntoView);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  window.history.replaceState(null, "", "/");
});

it("renders all four readable originals and native destinations before hydration", () => {
  const page = document.createElement("div");
  page.innerHTML = renderToString(content());
  expect(page.querySelector<HTMLElement>("[data-confluence]")?.dataset.choreography).toBe("false");
  const choices = page.querySelectorAll<HTMLAnchorElement>("[data-source-choice], [data-product-choice]");
  expect([...choices].map(link => link.getAttribute("href"))).toEqual(catalogs.map(artifact => artifact.src));
  choices.forEach(link => { expect(link.target).toBe("_blank"); expect(link.rel).toContain("noopener"); });
  for (const artifact of catalogs) {
    const original = page.querySelector(`#${artifact.id} [data-marketplace-image]`)!;
    expect(original.closest("[hidden], [inert], [aria-hidden='true']")).toBeNull();
    expect(original.getAttribute("href")).toBe(artifact.src);
    expect(page.querySelector(`#${artifact.id}`)?.textContent).toContain(artifact.label);
  }
});

it("holds each catalog in order before exposing Research, and reverses through the same originals", () => {
  const { root, reading, catalogFrames } = setup();
  expect(root.dataset.choreography).toBe("true");
  for (const [progress, selected] of [[.07, 0], [.29, 1], [.51, 2], [.71, 3], [.51, 2], [.29, 1], [.07, 0]] as const) {
    scrollToProgress(progress);
    expect(Number(root.dataset.selected)).toBe(selected);
    expect(reading.inert).toBe(true);
    catalogFrames.forEach((frame, index) => expect(frame.inert, catalogs[index].label).toBe(index !== selected));
    expect(root.querySelectorAll("[data-source-choice][aria-current], [data-product-choice][aria-current]")).toHaveLength(1);
  }
});

it("reveals Research navigation at handoff and removes it again when returning to the catalogs", () => {
  const { root, opening, reading } = setup();
  scrollToProgress(.71);
  expect(reading.inert).toBe(true);
  scrollToProgress(1);
  expect(opening.inert).toBe(true);
  expect(reading.inert).toBe(false);
  expect(root.querySelector('[data-nav-section="investigation"]')?.getAttribute("aria-current")).toBe("location");
  expect(root.querySelector('[data-nav-section="repositories"]')?.hasAttribute("aria-current")).toBe(false);
  scrollToProgress(.51);
  expect(opening.inert).toBe(false);
  expect(reading.inert).toBe(true);
  expect(Number(root.dataset.selected)).toBe(2);
});

it("keeps both clipped originals pointer-enabled during a wipe and exposes one keyboard original", () => {
  const { root, catalogFrames } = setup();
  // JSDOM cannot hit-test clipped regions. Browser verification must prove that
  // each visible part opens its own original; these are the DOM prerequisites.
  for (const progress of [.15, .21, .37, .43, .59, .65]) {
    scrollToProgress(progress);
    const visible = catalogFrames.filter(frame => !frame.inert);
    expect(visible).toHaveLength(2);
    const selected = Number(root.dataset.selected);
    catalogFrames.forEach((frame, index) => {
      const link = frame.querySelector<HTMLAnchorElement>("[data-marketplace-image]")!;
      expect(link.tabIndex).toBe(index === selected ? 0 : -1);
      expect(link.getAttribute("aria-hidden")).toBe(index === selected ? null : "true");
    });
  }
});

it("lets a source choice move directly to its scroll beat and then resumes the image sequence", () => {
  const { root } = setup();
  const choice = root.querySelector<HTMLAnchorElement>('[data-source-choice="2"]')!;
  fireEvent.click(choice);
  flushFrame();
  expect(window.scrollTo).toHaveBeenCalled();
  expect(Number(root.dataset.selected)).toBe(2);
  expect(choice.getAttribute("aria-current")).toBe("true");
  scrollToProgress(.71);
  expect(Number(root.dataset.selected)).toBe(3);
  expect(root.querySelector("[data-product-choice]")?.getAttribute("aria-current")).toBe("true");
});

it("lets keyboard readers bypass the held sequence and continue at the Research navigation", () => {
  const { root, reading } = setup();
  const next = root.querySelector<HTMLAnchorElement>("[data-continue-research]")!;
  fireEvent.keyDown(document, { key: "Tab" });
  act(() => next.focus());
  fireEvent.click(next);
  flushFrame();
  expect(window.location.hash).toBe("#investigation");
  expect(reading.inert).toBe(false);
  const research = root.querySelector<HTMLAnchorElement>('[data-nav-section="investigation"]')!;
  expect(research.getAttribute("aria-current")).toBe("location");
  expect(document.activeElement).toBe(research);
});

it("returns keyboard focus from Catalogs navigation to the available first source", () => {
  const { root, opening, reading } = setup();
  scrollToProgress(1);
  const catalogNav = root.querySelector<HTMLAnchorElement>('[data-nav-section="repositories"]')!;
  fireEvent.keyDown(document, { key: "Tab" });
  act(() => catalogNav.focus());
  flushFrame();
  fireEvent.click(catalogNav);
  flushFrame();
  expect(window.location.hash).toBe("#repositories");
  expect(opening.inert).toBe(false);
  expect(reading.inert).toBe(true);
  expect(Number(root.dataset.selected)).toBe(0);
  expect(document.activeElement).toBe(root.querySelector('[data-source-choice="0"]'));
});

it("keeps focused Research visible on reverse scroll until pointer interaction resumes the sequence", () => {
  const { root, opening, reading } = setup();
  scrollToProgress(1);
  const research = root.querySelector<HTMLAnchorElement>('[data-nav-section="investigation"]')!;
  fireEvent.keyDown(document, { key: "Tab" });
  act(() => research.focus());
  flushFrame();
  scrollToProgress(.29);
  expect(document.activeElement).toBe(research);
  expect(reading.inert).toBe(false);
  expect(opening.inert).toBe(true);
  expect(reading.querySelector("article")?.style.opacity).toBe("1");
  expect(research.getAttribute("aria-current")).toBe("location");
  fireEvent.pointerDown(document);
  flushFrame();
  expect(reading.inert).toBe(true);
  expect(opening.inert).toBe(false);
  expect(Number(root.dataset.selected)).toBe(1);
});

it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }])("preserves native original activation for %j", modifier => {
  const { root } = setup();
  const choice = root.querySelector<HTMLAnchorElement>('[data-source-choice="1"]')!;
  let intercepted = false;
  document.addEventListener("click", event => { intercepted = event.defaultPrevented; event.preventDefault(); }, { once: true });
  act(() => { choice.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...modifier })); });
  expect(intercepted).toBe(false);
  expect(Number(root.dataset.selected)).toBe(0);
  expect(window.scrollTo).not.toHaveBeenCalled();
});

it("holds a focused original through scroll changes and resumes after focus leaves", () => {
  const { root, opening, reading, catalogFrames } = setup();
  const link = catalogFrames[0].querySelector<HTMLAnchorElement>("[data-marketplace-image]")!;
  fireEvent.keyDown(document, { key: "Tab" });
  act(() => link.focus());
  flushFrame();
  scrollToProgress(.71);
  expect(document.activeElement).toBe(link);
  expect(Number(root.dataset.selected)).toBe(0);
  expect(catalogFrames[0].inert).toBe(false);
  expect(opening.inert).toBe(false);
  expect(link.tabIndex).toBe(0);
  scrollToProgress(1);
  expect(opening.inert).toBe(false);
  expect(reading.inert).toBe(true);
  act(() => link.blur());
  flushFrame();
  expect(Number(root.dataset.selected)).toBe(3);
  expect(reading.inert).toBe(false);
});

it("resumes scrolling after pointer interaction ends an original's keyboard hold", () => {
  const { root, catalogFrames } = setup();
  const link = catalogFrames[0].querySelector<HTMLAnchorElement>("[data-marketplace-image]")!;
  fireEvent.keyDown(document, { key: "Tab" });
  act(() => link.focus());
  scrollToProgress(.71);
  expect(Number(root.dataset.selected)).toBe(0);
  fireEvent.pointerDown(document);
  flushFrame();
  expect(Number(root.dataset.selected)).toBe(3);
});

it("does not replace an inspected original while its dialog is open", () => {
  const { root, catalogFrames } = setup();
  const dialog = catalogFrames[0].querySelector("dialog")!;
  dialog.open = true;
  scrollToProgress(.71);
  expect(Number(root.dataset.selected)).toBe(0);
  expect(catalogFrames[0].inert).toBe(false);
  dialog.open = false;
  fireEvent.scroll(window);
  flushFrame();
  expect(Number(root.dataset.selected)).toBe(3);
});

it("shows all originals and Research in reading flow when motion is reduced", () => {
  media.matches = true;
  const { root, opening, reading, catalogFrames } = setup();
  expect(root.dataset.choreography).toBe("false");
  expect(opening.inert).toBe(false);
  expect(reading.inert).toBe(false);
  catalogFrames.forEach(frame => {
    expect(frame.inert).toBe(false);
    const link = frame.querySelector<HTMLAnchorElement>("[data-marketplace-image]")!;
    expect(link.tabIndex).toBe(0);
    expect(link.hasAttribute("aria-hidden")).toBe(false);
  });
});

it.each([{ width: 1440, height: 580, content: 600 }, { width: 700, height: 500, content: 450 }, { width: 390, height: 844, content: 900 }])("uses reading flow when the usable viewport cannot fit the opening: %j", ({ width, height, content }) => {
  vi.stubGlobal("innerWidth", width);
  vi.stubGlobal("innerHeight", height);
  openingHeight = content;
  const { root, reading, catalogFrames } = setup();
  expect(root.dataset.choreography).toBe("false");
  expect(reading.inert).toBe(false);
  catalogFrames.forEach(frame => expect(frame.inert).toBe(false));
});

it("supports the compact sequence on a phone when every opening element fits", () => {
  vi.stubGlobal("innerWidth", 390);
  vi.stubGlobal("innerHeight", 844);
  const { root, reading } = setup();
  expect(root.dataset.choreography).toBe("true");
  scrollToProgress(.51);
  expect(Number(root.dataset.selected)).toBe(2);
  expect(reading.inert).toBe(true);
});

it("restores all originals when a viewport or motion preference change disables the sequence", () => {
  const { root, reading, catalogFrames } = setup();
  scrollToProgress(.71);
  expect(catalogFrames[0].inert).toBe(true);
  media.matches = true;
  act(() => media.addEventListener.mock.calls[0][1]());
  flushFrame();
  expect(root.dataset.choreography).toBe("false");
  expect(reading.inert).toBe(false);
  for (const frame of catalogFrames) {
    expect(frame.inert).toBe(false);
    const link = frame.querySelector<HTMLAnchorElement>("[data-marketplace-image]")!;
    expect(link.tabIndex).toBe(0);
    expect(link.hasAttribute("aria-hidden")).toBe(false);
  }
});

it("restores the full reading layout before positioning the selected original on a mode change", () => {
  const { root, catalogFrames } = setup();
  scrollToProgress(.51);
  const land = vi.fn(() => {
    expect(root.dataset.choreography).toBe("false");
    for (const frame of catalogFrames) {
      expect(frame.hidden).toBe(false);
      expect(frame.querySelector("figcaption")?.hidden).toBe(false);
    }
  });
  catalogFrames[2].scrollIntoView = land;
  media.matches = true;
  act(() => media.addEventListener.mock.calls[0][1]());
  flushFrame();
  expect(land).toHaveBeenCalledExactlyOnceWith({ block: "start", behavior: "instant" });
});

it("keeps the currently visible catalog when reading flow can become an animated sequence", () => {
  media.matches = true;
  const { root, reading, catalogFrames } = setup();
  scrollY = 1600;
  mockRect(reading, () => new DOMRect(40, 5000 - scrollY, 1300, 6000));
  const rects = [new DOMRect(40, -800, 1300, 600), new DOMRect(40, -200, 1300, 500), new DOMRect(40, 150, 1300, 550), new DOMRect(40, 250, 1300, 0)];
  catalogFrames.forEach((frame, index) => mockRect(frame, () => rects[index]));
  // App Center and Library both intersect the reading area. The later readable
  // original is Library; a zero-height subsequent frame is not visible content.
  media.matches = false;
  act(() => media.addEventListener.mock.calls[0][1]());
  flushFrame();
  expect(root.dataset.choreography).toBe("true");
  expect(Number(root.dataset.selected)).toBe(2);
  expect(root.querySelector('[data-source-choice="2"]')?.getAttribute("aria-current")).toBe("true");
  expect(Number(root.dataset.progress)).toBeCloseTo(.44);
});

it("keeps the word handoff destination stable after the nav remains sticky beyond stage release", () => {
  const { root } = setup();
  const stage = root.querySelector<HTMLElement>("[data-confluence-stage]")!;
  const origin = root.querySelector<HTMLElement>("[data-catalog-origin]")!;
  const navigation = root.querySelector<HTMLElement>("[data-marketplace-navigation]")!;
  const destination = root.querySelector<HTMLElement>("[data-catalog-destination]")!;
  const word = root.querySelector<HTMLElement>("[data-traveling-word]")!;
  let stageTop = 72;
  origin.style.fontSize = "48px";
  destination.style.fontSize = "11px";
  mockRect(stage, () => new DOMRect(40, stageTop, 1300, 928));
  mockRect(origin, () => new DOMRect(100, stageTop + 100, 180, 48));
  mockRect(navigation, () => new DOMRect(40, 72, 1300, 58));
  mockRect(destination, () => new DOMRect(70, 92, 48, 18));
  fireEvent.resize(window);
  scrollToProgress(.90);
  const beforeRelease = word.style.transform;
  expect(beforeRelease).toContain("translate(");
  expect(beforeRelease).not.toContain("NaN");
  scrollToProgress(1.2);
  stageTop = -600;
  fireEvent.resize(window);
  stageTop = 72;
  scrollToProgress(.90);
  expect(word.style.transform).toBe(beforeRelease);
});

it.each([.51, 1.6])("preserves the reading position when temporary measurement clamps scrolling at progress %s", progress => {
  const { root, opening, reading } = setup();
  scrollToProgress(progress);
  const savedScrollY = window.scrollY;
  const savedTravel = root.style.getPropertyValue("--travel");
  let clamps = 0;
  Object.defineProperty(opening, "offsetHeight", { configurable: true, get() {
    // A browser can clamp its current scroll position when the temporary compact
    // layout shortens the document. The viewport and final runway remain unchanged.
    if (root.dataset.layout === "measure") { scrollY = Math.min(scrollY, 1000); clamps++; }
    return openingHeight;
  } });
  fireEvent.resize(window);
  flushFrame();
  expect(clamps).toBeGreaterThan(0);
  expect(root.style.getPropertyValue("--travel")).toBe(savedTravel);
  expect(window.scrollTo).toHaveBeenCalled();
  expect(window.scrollY).toBeCloseTo(savedScrollY);
  expect(reading.inert).toBe(progress < 1);
  expect(Number(root.dataset.selected)).toBe(progress < 1 ? 2 : 3);
});

it.each(catalogs)("honors a direct link to the $label original in readable flow", artifact => {
  window.history.replaceState(null, "", `/work/marketplace#${artifact.id}`);
  const { root, catalogFrames } = setup();
  expect(root.dataset.choreography).toBe("false");
  const target = root.querySelector<HTMLElement>(`#${artifact.id}`)!;
  expect(target.inert).toBe(false);
  expect(target.hidden).toBe(false);
  expect(target.querySelector("[data-marketplace-image]")?.getAttribute("href")).toBe(artifact.src);
  catalogFrames.forEach(frame => expect(frame.inert).toBe(false));
});

it("finishes an artifact landing after the reading layout settles", () => {
  const { root } = setup();
  const target = root.querySelector<HTMLElement>(`#${artifacts.library.id}`)!;
  const scroll = vi.fn(() => expect(root.dataset.choreography).toBe("false"));
  target.scrollIntoView = scroll;
  window.history.replaceState(null, "", `/work/marketplace#${artifacts.library.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  expect(scroll).not.toHaveBeenCalled();
  flushFrame();
  flushFrame();
  expect(scroll).toHaveBeenCalled();
});

it("supersedes pending artifact landings when a newer hash arrives", () => {
  const { root } = setup();
  const library = root.querySelector<HTMLElement>(`#${artifacts.library.id}`)!;
  const appCenter = root.querySelector<HTMLElement>(`#${artifacts.appCenter.id}`)!;
  library.scrollIntoView = vi.fn();
  appCenter.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", `/work/marketplace#${artifacts.library.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  window.history.replaceState(null, "", `/work/marketplace#${artifacts.appCenter.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  flushFrame();
  expect(library.scrollIntoView).not.toHaveBeenCalled();
  expect(appCenter.scrollIntoView).toHaveBeenCalled();
});

it("drops a queued artifact landing when navigation continues to another section", () => {
  const { root } = setup();
  const library = root.querySelector<HTMLElement>(`#${artifacts.library.id}`)!;
  library.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", `/work/marketplace#${artifacts.library.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  window.history.replaceState(null, "", "/work/marketplace#impact");
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  flushFrame();
  expect(library.scrollIntoView).not.toHaveBeenCalled();
  expect(window.location.hash).toBe("#impact");
});

it("drops pending artifact landings on unmount", () => {
  const { root, unmount } = setup();
  const library = root.querySelector<HTMLElement>(`#${artifacts.library.id}`)!;
  library.scrollIntoView = vi.fn();
  window.history.replaceState(null, "", `/work/marketplace#${artifacts.library.id}`);
  fireEvent(window, new HashChangeEvent("hashchange"));
  flushFrame();
  unmount();
  flushFrame();
  expect(library.scrollIntoView).not.toHaveBeenCalled();
  expect(frames.size).toBe(0);
});

it("closes the evidence note with Escape and restores its summary focus", () => {
  const { root } = setup();
  const summary = screen.getByText("What came together");
  const note = summary.closest("details")!;
  note.open = true;
  const close = within(note).getByRole("button", { name: "Close note" });
  close.focus();
  fireEvent.keyDown(close, { key: "Escape" });
  expect(note.open).toBe(false);
  expect(document.activeElement).toBe(summary);
  expect(root.textContent).toContain("does not establish that all three catalogs were retired");
});

it("removes observers, listeners, and pending paint on unmount", () => {
  const remove = vi.spyOn(window, "removeEventListener");
  const { unmount } = setup();
  fireEvent.scroll(window);
  expect(frames.size).toBeGreaterThan(0);
  unmount();
  expect(frames.size).toBe(0);
  expect(disconnect).toHaveBeenCalled();
  expect(media.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  for (const event of ["scroll", "resize", "pageshow", "hashchange"]) expect(remove).toHaveBeenCalledWith(event, expect.any(Function));
});
