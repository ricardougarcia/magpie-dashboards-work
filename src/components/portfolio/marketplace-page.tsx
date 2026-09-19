import { CoordinateCursor } from "@/components/coordinate-cursor";
import { marketplaceRecord, marketplaceSections } from "@/data/marketplace";
import { PortfolioShell } from "./portfolio-shell";
import { PortfolioLink } from "./portfolio-link";
import { MarketplaceConfluence } from "./marketplace-confluence";
import { MarketplaceResearchLens } from "./marketplace-research-lens";
import { MarketplaceDeliveryFocus } from "./marketplace-delivery-focus";
import { MarketplaceImpact } from "./marketplace-impact";
import styles from "./marketplace.module.css";

export function MarketplacePage() {
  return <PortfolioShell project={marketplaceRecord} pinMasthead>
    <main id="portfolio-main" className={styles.page} data-marketplace-page data-gantt-region>
      <CoordinateCursor />
      <MarketplaceConfluence intro={
        <header className={styles.hero} data-marketplace-intro>
          <h1 style={{ viewTransitionName: "region-marketplace-title" }}>EdCo Marketplace<span>.</span></h1>
          <div><p>I led product strategy and delivery to bring three separate catalogs into one Marketplace.</p><p className={styles.meta}>Instructure · Product Manager · {marketplaceRecord.duration}</p></div>
        </header>
      }>
      <div className={styles.navigation} data-marketplace-navigation>
        <nav aria-label="Project sections" data-marketplace-nav>
          <ol>{marketplaceSections.map((section, index) => <li key={section.id}>
            <a href={`#${section.id}`} data-nav-section={section.id}>
              <span className={styles.navIndex}>{String(index + 1).padStart(2, "0")}</span>
              <span data-catalog-destination={section.id === "repositories" ? "" : undefined}>{section.title}</span>
            </a>
          </li>)}</ol>
        </nav>
      </div>
      <article className={styles.story} aria-label="EdCo Marketplace case study">
        <section id="investigation" className={styles.research} aria-labelledby="investigation-heading" data-marketplace-section>
          <header className={styles.sectionHeading}><h2 id="investigation-heading">Start with the people<br />on both sides.</h2><p>Educators needed confidence in what they found. Providers needed ownership of what others found about them.</p></header>
          <MarketplaceResearchLens />
        </section>

        <MarketplaceDeliveryFocus />

        <MarketplaceImpact />
        <PortfolioLink href="/drawer" className={styles.endReturn} data-board-return><span>Return to the Board</span><span>Selected work</span></PortfolioLink>
      </article>
      </MarketplaceConfluence>
    </main>
  </PortfolioShell>;
}
