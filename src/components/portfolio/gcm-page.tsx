import { CoordinateCursor } from "@/components/coordinate-cursor";
import { gcmRecord } from "@/data/gcm";
import { PortfolioShell } from "./portfolio-shell";
import { PortfolioLink } from "./portfolio-link";
import { GcmLedger } from "./gcm-ledger";
import { GcmEvidence } from "./gcm-evidence";
import { GcmHero } from "./gcm-hero";
import { GcmImpact } from "./gcm-impact";
import { GcmCompanion } from "./gcm-companion";
import { GcmContentSheet } from "./gcm-content-sheet";
import styles from "./gcm.module.css";

export function GcmPage() {
  return <PortfolioShell project={gcmRecord}>
    <main id="portfolio-main" className={styles.page} data-gcm-page data-gantt-region>
      <CoordinateCursor />
      <GcmHero />
      <GcmContentSheet>
        <nav className={styles.sectionNav} aria-label="GCM project sections"><a href="#reliability">01 / Reliability</a><a href="#product-work">02 / Product work</a><a href="#impact">03 / Impact</a></nav>
        <article aria-label="Generative Consumer Model case study">
          <GcmLedger />
          <GcmEvidence />
          <GcmImpact />
          <GcmCompanion />
          <PortfolioLink href="/drawer" className={styles.returnLink} data-board-return><span>Return to the Board</span><span className={styles.meta}>Selected work</span></PortfolioLink>
        </article>
      </GcmContentSheet>
    </main>
  </PortfolioShell>;
}
