import { ResumePage } from "@/components/resume/resume-page";
import { PortfolioNavigationProvider } from "@/components/portfolio/portfolio-navigation-provider";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

export function generateMetadata() {
  return portfolioMetadata("/resume", "Resume | Rico Garcia", "Rico Garcia — Principal Product Manager. Resume.");
}

export default async function Resume({ searchParams }: { searchParams: Promise<{ board?: string | string[] }> }) {
  const family = (await searchParams).board === "drawer" ? "legacy" : "public";
  return <PortfolioNavigationProvider family={family}><ResumePage /></PortfolioNavigationProvider>;
}
