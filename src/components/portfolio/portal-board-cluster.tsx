import Image from "next/image";
import type { BoardEntry } from "@/data/board";
import { ClusterEntrance } from "./cluster-entrance";
import { PortfolioLink } from "./portfolio-link";
import clusters from "./board-clusters.module.css";
import region from "./region.module.css";
import styles from "./portal-board.module.css";

export function PortalBoardCluster({ entry }: { entry: BoardEntry }) {
  return <article id={`region-${entry.id}`} data-region-code="PORTAL" data-board-number={entry.number} data-board-state="ready" className={`${clusters.cluster} ${styles.cluster}`} aria-labelledby="portal-title">
    <header className={clusters.heading}>
      <p className={region.register}>[{entry.number}] Instructure / Provider ecosystem</p>
      <h2 id="portal-title" style={{ viewTransitionName: "region-portal-title" }}><PortfolioLink href="/work/portal" aria-label={entry.title}>{entry.title}<span>.</span></PortfolioLink></h2>
      <p className={clusters.summary}>One place to manage a presence across the ecosystem.</p>
      <div className={clusters.facts}><span>Product Manager</span><span>9 months / 4 delivery phases</span></div>
    </header>
    <ClusterEntrance className={styles.artifacts}>
      <PortfolioLink href="/work/portal" className={styles.preview} aria-label="Explore Partner Portal: the work behind the ecosystem">
        <div className={styles.connections} role="group" aria-label="Partner Portal ecosystem connections">
          <div className={styles.destinations}><span>EdCo Marketplace</span><span>Canvas</span><span>Impact</span><span>LearnPlatform</span></div>
          <svg className={styles.route} viewBox="0 0 400 62" preserveAspectRatio="none" aria-hidden="true">
            <path className={styles.routeBase} d="M 50 2 V 22 H 350 V 2 M 150 2 V 22 M 250 2 V 22 M 200 22 V 60" />
            <path className={styles.routeInk} pathLength="1" d="M 50 2 V 22 H 350 V 2 M 150 2 V 22 M 250 2 V 22 M 200 22 V 60" />
            {[50, 150, 250, 350].map((x) => <circle key={x} cx={x} cy="2" r="2" />)}
          </svg>
        </div>
        <div className={styles.product}>
          <div className={styles.productLabel}><span>Partner Portal</span><span>Product management</span></div>
          <Image src="/portfolio/portal/product.jpg" alt="Original Partner Portal product-management interface for maintaining provider tools and product information." width={1200} height={854} sizes="(max-width: 900px) 90vw, 42vw" />
        </div>
        <span className={styles.caption}><span>Discovery / Delivery / Impact</span><span>Explore the Atlas</span></span>
      </PortfolioLink>
    </ClusterEntrance>
    <footer className={clusters.clusterFoot}><span>R:PORTAL / Connected product work</span><PortfolioLink href="/work/portal">View project <span>[Open]</span></PortfolioLink></footer>
  </article>;
}
