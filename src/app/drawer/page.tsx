import type { Metadata } from "next";
import { PortfolioBoard } from "@/components/portfolio/portfolio-board";
import { portfolioProjects } from "@/data/portfolio";

export const metadata: Metadata = {
  title: "Board | Rico Garcia",
  description: "Selected product work: the questions, the decisions, and the work that followed.",
  openGraph: {
    title: "Board | Rico Garcia",
    description: "Selected product work: the questions, the decisions, and the work that followed.",
    type: "website",
  },
  robots: { index: false, follow: false },
};

export default function DrawerPage() {
  return <PortfolioBoard projects={portfolioProjects} />;
}
