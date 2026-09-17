import Image from "next/image";
import type { BoardEntry } from "@/data/board";
import { ltiAssets, ltiRecord } from "@/data/lti";
import { ClusterEntrance } from "./cluster-entrance";
import { PortfolioLink } from "./portfolio-link";
import clusters from "./board-clusters.module.css";
import region from "./region.module.css";
import styles from "./lti-board.module.css";

export function LtiBoardCluster({ entry }: { entry: BoardEntry }) {
  const plan = ltiAssets.planning;
  return <article id={`region-${entry.id}`} data-region-code="LTI" data-board-number={entry.number} data-board-state="ready" className={`${clusters.cluster} ${styles.cluster}`} aria-labelledby="lti-title">
    <header className={clusters.heading}>
      <p className={region.register}>[{entry.number}] {ltiRecord.organization} / Interoperability</p>
      <h2 id="lti-title" style={{ viewTransitionName: "region-lti-title" }}><PortfolioLink href="/work/lti" aria-label={entry.title}>{entry.title}<span>.</span></PortfolioLink></h2>
      <p className={clusters.summary}>An integration is also a release.</p>
      <div className={clusters.facts}><span>{ltiRecord.role}</span><span>Three connected workstreams</span></div>
    </header>
    <ClusterEntrance className={styles.artifacts}>
      <PortfolioLink href="/work/lti" className={styles.preview} aria-label="Explore LTI: three connected workstreams">
        <div className={styles.workstreams} role="group" aria-label="LTI delivery workstreams">
          <span className={styles.workstream}>Integration<span className={styles.contact} aria-hidden="true" /></span>
          <span className={styles.workstream}>Provider experience<span className={styles.contact} aria-hidden="true" /></span>
          <span className={styles.workstream}>Marketplace</span>
        </div>
        <div className={styles.plan}>
          <Image src={plan.src} alt={plan.alt} width={plan.width} height={plan.height} sizes="(max-width: 900px) 100vw, 42vw" />
        </div>
        <span className={styles.caption}><span>Original process &amp; timeline</span><span>[Explore]</span></span>
      </PortfolioLink>
    </ClusterEntrance>
    <footer className={clusters.clusterFoot}><span>R:LTI / Connected delivery</span><PortfolioLink href="/work/lti">View project <span>[Open]</span></PortfolioLink></footer>
  </article>;
}
