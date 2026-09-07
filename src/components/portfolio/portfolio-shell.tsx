import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./portfolio.module.css";

export function PortfolioShell({ children, projectNumber, isBoard = false }: { children: ReactNode; projectNumber?: string; isBoard?: boolean }) {
  return (
    <div className={`site-shell ${styles.shell}`}>
      <a className={styles.skipLink} href="#portfolio-main">Skip to content</a>
      <header className={styles.masthead}>
        <Link href="/drawer" className={styles.identity} aria-label="Rico Garcia — Board">
          <span className={styles.monogram} aria-hidden="true">R/G</span>
          <span>Rico Garcia</span>
        </Link>
        <span className={styles.mastheadMeta}>Product management <span>/ Selected work</span></span>
        <Link href="/drawer" className={styles.boardLink} aria-current={isBoard ? "page" : undefined}>
          <span aria-hidden="true">{projectNumber ? "←" : "+"}</span> Board
          <span className={styles.navIndex}>{projectNumber ? ` / ${projectNumber}` : " / Overview"}</span>
        </Link>
      </header>
      {children}
      <footer className={styles.footer}>
        <span>Rico Garcia / Product management</span>
        <Link href="/drawer">{projectNumber ? "Return to Board ↑" : "Board / Selected work"}</Link>
      </footer>
    </div>
  );
}
