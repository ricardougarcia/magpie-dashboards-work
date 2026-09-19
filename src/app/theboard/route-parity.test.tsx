import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BoardLayout from "./layout";
import Board from "./page";
import Magpie from "./magpie/page";
import Gcm from "./gcm/page";
import Marketplace from "./marketplace/page";
import Ccp from "./ccp/page";
import Portal from "./portal/page";
import Lti from "./lti/page";
import Pmf from "./pmf/page";
import LegacyBoard from "@/app/drawer/page";
import LegacyMagpie from "@/app/page";
import LegacyGcm from "@/app/work/gcm/page";
import LegacyMarketplace from "@/app/work/marketplace/page";
import LegacyProject from "@/app/work/[slug]/page";
import LegacyPortal from "@/app/work/portal/page";
import LegacyLti from "@/app/work/lti/page";
import LegacyPmf from "@/app/work/pmf/page";
import Resume from "@/app/resume/page";
import { portfolioHref } from "@/lib/portfolio-navigation";

vi.mock("@/lib/timeline-storage", async () => {
  const { default: data } = await import("@/data/timeline.seed.json");
  return { getTimelineData: async () => data };
});

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn() })));
});
afterEach(() => vi.unstubAllGlobals());

function normalizeNavigation(markup: string) {
  const page = document.createElement("div");
  page.innerHTML = markup;
  for (const link of page.querySelectorAll<HTMLAnchorElement>("a[href]")) {
    const href = portfolioHref(link.getAttribute("href")!, "public")!;
    link.setAttribute("href", href.replace("?board=drawer", ""));
  }
  return page.innerHTML;
}

type Route = { path: string; candidate: () => ReactElement | Promise<ReactElement>; legacy: () => ReactElement | Promise<ReactElement> };
const routes: Route[] = [
  { path: "/theboard", candidate: Board, legacy: LegacyBoard },
  { path: "/theboard/magpie", candidate: Magpie, legacy: LegacyMagpie },
  { path: "/theboard/gcm", candidate: Gcm, legacy: LegacyGcm },
  { path: "/theboard/marketplace", candidate: Marketplace, legacy: LegacyMarketplace },
  { path: "/theboard/ccp", candidate: Ccp, legacy: () => LegacyProject({ params: Promise.resolve({ slug: "ccp" }) }) },
  { path: "/theboard/portal", candidate: Portal, legacy: LegacyPortal },
  { path: "/theboard/lti", candidate: Lti, legacy: LegacyLti },
  { path: "/theboard/pmf", candidate: Pmf, legacy: LegacyPmf },
];

describe("production route component reuse", () => {
  it.each(routes)("preserves every rendered element and asset on $path, changing only document links", async ({ candidate, legacy }) => {
    const oldMarkup = renderToString(await legacy());
    const newMarkup = renderToString(<BoardLayout>{await candidate()}</BoardLayout>);
    expect(normalizeNavigation(newMarkup)).toBe(normalizeNavigation(oldMarkup));

    const page = document.createElement("div");
    page.innerHTML = newMarkup;
    expect(page.querySelector('a[href="/theboard"]')).not.toBeNull();
    expect(page.querySelector('a[href="/drawer"], a[href^="/work/"], a[href="/"], a[href^="/#"]')).toBeNull();
    for (const link of page.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')) {
      expect(page.querySelector(`[id="${link.hash.slice(1)}"]`), `fragment ${link.hash}`).not.toBeNull();
    }
  });

  it("keeps resume content and assets identical while selecting the originating Board", async () => {
    const publicResume = renderToString(await Resume({ searchParams: Promise.resolve({}) }));
    const legacyResume = renderToString(await Resume({ searchParams: Promise.resolve({ board: "drawer" }) }));
    expect(normalizeNavigation(publicResume)).toBe(normalizeNavigation(legacyResume));
    expect(publicResume).toContain('href="/theboard"');
    expect(legacyResume).toContain('href="/drawer"');
    expect(publicResume).toContain('href="/resume-assets/Rico_Garcia_Resume.pdf"');
    expect(legacyResume).toContain('href="/resume-assets/Rico_Garcia_Resume.pdf"');
  });
});
