import { CoordinateCursor } from "@/components/coordinate-cursor";
import { gcmRecord } from "@/data/gcm";
import { PortfolioShell } from "./portfolio-shell";
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
        <nav className={styles.sectionNav} data-gcm-section-nav aria-label="GCM project sections"><a href="#reliability">01 / Reliability</a><a href="#product-work">02 / Product work</a><a href="#impact">03 / Impact</a></nav>
        <article className={styles.readingContent} data-gcm-reading-content aria-label="Generative Consumer Model case study">
          <GcmLedger />
          <GcmEvidence />
          <GcmImpact />
          <GcmCompanion />
        </article>
      </GcmContentSheet>
    </main>
  </PortfolioShell>;
}
