import { PortfolioBoard } from "@/components/portfolio/portfolio-board";
import { portfolioProjects } from "@/data/portfolio";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

export function generateMetadata() {
  return portfolioMetadata("/theboard", "Board | Rico Garcia", "Selected product work: the questions, the decisions, and the work that followed.");
}

export default function BoardPage() {
  return <PortfolioBoard projects={portfolioProjects} />;
}
