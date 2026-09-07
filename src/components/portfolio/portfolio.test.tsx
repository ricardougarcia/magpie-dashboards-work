import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PortfolioBoard } from "./portfolio-board";
import { ProjectPage } from "./project-page";
import { portfolioProjects } from "@/data/portfolio";
import { PROJECT_SECTION_TITLES } from "@/lib/portfolio-types";
import WorkProjectPage, { generateMetadata, generateStaticParams } from "@/app/work/[slug]/page";

vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));
afterEach(cleanup);

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
});
