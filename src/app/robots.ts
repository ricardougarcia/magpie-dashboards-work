import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPublicPortfolioHost, PORTFOLIO_ORIGIN } from "@/lib/portfolio-release";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host");
  return {
    // A robots disallow can prevent crawlers from seeing page-level noindex.
    // Allow public crawling on previews too, so exclusions and redirects work.
    // The exact page allowlist is enforced in metadata and X-Robots-Tag.
    rules: { userAgent: "*", allow: "/", disallow: ["/edit", "/api/"] },
    ...(isPublicPortfolioHost(host) ? { sitemap: `${PORTFOLIO_ORIGIN}/sitemap.xml` } : {}),
  };
}
