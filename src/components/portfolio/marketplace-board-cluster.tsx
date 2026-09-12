import Image from "next/image";
import type { BoardEntry } from "@/data/board";
import { ClusterEntrance } from "./cluster-entrance";
import { PortfolioLink } from "./portfolio-link";
import clusters from "./board-clusters.module.css";
import region from "./region.module.css";
import styles from "./marketplace-board-cluster.module.css";

export function MarketplaceBoardCluster({ entry }: { entry: BoardEntry }) {
  return <article id={`region-${entry.id}`} data-region-code="MARKETPLACE" data-board-number={entry.number} data-board-state="ready" className={`${clusters.cluster} ${styles.cluster}`} aria-labelledby="marketplace-title">
    <header className={clusters.heading}>
      <p className={region.register}>[{entry.number}] Instructure / EdTech Collective</p>
      <h2 id="marketplace-title" style={{ viewTransitionName: "region-marketplace-title" }}><PortfolioLink href="/work/marketplace" aria-label={entry.title}>{entry.title}<span>.</span></PortfolioLink></h2>
      <p className={clusters.summary}>Three repositories. One shared Marketplace.</p>
      <div className={clusters.facts}><span>Discovery and distribution</span><span>Two audiences</span></div>
    </header>
    <ClusterEntrance className={styles.artifacts}>
      <div className={styles.audiences} role="group" aria-label="Marketplace audiences">
        <span>Educators <small>Find the right tools</small></span>
        <span>Providers <small>Reach the right educators</small></span>
      </div>
      <PortfolioLink href="/work/marketplace" className={styles.catalog} aria-label="Explore EdCo Marketplace through the shared catalog">
        <div className={clusters.sourceLabel}><span>A / Shared Marketplace</span><span>Product presentation</span></div>
        <Image src="/portfolio/marketplace/catalog.png" alt="EdTech Collective Marketplace catalog presentation with product listings, search, discovery filters, and trust badges" width={2842} height={1428} sizes="(max-width: 900px) 100vw, 42vw" />
        <span className={styles.catalogAction}>Explore the shared experience <span>[Open]</span></span>
      </PortfolioLink>
      <div className={styles.orchestration}>
        <svg viewBox="0 0 120 68" aria-hidden="true" className={styles.convergence}>
          <path pathLength="1" d="M 12 4 V 20 H 60 M 60 4 V 60 M 108 4 V 20 H 60" />
          <circle cx="12" cy="4" r="2" /><circle cx="60" cy="4" r="2" /><circle cx="108" cy="4" r="2" /><circle cx="60" cy="60" r="3" />
        </svg>
        <div>
          <p className={clusters.sourceLabel}>B / The work behind the seam</p>
          <h3>Orchestrating the transition.</h3>
          <p>Bringing three independent repositories together meant coordinating the transition and sunsetting legacy experiences.</p>
        </div>
      </div>
    </ClusterEntrance>
    <footer className={clusters.clusterFoot}><span>R:MARKETPLACE / 03 → 01</span><PortfolioLink href="/work/marketplace">View project <span>[Open]</span></PortfolioLink></footer>
  </article>;
}
