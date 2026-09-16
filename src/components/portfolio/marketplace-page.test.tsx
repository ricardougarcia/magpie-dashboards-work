import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { MarketplacePage } from "./marketplace-page";
import { marketplaceArtifacts } from "@/data/marketplace";
import { metadata } from "@/app/work/marketplace/page";

function serverPage() {
  const page = document.createElement("div");
  page.innerHTML = renderToString(<MarketplacePage />);
  return page;
}

describe("Marketplace case study", () => {
  it("opens with the confluence and keeps four reading sections plus existing deep links", () => {
    const page = serverPage();
    expect([...page.querySelectorAll("[data-marketplace-section]")].map(section => section.id))
      .toEqual(["repositories", "investigation", "orchestration", "impact"]);
    expect(page.querySelector("main > [data-confluence]")).toBeTruthy();
    expect(page.querySelector("[data-opening] [data-marketplace-intro]")?.textContent).toContain("I led product strategy and delivery");
    expect(page.querySelector("main > header")).toBeNull();
    const opening = page.querySelector("[data-opening]")!;
    const navigation = page.querySelector("nav[aria-label='Project sections']")!;
    expect(opening.contains(navigation)).toBe(false);
    expect(opening.compareDocumentPosition(navigation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect([...navigation.querySelectorAll("a")].map(link => link.getAttribute("href")))
      .toEqual(["#repositories", "#investigation", "#orchestration", "#impact"]);
    expect(page.querySelectorAll("[data-catalog-destination]")).toHaveLength(1);
    expect(page.querySelector("[data-marketplace-opening]")).toBeNull();
    for (const id of ["people", "shared-product", "reflection"]) expect(page.querySelectorAll(`#${id}`)).toHaveLength(1);
    for (const link of page.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(page.querySelector(link.getAttribute("href")!), link.textContent ?? "section link").toBeTruthy();
    }
    expect(page.querySelector("a[data-board-return]")?.getAttribute("href")).toBe("/drawer");
  });

  it("keeps the six original assets available without hydration and excludes the archived research images", () => {
    const page = serverPage();
    const displayedArtifacts = Object.values(marketplaceArtifacts).filter(artifact =>
      artifact !== marketplaceArtifacts.discovery && artifact !== marketplaceArtifacts.provider);
    for (const artifact of displayedArtifacts) {
      const instances = page.querySelectorAll(`#${artifact.id}`);
      expect(instances, artifact.id).toHaveLength(1);
      const original = instances[0].querySelector<HTMLAnchorElement>("a[data-marketplace-image]")!;
      expect(original.getAttribute("href")).toBe(artifact.src);
      expect(original.target).toBe("_blank");
      expect(original.rel).toContain("noopener");
      const preview = original.querySelector("img")!;
      expect(preview.getAttribute("alt")).toBe(artifact.alt);
      expect(preview.getAttribute("width")).toBe(String(artifact.width));
      expect(preview.getAttribute("height")).toBe(String(artifact.height));
    }
    for (const artifact of [marketplaceArtifacts.ai, marketplaceArtifacts.appCenter, marketplaceArtifacts.library, marketplaceArtifacts.catalog]) {
      expect(page.querySelector(`#${artifact.id}`)?.closest("[hidden], [inert], [aria-hidden='true']"), artifact.label).toBeNull();
    }
    for (const artifact of [marketplaceArtifacts.discovery, marketplaceArtifacts.provider]) {
      expect(page.querySelector(`#${artifact.id}`)).toBeNull();
    }
    expect(page.querySelector("#investigation details, #investigation [data-marketplace-artifact]")).toBeNull();
    expect(page.querySelectorAll("img")).toHaveLength(6);
    expect(page.querySelectorAll("dialog[open]")).toHaveLength(0);
    for (const caption of page.querySelectorAll("article [data-marketplace-artifact] figcaption")) {
      const figure = caption.closest("[data-marketplace-artifact]")!;
      // The compact A051 text control is itself the original-image fallback.
      const directConcept = figure.id === marketplaceArtifacts.canvasPlan.id;
      const original = directConcept
        ? figure.querySelector<HTMLAnchorElement>("a[data-marketplace-image]")!
        : caption.querySelector<HTMLAnchorElement>('a[href^="/portfolio/marketplace/"]')!;
      expect(original).toBeTruthy();
      if (directConcept) expect(original.getAttribute("aria-label")).toBe("Explore the in-platform discovery concept · A051");
      else expect(original.getAttribute("aria-label")).toMatch(/^Inspect original: .+ \(opens in a new tab\)$/);
    }
  });

  it("keeps the core transition and attributed outcomes outside optional details", () => {
    const page = serverPage();
    page.querySelectorAll("details, dialog").forEach(detail => detail.remove());
    for (const name of ["Emerging AI Marketplace", "Edu App Center", "LearnCommunity Library"]) {
      expect(page.querySelector("#repositories")?.textContent).toContain(name);
    }
    expect(page.querySelector("#orchestration")?.textContent).toContain("Legacy data continued into the shared backend during the sunset period.");
    expect(page.querySelector("#orchestration")?.textContent).toContain("sunsetting of Edu App Center");
    expect(page.querySelector("#impact")?.textContent).toContain("102%");
    expect(page.querySelector("#impact")?.textContent).toContain("20+ hr/wk");
    expect(page.querySelector("#impact")?.textContent).toContain("Reported over five months");
    expect(page.querySelector("#impact")?.textContent).toContain("Reported across separate environments");
  });

  it("preserves research, planning, retirement, and measurement qualifications", () => {
    const page = serverPage();
    const research = page.querySelector("#investigation")!;
    expect(research.textContent).toContain("Educators needed confidence in what they found. Providers needed ownership of what others found about them.");
    expect(research.querySelector("figcaption")?.textContent).toBe("Conceptual listing · no specific product or certification");
    const needs = [...research.querySelectorAll("h3")].map(heading => heading.textContent);
    expect(needs).toEqual([
      "Is this right for my needs?", "Will the right educators find us?",
      "What helps me evaluate it?", "Can we represent our product clearly?",
      "How do I learn more?", "Can interest become a conversation?",
    ]);
    expect(page.querySelector(`#${marketplaceArtifacts.canvasPlan.id}`)?.textContent).toContain("not a claim that every pictured feature shipped");
    expect(page.querySelector("#repositories")?.textContent).toContain("does not establish that all three catalogs were retired");
    expect(page.querySelector("#impact")?.textContent).toContain("underlying listing counts and time-measurement method are not included");
    expect(page.querySelector("#impact")?.textContent).toContain("not an isolated individual contribution");
    const summaries = [...page.querySelectorAll("#orchestration details > summary")].map(summary => summary.textContent);
    expect(new Set(summaries).size).toBe(summaries.length);
    expect(summaries.every(summary => !summary?.includes("Read the decision"))).toBe(true);
  });

  it("serves real original files and keeps the UAT case out of search indexes", () => {
    for (const artifact of Object.values(marketplaceArtifacts)) expect(existsSync(resolve("public", artifact.src.slice(1)))).toBe(true);
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
