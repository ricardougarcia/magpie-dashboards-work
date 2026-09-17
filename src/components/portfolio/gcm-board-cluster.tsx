import Image from "next/image";
import type { BoardEntry } from "@/data/board";
import { gcmPmfHref } from "@/data/gcm";
import { pmfAssets, pmfPrototypeFrames } from "@/data/pmf";
import { PortfolioLink } from "./portfolio-link";
import { GcmBoardRelationship } from "./gcm-board-field";
import clusters from "./board-clusters.module.css";
import region from "./region.module.css";
import styles from "./gcm-board-cluster.module.css";

export function GcmBoardCluster({ entry }: { entry: BoardEntry }) {
  return <article id={`region-${entry.id}`} data-region-code="GCM" data-board-number={entry.number} data-board-state="ready" data-gcm-entry="gcm" className={`${clusters.cluster} ${styles.gcm}`} aria-labelledby="gcm-title">
    <header className={clusters.heading}>
      <p className={region.register}>[{entry.number}.A] SaferData / MVP</p>
      <h2 id="gcm-title" style={{ viewTransitionName: "region-gcm-title" }}><PortfolioLink href="/work/gcm" aria-label="GCM">GCM<span>.</span></PortfolioLink></h2>
      <p className={clusters.summary}>Make probabilistic AI tangible.</p>
      <div className={clusters.facts}><span>Sole product lead</span><span>Generative Consumer Model</span></div>
    </header>
    <PortfolioLink href="/work/gcm" className={styles.model} aria-label="Explore GCM: a working model, a testable answer">
      <h3>A working model.<br />A testable answer.</h3>
      <div className={styles.components} aria-label="GCM architecture components"><span>LLM <small>/ Interpret</small></span><span>MCP <small>/ Connect</small></span><span>GCM <small>/ Model</small></span></div>
    </PortfolioLink>
    <GcmBoardRelationship origin="gcm" />
    <footer className={clusters.clusterFoot}><span>R:GCM / 03.A</span><PortfolioLink href="/work/gcm">View project <span>[Open]</span></PortfolioLink></footer>
  </article>;
}

export function GcmPmfBoardSlip() {
  return <article id="study-pmf" data-board-subentry="03.B" data-gcm-entry="pmf" className={styles.pmf} aria-labelledby="pmf-title">
    <div className={styles.tabs} aria-hidden="true"><i /><i /><i /></div>
    <p className={region.register}>[03.B] SaferData / Discovery</p>
    <h2 id="pmf-title"><PortfolioLink href={gcmPmfHref}>Product Market Fit…<br />with no product</PortfolioLink></h2>
    <p className={styles.pmfSummary}>Explore the need before defining the product.</p>
    {/* Reuse the published prototype and permanently redacted market export from /work/pmf. */}
    <PortfolioLink href={gcmPmfHref} className={styles.pmfPreview} data-pmf-board-preview aria-label="Explore discovery through user research and market analysis">
      <span className={styles.pmfEvidence}>
        <span className={styles.pmfResearchSheet}>
          <span className={styles.pmfEvidenceLabel}>User research</span>
          <Image src={pmfPrototypeFrames[1].src} alt={pmfPrototypeFrames[1].alt} width={pmfPrototypeFrames[1].width} height={pmfPrototypeFrames[1].height} unoptimized />
        </span>
        <span className={styles.pmfMarketSheet}>
          <span className={styles.pmfEvidenceLabel}>Market analysis</span>
          <Image src={pmfAssets.market.src} alt={pmfAssets.market.alt} width={pmfAssets.market.width} height={pmfAssets.market.height} unoptimized />
        </span>
      </span>
      <svg className={styles.pmfInquiryLines} viewBox="0 0 480 54" preserveAspectRatio="none" aria-hidden="true">
        <g><path d="M 120 0 V 12 C 120 34 240 20 240 47" /><path d="M 360 0 V 12 C 360 34 240 20 240 47" /></g>
        <g className={styles.pmfLineDraw}><path pathLength="1" d="M 120 0 V 12 C 120 34 240 20 240 47" /><path pathLength="1" d="M 360 0 V 12 C 360 34 240 20 240 47" /></g>
        <rect x="237" y="44" width="6" height="6" />
      </svg>
      <span className={styles.pmfDirection}>MVP direction</span>
    </PortfolioLink>
    <GcmBoardRelationship origin="pmf" />
    <footer className={styles.pmfFoot}><span>Separate work sample</span><PortfolioLink href={gcmPmfHref}>View project <span>[Open]</span></PortfolioLink></footer>
  </article>;
}
