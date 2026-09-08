import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
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
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); });

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
    expect(panel.hidden).toBe(true);
    fireEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    fireEvent.click(button);
    expect(panel.hidden).toBe(true);
    expect(screen.getByText("Creation workflow")).toBeTruthy();
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
