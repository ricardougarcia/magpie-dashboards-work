// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  isIndexablePortfolioPage,
  portfolioRedirect,
  PORTFOLIO_ORIGIN,
  PRODUCTION_LEGACY_REDIRECTS,
  PUBLIC_PORTFOLIO_PATHS,
  publicLaunchEnabled,
  WIX_ONLY_REDIRECTS,
  type PortfolioReleaseEnvironment,
} from "@/lib/portfolio-release";
import { proxy } from "@/proxy";

const { requestHeaders } = vi.hoisted(() => ({ requestHeaders: vi.fn() }));
vi.mock("next/headers", () => ({ headers: requestHeaders }));
import { portfolioMetadata } from "@/lib/portfolio-metadata";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

const production: PortfolioReleaseEnvironment = {
  VERCEL_ENV: "production",
  VERCEL_TARGET_ENV: "production",
  PORTFOLIO_PUBLIC_LAUNCH: "true",
};

function enableProduction() {
  vi.stubEnv("VERCEL_ENV", "production");
  vi.stubEnv("VERCEL_TARGET_ENV", "production");
  vi.stubEnv("PORTFOLIO_PUBLIC_LAUNCH", "true");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("production search release boundary", () => {
  it("requires explicit production launch and rejects preview/custom UAT even with the flag", () => {
    expect(publicLaunchEnabled({})).toBe(false);
    expect(publicLaunchEnabled({ ...production, PORTFOLIO_PUBLIC_LAUNCH: undefined })).toBe(false);
    expect(publicLaunchEnabled({ ...production, VERCEL_ENV: "preview" })).toBe(false);
    expect(publicLaunchEnabled({ ...production, VERCEL_TARGET_ENV: "uat" })).toBe(false);
    expect(publicLaunchEnabled(production)).toBe(true);
  });

  it("indexes only the nine intended pages on the exact apex host", () => {
    for (const path of PUBLIC_PORTFOLIO_PATHS) {
      expect(isIndexablePortfolioPage("ricardougarcia.com", path, production)).toBe(true);
      for (const host of [null, "www.ricardougarcia.com", "ricardougarcia.com.evil.example", "magpie-dashboards-work.vercel.app", "magpie-dashboards-work-uat.vercel.app", "ricardo-garcia-portfolio-preview.vercel.app"]) {
        expect(isIndexablePortfolioPage(host, path, production)).toBe(false);
      }
    }
    for (const path of ["/", "/drawer", "/work/gcm", "/theboard/unknown", "/resume/lines-1", "/edit", "/edit/login", "/api/timeline", "/about"]) {
      expect(isIndexablePortfolioPage("ricardougarcia.com", path, production)).toBe(false);
    }
  });

  it("ignores a forwarded production hostname and excludes the existing Magpie root", () => {
    enableProduction();
    const request = new NextRequest("https://magpie-dashboards-work.vercel.app/", {
      headers: { host: "magpie-dashboards-work.vercel.app", "x-forwarded-host": "ricardougarcia.com" },
    });
    const response = proxy(request);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("excludes every candidate page even with a spoofed forwarded custom host", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PORTFOLIO_PUBLIC_LAUNCH", "true");
    requestHeaders.mockResolvedValue(new Headers({ host: "ricardo-garcia-portfolio-preview.vercel.app", "x-forwarded-host": "ricardougarcia.com" }));
    for (const path of [...PUBLIC_PORTFOLIO_PATHS, "/", "/edit/login", "/api/timeline", "/portfolio/resume/ricardo-garcia-resume.pdf", "/portfolio/portal/original.png"]) {
      const request = new NextRequest(`https://ricardo-garcia-portfolio-preview.vercel.app${path}`, {
        headers: { host: "ricardo-garcia-portfolio-preview.vercel.app" },
      });
      expect(proxy(request).headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
    expect((await portfolioMetadata("/theboard", "Board", "Selected work")).robots).toEqual({ index: false, follow: false });
    expect(await robots()).toEqual({ rules: { userAgent: "*", allow: "/", disallow: ["/edit", "/api/"] } });
    expect(await sitemap()).toEqual([]);
  });

  it("publishes apex canonicals and a nine-page sitemap only after the production gate", async () => {
    enableProduction();
    requestHeaders.mockResolvedValue(new Headers({ host: "ricardougarcia.com" }));
    const metadata = await portfolioMetadata("/theboard", "Board", "Selected work");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates).toEqual({ canonical: `${PORTFOLIO_ORIGIN}/theboard` });
    expect(await sitemap()).toEqual(PUBLIC_PORTFOLIO_PATHS.map((path) => ({ url: `${PORTFOLIO_ORIGIN}${path}` })));
    expect((await robots()).sitemap).toBe(`${PORTFOLIO_ORIGIN}/sitemap.xml`);
  });
});

describe("explicit legacy link migration", () => {
  it("makes non-colliding Wix redirects reviewable while preserving accepted UAT paths", () => {
    for (const [path, destination] of Object.entries(WIX_ONLY_REDIRECTS)) {
      expect(portfolioRedirect("preview.vercel.app", path, {})).toEqual({ pathname: destination, canonicalOrigin: null });
    }
    for (const path of Object.keys(PRODUCTION_LEGACY_REDIRECTS)) {
      expect(portfolioRedirect("magpie-dashboards-work-uat.vercel.app", path, production)).toBeNull();
      expect(portfolioRedirect("ricardougarcia.com", path, {})).toBeNull();
    }
  });

  it("activates existing-route redirects only on the approved production custom domain", () => {
    for (const [path, destination] of Object.entries(PRODUCTION_LEGACY_REDIRECTS)) {
      expect(portfolioRedirect("ricardougarcia.com", path, production)).toEqual({ pathname: destination, canonicalOrigin: PORTFOLIO_ORIGIN });
    }
    for (const path of ["/about", "/contact", "/volunteer", "/news", "/blog", "/single-post/2019/10/03/marbles-and-moments", "/work/unknown"]) {
      expect(portfolioRedirect("ricardougarcia.com", path, production)).toBeNull();
    }
  });

  it("leaves the custom root decision off and never changes existing Magpie-host root meaning", () => {
    expect(portfolioRedirect("ricardougarcia.com", "/", production)).toBeNull();
    expect(portfolioRedirect("ricardougarcia.com", "/", { ...production, PORTFOLIO_ROOT_REDIRECT: "theboard" })).toEqual({ pathname: "/theboard", canonicalOrigin: PORTFOLIO_ORIGIN });
    expect(portfolioRedirect("magpie-dashboards-work.vercel.app", "/", { ...production, PORTFOLIO_ROOT_REDIRECT: "theboard" })).toBeNull();
  });

  it("redirects www to HTTPS apex, preserves queries, and adds no fragment that could replace an incoming fragment", () => {
    enableProduction();
    const request = new NextRequest("https://www.ricardougarcia.com/work/dashboards?view=timeline", {
      headers: { host: "www.ricardougarcia.com" },
    });
    const response = proxy(request);
    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("https://ricardougarcia.com/theboard/magpie?view=timeline");
  });

  it("does not redirect write methods or bypass editor/API authorization", () => {
    enableProduction();
    for (const path of ["/api/timeline", "/api/media", "/api/auth/login", "/edit/login"]) {
      const request = new NextRequest(`https://ricardougarcia.com${path}`, {
        method: "POST", headers: { host: "ricardougarcia.com" },
      });
      const response = proxy(request);
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
  });
});
