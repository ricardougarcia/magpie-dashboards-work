import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { MagpieBoardCluster } from "./board-clusters";
import { boardEntries } from "@/data/board";
import { resolve } from "node:path";
import { PortfolioBoard } from "./portfolio-board";
import { ProjectPage } from "./project-page";
import { ArtifactViewer } from "./artifact-viewer";
import { RegionInspection } from "./region-inspection";
import { PortfolioLink } from "./portfolio-link";
import { BOARD_POSITION, boardRestorationScript } from "@/lib/portfolio-navigation";
import { portfolioProjects } from "@/data/portfolio";
import { PROJECT_SECTION_TITLES } from "@/lib/portfolio-types";
import WorkProjectPage, { generateMetadata, generateStaticParams } from "@/app/work/[slug]/page";

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
});
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("Board and Project foundation", () => {
  const project = portfolioProjects[0];

  it("links every Board entry to a generated, directly addressable Project", async () => {
    render(<PortfolioBoard projects={portfolioProjects} />);
    for (const entry of portfolioProjects) {
      expect(screen.getByRole("link", { name: entry.title }).getAttribute("href")).toBe(`/work/${entry.slug}`);
      expect(generateStaticParams()).toContainEqual({ slug: entry.slug });
      expect(await WorkProjectPage({ params: Promise.resolve({ slug: entry.slug }) })).toBeTruthy();
    }
  });

  it("server-renders the timeline source titles without losing their text", () => {
    const markup = document.createElement("div");
    markup.innerHTML = renderToString(<MagpieBoardCluster entry={boardEntries[0]} />);
    const titles = [...markup.querySelectorAll("svg title")];
    expect(titles).toHaveLength(15);
    expect(titles[0].textContent).toBe("Infra: New Data Lake Layers Marts, Analytics, Staging, Prod / Jan - Mar");
    expect(titles.every((title) => title.textContent!.length > 0)).toBe(true);
  });

  it("keeps authored Board order, honest placeholders, and finished project destinations", () => {
    const { container } = render(<PortfolioBoard projects={portfolioProjects} />);
    const entries = [...container.querySelectorAll<HTMLElement>("[data-board-number]")];
    expect(entries.map((entry) => [entry.dataset.boardNumber, entry.id])).toEqual([
      ["01", "region-magpie"], ["02", "region-marketplace"], ["03", "region-gcm"],
      ["04", "region-lti"], ["05", "region-partner-portal"], ["06", "region-learnplatform-ccp"],
    ]);
    const reserved = entries.filter((entry) => entry.dataset.boardState === "reserved");
    expect(reserved).toHaveLength(4);
    reserved.forEach((entry) => {
      expect(within(entry).getByText("Wireframe placeholder")).toBeTruthy();
      expect(entry.querySelector("a, button")).toBeNull();
    });
    expect(screen.getByRole("link", { name: "Magpie" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: project.title }).getAttribute("href")).toBe("/work/ccp");
    expect(project.number).toBe("01");
    for (const link of within(screen.getByRole("navigation", { name: "Work on the Board" })).getAllByRole("link")) {
      expect(container.querySelector(link.getAttribute("href")!)).toBeTruthy();
    }
  });

  it("keeps concise specifications and correct A/B source references", () => {
    const { container } = render(<PortfolioBoard projects={portfolioProjects} />);
    expect(screen.queryByText(/delivery decisions/i)).toBeNull();
    const specifications = screen.getByLabelText(`${project.title} specifications`);
    expect(within(specifications).getByText(project.role)).toBeTruthy();
    expect(within(specifications).getByText(project.duration)).toBeTruthy();
    const entry = screen.getByRole("link", { name: /Begin with Magpie/i });
    expect(container.querySelector(entry.getAttribute("href")!)).toBeTruthy();
    expect(screen.getByText("B.01 / What to notice")).toBeTruthy();
    expect(screen.getByText(project.region!.mapInsight)).toBeTruthy();
    expect(container.querySelector("#region-learnplatform-ccp")?.getAttribute("data-region-code")).toBe("CCP");
    expect(screen.queryByLabelText("Board sheet record")).toBeNull();
    const group = container.querySelector("[data-evidence-active]")!;
    expect([...group.querySelectorAll<HTMLElement>("[data-artifact]")].map((item) => item.dataset.artifact)).toEqual(["A", "B", "C"]);
    expect(group.querySelector("[data-board-notes]")).toBeNull();
    expect(group.nextElementSibling?.hasAttribute("data-board-notes")).toBe(true);
  });

  it("replaces the masthead and section 00 with the sheet beginning at its coordinates", () => {
    const { container } = render(<PortfolioBoard projects={portfolioProjects} />);
    const outgoing = container.querySelector(".panel-outgoing [data-panel-content]")!;
    const incoming = container.querySelector(".panel-incoming-sheet")!;
    expect(within(outgoing as HTMLElement).getByRole("heading", { name: "The Board." })).toBeTruthy();
    expect(within(outgoing as HTMLElement).getByRole("link", { name: "Rico Garcia — Board" })).toBeTruthy();
    expect(outgoing.querySelector("[data-board-sheet]")).toBeNull();
    expect(incoming.querySelector("[data-board-sheet]")?.children[1]?.textContent).toContain("Sheet coordinates");
    expect(container.querySelectorAll(".panel-replacement")).toHaveLength(1);
  });

  it("keeps six sections visible, the investigation available on demand, and every anchor valid", () => {
    const { container } = render(<ProjectPage project={project} />);
    for (const title of Object.values(PROJECT_SECTION_TITLES)) {
      expect(screen.getByRole("heading", { level: 2, name: new RegExp(title) })).toBeTruthy();
    }
    const summary = screen.getByText("Read more about the investigation");
    const details = summary.closest("details")!;
    expect(details.open).toBe(false);
    expect(within(details).getByText(/2.5 years of request data/)).toBeTruthy();
    for (const link of container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(container.querySelector(`[id="${link.hash.slice(1)}"]`), link.hash).not.toBeNull();
    }
    const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(screen.getByRole("link", { name: "Return to the Board" }).getAttribute("href")).toBe("/drawer");
  });

  it("preserves every section headline, description, metric, workflow label, and decision", () => {
    const { container } = render(<ProjectPage project={project} />);
    for (const section of project.sections) {
      const content = container.querySelector(`[id="${section.id}"]`)!.textContent!;
      expect(content).toContain(section.headline);
      expect(content).toContain(section.summary);
      for (const block of section.blocks) {
        if (block.type === "text") block.paragraphs.forEach((text) => expect(content).toContain(text));
        if (block.type === "flow") block.steps.forEach((step) => { expect(content).toContain(step.label); if (step.note) expect(content).toContain(step.note); });
        if (block.type === "metrics") block.items.forEach((item) => { expect(content).toContain(item.value); expect(content).toContain(item.label); if (item.note) expect(content).toContain(item.note); });
        if (block.type === "details" || block.type === "decisions") block.items.forEach((item) => { expect(content).toContain(item.title); expect(content).toContain(item.body); });
      }
    }
    expect(screen.getByRole("link", { name: "Local creation" }).getAttribute("href")).toBe("#new-create");
    expect(screen.getByRole("link", { name: "Global matching" }).getAttribute("href")).toBe("#new-match");
    expect(screen.getByRole("link", { name: "Investigate across roles" }).getAttribute("href")).toBe("#approach");
  });

  it("supports a shorter Project without empty sections or dead navigation entries", () => {
    const shorter = { ...project, sections: project.sections.filter((section) => ["context", "solution"].includes(section.kind)) };
    const { container } = render(<ProjectPage project={shorter} />);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(2);
    const nav = screen.getByRole("navigation", { name: "Project sections" });
    expect(within(nav).queryByRole("link", { name: /Impact/ })).toBeNull();
    expect(within(nav).queryByRole("link", { name: /Approach and decisions/ })).toBeNull();
    expect(screen.getByRole("link", { name: /Explore the Project/ }).getAttribute("href")).toBe("#context");
    for (const link of container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(container.querySelector(`[id="${link.hash.slice(1)}"]`), link.hash).not.toBeNull();
    }
    expect(screen.getByRole("link", { name: /Open full-size workflow map/ }).getAttribute("href")).toBe(project.artifacts[0].src);
  });

  it("serves full-size Artifacts locally with descriptive links and valid PNG dimensions", () => {
    render(<ProjectPage project={project} />);
    for (const artifact of project.artifacts) {
      const link = screen.getByRole("link", { name: `Open full-size ${artifact.label.toLowerCase()} in a new tab` });
      expect(link.getAttribute("href")).toBe(artifact.src);
      expect(link.getAttribute("target")).toBe("_blank");
      const bytes = readFileSync(resolve(process.cwd(), `public${artifact.src}`));
      expect(bytes.subarray(1, 4).toString()).toBe("PNG");
      expect(bytes.readUInt32BE(16)).toBe(artifact.width);
      expect(bytes.readUInt32BE(20)).toBe(artifact.height);
    }
  });

  it("returns not-found for unknown Projects and gives CCP its own preview metadata", async () => {
    const props = { params: Promise.resolve({ slug: "missing-project" }) };
    await expect(WorkProjectPage(props)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(generateMetadata(props)).rejects.toThrow("NEXT_NOT_FOUND");
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "ccp" }) });
    expect(metadata.title).toBe("Customer-Created Products | Rico Garcia");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("keeps unreconciled contractor-hour and phase-count claims out of the published content", () => {
    expect(JSON.stringify(portfolioProjects)).not.toMatch(/660|330|3 phases/i);
  });

  it("lets touch users open and close an inspection without moving its target", () => {
    render(<RegionInspection label="the handoff" summary="Creation workflow" insight="Creation and approval are separate."><span>Artifact</span></RegionInspection>);
    const button = screen.getByRole("button", { name: /Inspect/ });
    const panel = document.getElementById(button.getAttribute("aria-controls")!)!;
    expect(panel.getAttribute("aria-hidden")).toBe("true");
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(panel.getAttribute("aria-hidden")).toBe("false");
    fireEvent.click(button);
    expect(panel.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("Creation workflow")).toBeTruthy();
  });

  it("opens on mouse hover, ignores touch hover, and dismisses with Escape", () => {
    vi.useFakeTimers();
    vi.stubGlobal("PointerEvent", class extends MouseEvent {
      pointerType: string;
      constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerType = init.pointerType ?? "mouse"; }
    });
    const { container } = render(<RegionInspection label="a detail" summary="Overview" insight="Evidence"><span>Artifact</span></RegionInspection>);
    const root = container.firstElementChild!;
    const button = screen.getByRole("button");
    fireEvent.pointerEnter(root, { pointerType: "mouse" });
    act(() => { vi.advanceTimersByTime(80); });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    fireEvent.pointerLeave(root, { pointerType: "mouse" });
    act(() => { vi.advanceTimersByTime(200); });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.pointerEnter(root, { pointerType: "touch" });
    act(() => { vi.advanceTimersByTime(200); });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.pointerEnter(root, { pointerType: "mouse" });
    act(() => { vi.advanceTimersByTime(120); });
    expect(button.getAttribute("aria-expanded")).toBe("true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(button.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(button);
    fireEvent.pointerLeave(root, { pointerType: "touch" });
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  it("ties both B and C inspection to the same crop and clears on outside touch", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ left: 0, top: 0, right: 600, bottom: 500, width: 600, height: 500 } as DOMRect);
    const disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class { observe() {} disconnect = disconnect; });
    const { container } = render(<PortfolioBoard projects={portfolioProjects} />);
    const region = container.querySelector("[data-evidence-active]")!;
    const detail = screen.getByRole("button", { name: "Inspect / the handoff" });
    expect(region.getAttribute("data-evidence-active")).toBe("false");
    fireEvent.click(detail);
    expect(region.getAttribute("data-evidence-active")).toBe("true");
    expect(screen.getByRole("img", { name: /location in B/ })).toBeTruthy();
    expect(region.querySelector("svg path")).toBeTruthy();
    expect(region.querySelectorAll("svg rect")).toHaveLength(2);
    expect(screen.getByText("SRC 1734,1518 px")).toBeTruthy();
    const path = region.querySelector("svg path")!.getAttribute("d");
    fireEvent.pointerDown(document.body);
    expect(region.getAttribute("data-evidence-active")).toBe("false");
    expect(region.querySelector("svg path")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Inspect / the system" }));
    expect(region.querySelector("svg path")!.getAttribute("d")).toBe(path);
    fireEvent.pointerDown(document.body);
    fireEvent.click(screen.getByRole("button", { name: "Inspect / the starting point" }));
    expect(region.getAttribute("data-evidence-active")).toBe("false");
  });

  it("switches the map between full overview and located, magnifiable details", () => {
    const artifact = project.artifacts[0];
    render(<ArtifactViewer artifact={artifact} />);
    expect(screen.getByRole("button", { name: "Overview" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Creation handoff" }));
    expect(screen.getByRole("img", { name: /location within the full map/ })).toBeTruthy();
    const zoomIn = screen.getByRole("button", { name: "Zoom in on map" });
    fireEvent.click(zoomIn); fireEvent.click(zoomIn); fireEvent.click(zoomIn);
    expect((zoomIn as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("region", { name: /4 times magnification/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Overview" }));
    expect(screen.queryByRole("img", { name: /location within the full map/ })).toBeNull();
    expect(screen.getByRole("region", { name: /1 times magnification/ })).toBeTruthy();
    for (const detail of artifact.details!) {
      expect(detail.crop.x + detail.crop.width).toBeLessThanOrEqual(1);
      expect(detail.crop.y + detail.crop.height).toBeLessThanOrEqual(1);
      expect(detail.crop.width).toBeGreaterThan(0);
      expect(detail.crop.height).toBeGreaterThan(0);
    }
  });

  it("restores framing only when returning from the recorded Project", () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
    sessionStorage.setItem(BOARD_POSITION, JSON.stringify({ y: 320, project: "/work/ccp" }));
    sessionStorage.setItem("portfolio-return", "/work/another-project");
    window.eval(boardRestorationScript);
    expect(scroll).not.toHaveBeenCalled();
    sessionStorage.setItem("portfolio-return", "/work/ccp");
    window.eval(boardRestorationScript);
    expect(scroll).toHaveBeenCalledWith({ top: 320, behavior: "instant" });
    expect(sessionStorage.getItem("portfolio-return")).toBeNull();
  });

  it("preserves modified clicks and navigation when browser storage is unavailable", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<PortfolioLink href="/drawer">Board</PortfolioLink>);
    fireEvent.click(screen.getByRole("link"), { ctrlKey: true });
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockImplementation(() => { throw new Error("Storage unavailable"); });
    expect(() => fireEvent.click(screen.getByRole("link"))).not.toThrow();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/drawer");
  });
});
