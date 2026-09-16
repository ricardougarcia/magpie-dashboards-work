import type { BoardEntry } from "@/data/board";
import { gcmPmfHref } from "@/data/gcm";
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
    <h2 id="pmf-title"><a href={gcmPmfHref}>Product Market Fit…<br />with no product</a></h2>
    <p className={styles.pmfSummary}>Explore the need before defining the product.</p>
    <GcmBoardRelationship origin="pmf" />
    <footer className={styles.pmfFoot}><span>Separate work sample</span><a href={gcmPmfHref}>Original case study <span>[Open]</span></a></footer>
  </article>;
}
