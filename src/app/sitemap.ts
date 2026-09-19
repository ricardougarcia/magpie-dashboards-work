import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isPublicPortfolioHost, PORTFOLIO_ORIGIN, PUBLIC_PORTFOLIO_PATHS } from "@/lib/portfolio-release";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host");
  if (!isPublicPortfolioHost(host)) return [];
  return PUBLIC_PORTFOLIO_PATHS.map((path) => ({ url: `${PORTFOLIO_ORIGIN}${path}` }));
}
