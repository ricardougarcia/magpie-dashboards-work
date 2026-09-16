import { CoordinateCursor } from "@/components/coordinate-cursor";
import { marketplaceArtifacts as artifacts, marketplaceRecord, marketplaceSections } from "@/data/marketplace";
import { PortfolioShell } from "./portfolio-shell";
import { PortfolioLink } from "./portfolio-link";
import { MarketplaceConfluence } from "./marketplace-confluence";
import { MarketplaceResearchLens } from "./marketplace-research-lens";
import { MarketplaceDeliveryFocus } from "./marketplace-delivery-focus";
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

        <section id="impact" className={styles.impact} aria-labelledby="impact-heading" data-marketplace-section>
          <div id="shared-product" className={styles.productContext}>
            <h2 id="impact-heading">A shared destination.<br />Less fragmented work.</h2>
            <div><p>A public Marketplace brought discovery, trust signals, and provider-owned information into one experience.</p><p>One product-data foundation supported the public catalog and the planned in-platform experience.</p><a href={`#${artifacts.catalog.id}`} className={styles.textLink}>Revisit the shared Marketplace</a></div>
          </div>
          <div className={styles.productNotes}>
            <p><strong>Discover</strong>Visual listings and filters help educators find tools by subject, grade, and role.</p>
            <p><strong>Evaluate</strong>Interoperability, privacy, and efficacy badges bring key signals into product detail.</p>
            <p><strong>Connect</strong>Providers can claim and update listings, add assets, and receive inbound lead forms.</p>
          </div>
          <dl className={styles.outcomes}>
            <div><dt>Partner-listing growth</dt><dd>102<span>%</span></dd><dd className={styles.outcomeContext}>Reported over five months</dd></div>
            <div><dt>Maintenance effort reduced</dt><dd>20+<span> hr/wk</span></dd><dd className={styles.outcomeContext}>Reported across separate environments</dd></div>
          </dl>
          <details className={styles.detail}><summary>About the reported outcomes<span aria-hidden="true" /></summary><p>These figures come from the original published case study. The underlying listing counts and time-measurement method are not included in the source record. The outcomes describe the broader delivery effort, not an isolated individual contribution.</p></details>
          <div id="reflection" className={styles.reflection}><h3>A shared destination needs<br />a coordinated transition.</h3><p>The interface makes the change visible. Research, ownership, and the decisions between systems make it possible.</p></div>
        </section>
        <PortfolioLink href="/drawer" className={styles.endReturn} data-board-return><span>Return to the Board</span><span>Selected work</span></PortfolioLink>
      </article>
      </MarketplaceConfluence>
    </main>
  </PortfolioShell>;
}
