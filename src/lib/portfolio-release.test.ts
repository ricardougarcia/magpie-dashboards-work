// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  isIndexablePortfolioPage,
  portfolioRedirect,
  PORTFOLIO_HOST,
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

const publicHost = "ricardo-garcia-portfolio.vercel.app";
const excludedHosts = [
  "ricardougarcia.com",
  "www.ricardougarcia.com",
  "www.ricardo-garcia-portfolio.vercel.app",
  "ricardo-garcia-portfolio.vercel.app.evil.example",
  "other-project.vercel.app",
  "magpie-dashboards-work.vercel.app",
  "magpie-dashboards-work-uat.vercel.app",
  "ricardo-garcia-portfolio-preview.vercel.app",
];

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

  it("indexes only the nine intended pages on the exact neutral production host", () => {
    expect(PORTFOLIO_HOST).toBe(publicHost);
    expect(PORTFOLIO_ORIGIN).toBe(`https://${publicHost}`);
    for (const path of PUBLIC_PORTFOLIO_PATHS) {
      expect(isIndexablePortfolioPage(publicHost, path, production)).toBe(true);
      for (const host of [null, ...excludedHosts]) {
        expect(isIndexablePortfolioPage(host, path, production)).toBe(false);
      }
    }
    for (const path of ["/", "/drawer", "/work/gcm", "/theboard/unknown", "/resume/lines-1", "/edit", "/edit/login", "/api/timeline", "/about"]) {
      expect(isIndexablePortfolioPage(publicHost, path, production)).toBe(false);
    }
  });

  it("keeps the exact public hostname excluded before launch and in UAT or Preview", () => {
    for (const env of [
      {},
      { ...production, PORTFOLIO_PUBLIC_LAUNCH: "false" },
      { ...production, VERCEL_ENV: "preview" },
      { ...production, VERCEL_TARGET_ENV: "uat" },
    ]) {
      for (const path of PUBLIC_PORTFOLIO_PATHS) {
        expect(isIndexablePortfolioPage(publicHost, path, env)).toBe(false);
      }
      expect(portfolioRedirect(publicHost, "/drawer", env)).toBeNull();
      expect(portfolioRedirect(publicHost, "/", { ...env, PORTFOLIO_ROOT_REDIRECT: "theboard" })).toBeNull();
    }
  });

  it("ignores a forwarded production hostname and excludes the existing Magpie root", () => {
    enableProduction();
    const request = new NextRequest("https://magpie-dashboards-work.vercel.app/", {
      headers: { host: "magpie-dashboards-work.vercel.app", "x-forwarded-host": publicHost },
    });
    const response = proxy(request);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("excludes every candidate page even with a spoofed forwarded production host", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("PORTFOLIO_PUBLIC_LAUNCH", "true");
    requestHeaders.mockResolvedValue(new Headers({ host: "ricardo-garcia-portfolio-preview.vercel.app", "x-forwarded-host": publicHost }));
    for (const path of [...PUBLIC_PORTFOLIO_PATHS, "/", "/edit/login", "/api/timeline", "/portfolio/resume/ricardo-garcia-resume.pdf", "/portfolio/portal/original.png"]) {
      const request = new NextRequest(`https://ricardo-garcia-portfolio-preview.vercel.app${path}`, {
        headers: { host: "ricardo-garcia-portfolio-preview.vercel.app", "x-forwarded-host": publicHost },
      });
      expect(proxy(request).headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
    expect((await portfolioMetadata("/theboard", "Board", "Selected work")).robots).toEqual({ index: false, follow: false });
    expect(await robots()).toEqual({ rules: { userAgent: "*", allow: "/", disallow: ["/edit", "/api/"] } });
    expect(await sitemap()).toEqual([]);
  });

  it("publishes neutral-host canonicals, social URLs, headers and the nine-page sitemap", async () => {
    enableProduction();
    requestHeaders.mockResolvedValue(new Headers({ host: publicHost }));
    for (const path of PUBLIC_PORTFOLIO_PATHS) {
      const metadata = await portfolioMetadata(path, "Portfolio", "Selected work");
      expect(metadata.robots).toEqual({ index: true, follow: true });
      expect(metadata.alternates).toEqual({ canonical: `${PORTFOLIO_ORIGIN}${path}` });
      expect(metadata.openGraph?.url).toBe(`${PORTFOLIO_ORIGIN}${path}`);
      const response = proxy(new NextRequest(`${PORTFOLIO_ORIGIN}${path}`, { headers: { host: publicHost } }));
      expect(response.headers.get("x-robots-tag")).toBe("index, follow");
    }
    expect(await sitemap()).toEqual(PUBLIC_PORTFOLIO_PATHS.map((path) => ({ url: `${PORTFOLIO_ORIGIN}${path}` })));
    expect((await robots()).sitemap).toBe(`${PORTFOLIO_ORIGIN}/sitemap.xml`);
  });

  it("keeps old Wix, Magpie, UAT, preview and lookalike hosts excluded even on a production build", async () => {
    enableProduction();
    for (const host of excludedHosts) {
      requestHeaders.mockResolvedValue(new Headers({ host }));
      const metadata = await portfolioMetadata("/theboard", "Board", "Selected work");
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(await sitemap()).toEqual([]);
      expect((await robots()).sitemap).toBeUndefined();
      const response = proxy(new NextRequest(`https://${host}/theboard`, { headers: { host } }));
      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    }
  });
});

describe("explicit legacy link migration", () => {
  it("makes non-colliding Wix redirects reviewable while preserving accepted UAT paths", () => {
    for (const [path, destination] of Object.entries(WIX_ONLY_REDIRECTS)) {
      expect(portfolioRedirect("preview.vercel.app", path, {})).toEqual({ pathname: destination, canonicalOrigin: null });
    }
    for (const path of Object.keys(PRODUCTION_LEGACY_REDIRECTS)) {
      expect(portfolioRedirect("magpie-dashboards-work-uat.vercel.app", path, production)).toBeNull();
      expect(portfolioRedirect(publicHost, path, {})).toBeNull();
    }
  });

  it("activates existing-route redirects only on the approved neutral production host", () => {
    for (const [path, destination] of Object.entries(PRODUCTION_LEGACY_REDIRECTS)) {
      expect(portfolioRedirect(publicHost, path, production)).toEqual({ pathname: destination, canonicalOrigin: PORTFOLIO_ORIGIN });
      for (const host of excludedHosts) expect(portfolioRedirect(host, path, production)).toBeNull();
    }
    for (const path of ["/about", "/contact", "/volunteer", "/news", "/blog", "/single-post/2019/10/03/marbles-and-moments", "/work/unknown"]) {
      expect(portfolioRedirect(publicHost, path, production)).toBeNull();
    }
  });

  it("leaves the root decision off and never redirects the existing Magpie or other hosts' roots", () => {
    expect(portfolioRedirect(publicHost, "/", production)).toBeNull();
    expect(portfolioRedirect(publicHost, "/", { ...production, PORTFOLIO_ROOT_REDIRECT: "theboard" })).toEqual({ pathname: "/theboard", canonicalOrigin: PORTFOLIO_ORIGIN });
    for (const host of excludedHosts) {
      expect(portfolioRedirect(host, "/", { ...production, PORTFOLIO_ROOT_REDIRECT: "theboard" })).toBeNull();
    }
  });

  it("redirects GET and HEAD to the neutral host, preserving queries without replacing incoming fragments", () => {
    enableProduction();
    for (const method of ["GET", "HEAD"]) {
      for (const path of ["/work/dashboards", "/work/magpie"]) {
        const request = new NextRequest(`${PORTFOLIO_ORIGIN}${path}?view=timeline`, {
          method, headers: { host: publicHost },
        });
        const response = proxy(request);
        expect(response.status).toBe(308);
        expect(response.headers.get("location")).toBe(`${PORTFOLIO_ORIGIN}/theboard/magpie?view=timeline`);
      }
    }
  });

  it("does not redirect write methods or bypass editor/API authorization", () => {
    enableProduction();
    vi.stubEnv("PORTFOLIO_ROOT_REDIRECT", "theboard");
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      for (const path of ["/", "/drawer", "/work/dashboards", "/api/timeline", "/api/media", "/api/auth/login", "/edit/login"]) {
        const request = new NextRequest(`${PORTFOLIO_ORIGIN}${path}`, {
          method, headers: { host: publicHost },
        });
        const response = proxy(request);
        expect(response.headers.get("location")).toBeNull();
        expect(response.headers.get("x-middleware-next")).toBe("1");
        expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow");
      }
    }
  });
});
