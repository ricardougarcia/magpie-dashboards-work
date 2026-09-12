import { PortfolioLink as Link } from "./portfolio-link";
import type { ReactNode } from "react";
import type { PortfolioProject } from "@/lib/portfolio-types";
import "./portfolio-motion.css";
import styles from "./portfolio.module.css";

type ProjectRecord = Pick<PortfolioProject, "number" | "role" | "organization">;

export function PortfolioShell({ children, project, isBoard = false }: { children: ReactNode; project?: ProjectRecord; isBoard?: boolean }) {
  return (
    <div className={`site-shell ${styles.shell}`} data-portfolio-view={isBoard ? "board" : "project"}>
      <a className={styles.skipLink} href="#portfolio-main">Skip to content</a>
      {!isBoard && <PortfolioMasthead project={project} />}
      {children}
      <footer className={styles.footer}>
        <span>Rico Garcia / Product management</span>
        <Link href="/drawer">{project ? "Return to Board ↑" : "Board / Selected work"}</Link>
      </footer>
    </div>
  );
}

export function PortfolioMasthead({ isBoard = false, project }: { isBoard?: boolean; project?: ProjectRecord }) {
  if (project) {
    return (
      <header className="masthead" data-panel="0">
        <Link href="/drawer" className="wordmark" aria-label="Rico Garcia — Board">
          <span className="wordmark-mark" aria-hidden="true">R/G</span>
          <span>Rico Garcia</span>
        </Link>
        <div className="masthead-meta">
          <span>{project.role}</span>
          <span>{project.organization} record / 2026</span>
        </div>
        <Link href="/drawer" className="edit-link">Board / {project.number}</Link>
      </header>
    );
  }

  return (
      <header className={styles.masthead}>
        <Link href="/drawer" className={styles.identity} aria-label="Rico Garcia — Board">
          <span className={styles.monogram} aria-hidden="true">R/G</span>
          <span>Rico Garcia</span>
        </Link>
        <span className={styles.mastheadMeta}>Product management <span>/ Selected work</span></span>
        <Link href="/drawer" className={styles.boardLink} aria-current={isBoard ? "page" : undefined}>
          <span aria-hidden="true">+</span> Board
          <span className={styles.navIndex}> / Overview</span>
        </Link>
      </header>
  );
}
