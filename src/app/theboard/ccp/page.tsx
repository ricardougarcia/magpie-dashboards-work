import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/portfolio/project-page";
import { getPortfolioProject } from "@/data/portfolio";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

export function generateMetadata() {
  const project = getPortfolioProject("ccp");
  if (!project) notFound();
  return portfolioMetadata("/theboard/ccp", `${project.title} | Rico Garcia`, project.summary, "article");
}

export default function CcpWorkPage() {
  const project = getPortfolioProject("ccp");
  if (!project) notFound();
  return <ProjectPage project={project} />;
}
