import Link from "next/link";
import { PortfolioShell } from "@/components/portfolio/portfolio-shell";
import styles from "@/components/portfolio/portfolio.module.css";

export default function ProjectNotFound() {
  return (
    <PortfolioShell>
      <main id="portfolio-main" className={styles.notFound}>
        <p className={styles.eyebrow}>[404] / Project not found</p>
        <h1>This Project isn’t on the Board.</h1>
        <Link href="/drawer" className={styles.startReading}>Return to the Board <span aria-hidden="true">↗</span></Link>
      </main>
    </PortfolioShell>
  );
}
