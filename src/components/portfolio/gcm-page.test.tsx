import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import GcmWorkPage, { metadata } from "@/app/work/gcm/page";

function serverPage() {
  const page = document.createElement("div");
  page.innerHTML = renderToString(<GcmWorkPage />);
  return page;
}

describe("GCM direct case-study route", () => {
  it("server-renders the question, ledger, demonstration, and impact with working section anchors", () => {
    const page = serverPage();
    expect(page.querySelectorAll("main")).toHaveLength(1);
    expect(page.querySelectorAll("h1")).toHaveLength(1);
    expect(page.querySelector("h1")?.textContent).toBe("What makes an AI answerworth trusting?");
    const nav = page.querySelector('nav[aria-label="GCM project sections"]')!;
    expect([...nav.querySelectorAll("a")].map(link => link.getAttribute("href"))).toEqual(["#reliability", "#product-work", "#impact"]);
    for (const link of page.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(page.querySelectorAll(link.getAttribute("href")!), link.textContent ?? "section anchor").toHaveLength(1);
    }
    const ids = [...page.querySelectorAll("[id]")].map(element => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ["reliability", "product-work", "impact"]) {
      const section = page.querySelector(`#${id}`)!;
      expect(section.closest('[hidden], [inert], [aria-hidden="true"], details')).toBeNull();
      expect(section.querySelector("h2")?.textContent).toBeTruthy();
    }
    expect(page.querySelectorAll("#reliability button")).toHaveLength(6);
    expect(page.querySelector("#product-work video")?.closest("[hidden]")).toBeNull();
    expect(page.querySelector("main a[data-board-return]")).toBeNull();
    expect(page.querySelector('footer a[href="/drawer"]')?.textContent).toContain("Return to Board");
  });

  it("identifies the sole product lead without claiming sole engineering or data-science delivery", () => {
    const page = serverPage();
    expect(page.querySelector("main > header")?.textContent).toContain("Sole product lead");
    expect(page.querySelector("main > header")?.textContent).toContain("planned the integration");
    expect(page.querySelector("#impact")?.textContent).toContain("Engineering, data science, and product");
    expect(page.querySelector("#impact")?.textContent).toContain("Lean-team delivery");
  });

  it("keeps all six outcomes visible with the owner-updated total and labels 97 percent as evaluation alignment", () => {
    const page = serverPage();
    const outcomes = [...page.querySelectorAll("#impact dl > div")];
    expect(outcomes.map(outcome => [outcome.querySelector("dd")?.textContent, outcome.querySelector("dt")?.textContent])).toEqual([
      ["10", "Pilot commitments + follow-on engagements"],
      ["≥4.5/5", "Feedback on clarity and utility"],
      ["97%", "Evaluation alignment"],
      ["100%", "Participants contributed feature requests"],
      ["Lean-team delivery", "Engineering, data science, and product"],
      ["Modular foundation", "Built for future expansion"],
    ]);
    for (const outcome of outcomes) expect(outcome.closest('details, [hidden], [aria-hidden="true"]')).toBeNull();
    const hero = page.querySelector("main > header")!;
    expect(hero.textContent).toContain("Alignment in evaluation tests.");
    expect(hero.textContent).toContain("Reported outcome");
    expect(page.textContent).not.toMatch(/97%\s*(?:accuracy|accurate)/i);
  });

  it("links the implemented PMF route as a separate research work sample", () => {
    const page = serverPage();
    const heading = page.querySelector("#gcm-pmf-heading")!;
    const section = heading.closest("section")!;
    expect(section.textContent).toContain("Separate work sample");
    const link = section.querySelector("a")!;
    expect(link.textContent).toContain("Product Market Fit…");
    expect(link.textContent).toContain("with no product");
    expect(link.getAttribute("href")).toBe("/work/pmf");
  });

  it("serves local evidence assets and identifies the UAT route without indexing it", () => {
    for (const file of ["demo-poster.jpg", "data-coverage.jpg", "expected-behaviors.png"]) {
      expect(existsSync(resolve("public/portfolio/gcm", file)), file).toBe(true);
    }
    expect(metadata.title).toBe("GCM | Rico Garcia");
    expect(metadata.description).toContain("Sole product lead");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
