import { CoordinateCursor } from "@/components/coordinate-cursor";
import { gcmOutcomes, gcmPmfHref, gcmRecord } from "@/data/gcm";
import { PortfolioShell } from "./portfolio-shell";
import { PortfolioLink } from "./portfolio-link";
import { GcmLedger } from "./gcm-ledger";
import { GcmEvidence } from "./gcm-evidence";
import styles from "./gcm.module.css";

export function GcmPage() {
  return <PortfolioShell project={gcmRecord}>
    <main id="portfolio-main" className={styles.page} data-gcm-page data-gantt-region>
      <CoordinateCursor />
      <header className={styles.hero}>
        <div>
          <p className={styles.register}>Generative Consumer Model / MVP</p>
          <h1>What makes an AI answer<br /><span>worth trusting?</span></h1>
          <div className={styles.scope}><p className={styles.role}>Sole product lead</p><p>I shaped the demo, planned the integration, and defined how we would evaluate its answers.</p></div>
        </div>
        <div className={styles.heroProof}><strong>97%</strong><div><p>Alignment in evaluation tests.</p><span className={styles.meta}>Reported outcome</span></div></div>
      </header>
      <nav className={styles.sectionNav} aria-label="GCM project sections"><a href="#reliability">01 / Reliability</a><a href="#product-work">02 / Product work</a><a href="#impact">03 / Impact</a></nav>
      <article aria-label="Generative Consumer Model case study">
        <GcmLedger />
        <GcmEvidence />
        <section id="impact" className={styles.section} aria-labelledby="gcm-impact-heading">
          <p className={styles.meta}>The response / Published case-study outcomes</p>
          <h2 id="gcm-impact-heading">From demonstration<br />to commitments.</h2>
          <dl className={styles.outcomes}>{gcmOutcomes.map((outcome) => <div key={outcome.value}>
            <dt>{outcome.label}</dt><dd className={outcome.words ? styles.wordOutcome : undefined}>{outcome.value}</dd>
          </div>)}</dl>
        </section>
        <section className={styles.companion} aria-labelledby="gcm-pmf-heading">
          <div><p className={styles.meta}>Before the MVP / Separate work sample</p><h3 id="gcm-pmf-heading">How did we decide<br />what was worth building?</h3></div>
          <div><a href={gcmPmfHref} className={styles.companionLink}>Product Market Fit…<br />with no product</a><p className={styles.meta}>Original case study / SaferData</p></div>
        </section>
        <PortfolioLink href="/drawer" className={styles.returnLink} data-board-return><span>Return to the Board</span><span className={styles.meta}>Selected work</span></PortfolioLink>
      </article>
    </main>
  </PortfolioShell>;
}
