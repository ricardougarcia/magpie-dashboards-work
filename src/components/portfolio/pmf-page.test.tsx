import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PmfWorkPage, { metadata } from "@/app/work/pmf/page";
import { pmfAssets } from "@/data/pmf";

const manifest = JSON.parse(readFileSync(resolve("docs/pmf-safe-assets.json"), "utf8")) as {
  assets: { file: string; sha256: string }[];
  blockedSourceHashes: string[];
};

describe("PMF's two lines of inquiry", () => {
  it("renders both complete research paths and a separate MVP destination without claiming achieved PMF", () => {
    const page = document.createElement("div");
    page.innerHTML = renderToString(<PmfWorkPage />);
    expect(page.querySelectorAll("main")).toHaveLength(1);
    expect(page.querySelectorAll("h1")).toHaveLength(1);
    expect(page.querySelector("h1")?.textContent).toBe("Product–market fit…with no product.");
    expect(page.querySelectorAll("[data-pmf-track]")).toHaveLength(2);
    for (const track of page.querySelectorAll("[data-pmf-track]")) {
      expect(track.querySelectorAll("[data-pmf-checkpoint]")).toHaveLength(3);
      expect(track.closest('[hidden], [inert], [aria-hidden="true"]')).toBeNull();
    }
    expect(page.textContent).toContain("Sole product lead / 1 month");
    expect(page.textContent).toContain("informed the company’s initial MVP");
    expect(page.textContent).not.toMatch(/achieved product.market fit|97%|pilot commitments/i);
    expect(page.querySelector('a[href="/work/gcm"]')?.textContent).toContain("Separate project");
    expect(page.querySelector('a[data-board-return]')?.getAttribute("href")).toBe("/drawer");
    const ids = [...page.querySelectorAll("[id]")].map(el => el.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const link of page.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(page.querySelector(link.getAttribute("href")!)).toBeTruthy();
    }
  });

  it("distinguishes genuine protected originals from the two illustrative diagrams", () => {
    const page = document.createElement("div");
    page.innerHTML = renderToString(<PmfWorkPage />);
    expect(page.querySelectorAll('button[aria-haspopup="dialog"]')).toHaveLength(4);
    expect(page.querySelectorAll('[data-pmf-capability-map]')).toHaveLength(1);
    expect(page.querySelectorAll('[data-pmf-opportunity-map]')).toHaveLength(1);
    expect(page.textContent?.match(/Illustrative reconstruction/g)).toHaveLength(2);
    const publicPaths = Object.values(pmfAssets).map(asset => asset.src);
    for (const image of page.querySelectorAll("img")) {
      expect(publicPaths).toContain(image.getAttribute("src"));
      expect(image.hasAttribute("srcset")).toBe(false);
    }
    expect(page.innerHTML).not.toMatch(/wixstatic|ricardougarcia\.com\/work\/pmf|data-inspect|sources\.json|Inspect source/);
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("ships only the four reviewed flattened exports in the PMF directory", () => {
    const directory = resolve("public/portfolio/pmf");
    expect(readdirSync(directory).sort()).toEqual(manifest.assets.map(asset => asset.file).sort());
    for (const asset of manifest.assets) {
      const bytes = readFileSync(resolve(directory, asset.file));
      expect(createHash("sha256").update(bytes).digest("hex"), asset.file).toBe(asset.sha256);
      // Confidential text/EXIF/embedded originals cannot hitchhike in PNG ancillary chunks.
      let offset = 8;
      while (offset < bytes.length) {
        const size = bytes.readUInt32BE(offset);
        expect(["IHDR", "IDAT", "IEND"]).toContain(bytes.toString("ascii", offset + 4, offset + 8));
        offset += size + 12;
      }
    }
    expect(existsSync(resolve("public/portfolio/gcm/pmf-market-analysis.png"))).toBe(false);
  });

  it("does not ship an original PMF asset under another public filename", () => {
    const root = resolve("public");
    const files = readdirSync(root, { recursive: true, withFileTypes: true }).filter(entry => entry.isFile());
    for (const entry of files) {
      const path = resolve(entry.parentPath, entry.name);
      const hash = createHash("sha256").update(readFileSync(path)).digest("hex");
      expect(manifest.blockedSourceHashes, entry.name).not.toContain(hash);
    }
  });
});
