import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { MarketplacePage } from "./marketplace-page";
import { marketplaceArtifacts, marketplaceSections } from "@/data/marketplace";
import { metadata } from "@/app/work/marketplace/page";

describe("Marketplace case study", () => {
  it("server-renders the repository transition before the shared product and keeps primary evidence outside disclosures", () => {
    const page = document.createElement("div");
    page.innerHTML = renderToString(<MarketplacePage />);
    expect([...page.querySelectorAll("[data-marketplace-section]")].map(section => section.id)).toEqual(marketplaceSections.map(section => section.id));
    page.querySelectorAll("details").forEach(detail => detail.remove());
    expect(page.textContent).toContain("Emerging AI Marketplace");
    expect(page.textContent).toContain("Edu App Center");
    expect(page.textContent).toContain("LearnCommunity Library");
    expect(page.querySelector("#orchestration")?.textContent).toContain("Legacy data continued into the shared backend during the sunset period.");
    expect(page.querySelector("#impact")?.textContent).toContain("Reported over five months");
    expect(page.querySelector("[data-opening-state]")?.getAttribute("data-opening-state")).toBe("open");
    for (const link of page.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(page.querySelector(link.getAttribute("href")!)).toBeTruthy();
    }
  });

  it("serves real original artifacts and keeps the UAT case out of search indexes", () => {
    for (const artifact of Object.values(marketplaceArtifacts)) {
      expect(existsSync(resolve("public", artifact.src.slice(1)))).toBe(true);
      expect(artifact.width).toBeGreaterThan(0);
      expect(artifact.height).toBeGreaterThan(0);
    }
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
