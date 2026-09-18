import { PortfolioLink as Link } from "@/components/portfolio/portfolio-link";
import "@/components/portfolio/portfolio-motion.css";

export type WorkSampleRecord = {
  mark: string;
  number: string;
  role: string;
  organization: string;
};

export function SiteMasthead({ project, isBoard = false, isResume = false }: {
  project?: WorkSampleRecord;
  isBoard?: boolean;
  isResume?: boolean;
}) {
  return (
    <header className="masthead" data-panel="0">
      <Link href="/drawer" className="wordmark" aria-label="Rico Garcia — Board">
        <span className="wordmark-mark" aria-hidden="true">{project?.mark ?? "R/G"}</span>
        <span>Rico Garcia</span>
      </Link>
      <div className="masthead-meta">
        <span>{project?.role ?? "Product management"}</span>
        <span>/ {project?.organization ?? "Selected work"}</span>
      </div>
      {isBoard || isResume ? (
        <nav className="masthead-navigation" aria-label="Primary">
          <Link href="/drawer" aria-current={isBoard ? "page" : undefined}>The Board</Link>
          <Link href="/resume" aria-current={isResume ? "page" : undefined}>Resume</Link>
        </nav>
      ) : (
        <Link href="/drawer" className="masthead-destination">
          {!project && <span className="masthead-plus" aria-hidden="true">+</span>}
          <span>Board / <span className={project ? undefined : "masthead-overview"}>{project?.number ?? "Overview"}</span></span>
        </Link>
      )}
    </header>
  );
}
