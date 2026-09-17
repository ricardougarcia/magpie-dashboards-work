import { PortfolioLink as Link } from "./portfolio-link";
import type { ReactNode } from "react";
import { SiteMasthead, type WorkSampleRecord } from "@/components/site-masthead";
import "./portfolio-motion.css";
import styles from "./portfolio.module.css";

export { SiteMasthead as PortfolioMasthead } from "@/components/site-masthead";

export function PortfolioShell({ children, project, isBoard = false, pinMasthead = false }: { children: ReactNode; project?: WorkSampleRecord; isBoard?: boolean; pinMasthead?: boolean }) {
  return (
    <div className={`site-shell ${styles.shell}${pinMasthead ? ` ${styles.pinnedMasthead}` : ""}`} data-portfolio-view={isBoard ? "board" : "project"}>
      <a className={styles.skipLink} href="#portfolio-main">Skip to content</a>
      {!isBoard && <SiteMasthead project={project} />}
      {children}
      <footer className={styles.footer}>
        <span>Rico Garcia / Product management</span>
        <Link href="/drawer">{project ? "Return to Board ↑" : "Board / Selected work"}</Link>
      </footer>
    </div>
  );
}
