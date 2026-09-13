import { CoordinateCursor } from "@/components/coordinate-cursor";
import { marketplaceArtifacts as artifacts, marketplaceRecord, marketplaceSections, marketplaceWorkstreams } from "@/data/marketplace";
import { PortfolioShell } from "./portfolio-shell";
import { PortfolioLink } from "./portfolio-link";
import { ProjectReadingRail } from "./project-reading-rail";
import { MarketplaceConfluence } from "./marketplace-confluence";
import { MarketplaceArtifact } from "./marketplace-artifact";
import styles from "./marketplace.module.css";

export function MarketplacePage() {
  return <PortfolioShell project={marketplaceRecord}>
    <main id="portfolio-main" className={styles.page} data-marketplace-page data-gantt-region>
      <CoordinateCursor />
      <header className={styles.hero}>
        <h1 style={{ viewTransitionName: "region-marketplace-title" }}>EdCo Marketplace<span>.</span></h1>
        <div><p>I led product strategy and delivery to bring three separate catalogs into one Marketplace.</p><p className={styles.meta}>Instructure · Product Manager · {marketplaceRecord.duration}</p></div>
      </header>
      <MarketplaceConfluence />
      <div className={styles.navigation}><ProjectReadingRail sections={marketplaceSections} /></div>
      <article className={styles.story} aria-label="EdCo Marketplace case study">
        <section id="investigation" className={styles.research} aria-labelledby="investigation-heading" data-marketplace-section>
          <header className={styles.sectionHeading}><h2 id="investigation-heading">Start with the people<br />on both sides.</h2><p>Interviews and concept testing connected educator confidence with provider participation.</p></header>
          <div id="people" className={styles.researchField}>
            <div className={styles.marginCopy}>
              <h3>Find the right tool.<br />Represent it clearly.</h3>
              <p>Educators needed a useful way to discover, evaluate, and connect. Providers needed control over their listings and a path to receive inquiries.</p>
              <p className={styles.annotation}>The early flow makes that relationship visible: discovery should lead to a meaningful next step.</p>
            </div>
            <MarketplaceArtifact artifact={artifacts.discovery} code="A039" type="Early user flow" />
          </div>
          <div className={styles.researchSecond}>
            <MarketplaceArtifact artifact={artifacts.provider} code="A040" type="Research synthesis" />
            <p>Visibility, ownership, connection.<span>The provider persona brings these needs into the same conversation as discovery and trust. It represents research synthesis, not an individual participant.</span></p>
          </div>
        </section>

        <section id="orchestration" className={styles.delivery} aria-labelledby="orchestration-heading" data-marketplace-section>
          <header className={styles.sectionHeading}><h2 id="orchestration-heading">The work between<br />three and one.</h2><p>Catalog consolidation, provider workflows, and the legacy transition had to advance together.</p></header>
          <div className={styles.deliveryField}>
            <div className={styles.deliveryClaim}><p>The transition<br />was part of<br /><span>the product.</span></p><p>Legacy data continued into the shared backend during the sunset period. The Marketplace launched alongside the sunsetting of Edu App Center.</p></div>
            <div className={styles.workstreams} role="group" aria-label="The orchestration work">
              {marketplaceWorkstreams.map(work => <div key={work.id} id={work.id} className={styles.workstream}>
                <span className={styles.workstreamNumber}>{work.number}</span>
                <div><h3>{work.title}</h3><p>{work.body}</p><details className={styles.detail}><summary>{work.detailLabel}<span aria-hidden="true" /></summary><p>{work.detail}</p></details></div>
              </div>)}
            </div>
          </div>
          <div className={styles.planning}>
            <div className={styles.marginCopy}><h3>Make the requirements inspectable.</h3><p>The public discovery plan connects research themes with structure, priorities, and open questions.</p></div>
            <MarketplaceArtifact artifact={artifacts.publicPlan} code="A044" type="Annotated plan" />
          </div>
          <details className={`${styles.detail} ${styles.concept}`}><summary>Explore the in-platform discovery concept<span aria-hidden="true" /></summary><MarketplaceArtifact artifact={artifacts.canvasPlan} code="A051" type="Concept / planning evidence" /></details>
        </section>

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
    </main>
  </PortfolioShell>;
}
