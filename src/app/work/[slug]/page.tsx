import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/portfolio/project-page";
import { getPortfolioProject, portfolioProjects } from "@/data/portfolio";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return portfolioProjects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getPortfolioProject(slug);
  if (!project) notFound();
  return {
    title: `${project.title} | Rico Garcia`,
    description: project.summary,
    openGraph: { title: `${project.title} | Rico Garcia`, description: project.summary, type: "article" },
    robots: { index: false, follow: false },
  };
}

export default async function WorkProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getPortfolioProject(slug);
  if (!project) notFound();
  return <ProjectPage project={project} />;
}
