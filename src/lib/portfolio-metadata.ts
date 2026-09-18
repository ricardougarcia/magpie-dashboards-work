import type { Metadata } from "next";
import { headers } from "next/headers";
import { isIndexablePortfolioPage, PORTFOLIO_ORIGIN } from "@/lib/portfolio-release";

export async function portfolioMetadata(
  pathname: string,
  title: string,
  description: string,
  type: "website" | "article" = "website",
): Promise<Metadata> {
  const host = (await headers()).get("host");
  const indexable = isIndexablePortfolioPage(host, pathname);
  const canonical = `${PORTFOLIO_ORIGIN}${pathname}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, type, url: canonical },
    robots: { index: indexable, follow: indexable },
  };
}
