import { CoordinateCursor } from "@/components/coordinate-cursor";
import { pmfAssets, pmfMarketCheckpoints, pmfPrototypeFrames, pmfRecord, pmfResearchCheckpoints } from "@/data/pmf";
import { PortfolioShell } from "./portfolio-shell";
import { PortfolioLink } from "./portfolio-link";
import { PmfArtifact } from "./pmf-artifact";
import { PmfCheckpoint } from "./pmf-checkpoint";
import { PmfInquiryMotion } from "./pmf-inquiry-motion";
import { PmfCapabilityMap, PmfOpportunityMap } from "./pmf-diagrams";
import styles from "./pmf.module.css";

const initialJoinPath = "M26 0 V20 H250 V45 C250 90 500 70 500 135 M526 0 V20 H750 V45 C750 90 500 70 500 135 M500 135 V180";

export function PmfPage() {
  return <PortfolioShell project={pmfRecord}>
    <main id="portfolio-main" className={styles.page} data-pmf-page data-gantt-region>
      <CoordinateCursor />
      <header className={styles.hero}>
        <div>
          <p className={`${styles.meta} ${styles.signal}`}>Sole product lead / 1 month</p>
          <h1>Product–market fit<span>…with no product.</span></h1>
        </div>
        <div className={styles.heroNote}>
          <h2>Listen to people.<br />Read the market.</h2>
          <p>I explored unfamiliar AI capabilities through low-fidelity research, while mapping where a new model might offer differentiated value.</p>
          <a className={styles.followInquiry} href="#inquiry">Follow the two lines of inquiry<span aria-hidden="true" /></a>
        </div>
      </header>
      <PmfInquiryMotion>
        <section id="inquiry" className={styles.inquiry} aria-label="Two lines of inquiry">
          <div className={styles.tracks}>
            <section className={styles.track} data-pmf-track="research" aria-labelledby="research-heading">
              <header className={styles.trackHeading}>
                <span className={styles.trackOrigin} aria-hidden="true" />
                <p className={styles.meta}>User research</p>
                <h2 id="research-heading">Which problems<br />matter to people?</h2>
              </header>
              {pmfResearchCheckpoints.map((checkpoint) => <PmfCheckpoint key={checkpoint.id} {...checkpoint}>
                {checkpoint.id === "research-choice"
                  ? <PmfArtifact artifact={pmfPrototypeFrames[0]} sequence={pmfPrototypeFrames} />
                  : <PmfArtifact artifact={pmfAssets[checkpoint.artifact]} />}
              </PmfCheckpoint>)}
            </section>
            <section className={`${styles.track} ${styles.marketTrack}`} data-pmf-track="market" aria-labelledby="market-heading">
              <header className={styles.trackHeading}>
                <span className={styles.trackOrigin} aria-hidden="true" />
                <p className={styles.meta}>Market analysis</p>
                <h2 id="market-heading">Where could<br />the model matter?</h2>
              </header>
              {pmfMarketCheckpoints.map((checkpoint, index) => <PmfCheckpoint key={checkpoint.id} {...checkpoint}>
                {index === 0 ? <PmfArtifact artifact={pmfAssets.market} /> : index === 1 ? <PmfCapabilityMap /> : <PmfOpportunityMap />}
              </PmfCheckpoint>)}
            </section>
          </div>
          <div className={styles.convergence} data-pmf-convergence>
            <svg className={styles.convergenceLines} viewBox="0 0 1000 180" preserveAspectRatio="none" aria-hidden="true">
              <path className={styles.lineBase} d={initialJoinPath} />
              <path className={styles.lineDraw} pathLength="1" d={initialJoinPath} />
            </svg>
            <div className={styles.convergenceContent}>
              <span className={styles.convergencePoint} aria-hidden="true" />
              <p className={`${styles.meta} ${styles.signal}`}>Research + market context</p>
              <h2>One direction<br />worth building toward.</h2>
              <p>The combined work surfaced viable paths toward product–market fit and informed the company’s initial MVP.</p>
              <PortfolioLink href="/work/gcm" className={styles.gcmLink}>Continue to the GCM work sample<span>Separate project / the subsequent MVP</span></PortfolioLink>
            </div>
          </div>
        </section>
      </PmfInquiryMotion>
      <PortfolioLink href="/drawer" className={styles.returnLink} data-board-return><span>Return to the Board</span><span className={styles.meta}>Selected work</span></PortfolioLink>
    </main>
  </PortfolioShell>;
}
