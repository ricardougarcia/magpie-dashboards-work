import Image from "next/image";
import type { Artifact } from "@/lib/portfolio-types";
import { marketplaceArtifacts as artifacts, marketplaceRecord, marketplaceSections, marketplaceWorkstreams } from "@/data/marketplace";
import { PortfolioShell } from "./portfolio-shell";
import { PortfolioLink } from "./portfolio-link";
import { ProjectReadingRail } from "./project-reading-rail";
import { MarketplaceOpening } from "./marketplace-opening";
import styles from "./marketplace.module.css";

function ArtifactFigure({ artifact, code, type, compact = false }: { artifact: Artifact; code: string; type: string; compact?: boolean }) {
  return <figure id={artifact.id} className={`${styles.artifact} ${compact ? styles.compactArtifact : ""}`} data-marketplace-artifact>
    <a className={styles.artifactMount} href={artifact.src} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size ${artifact.label.toLowerCase()} in a new tab`}>
      <span className={styles.artifactRegister}><span>{code} / {type}</span><span aria-hidden="true">↗</span></span>
      <Image src={artifact.src} alt={artifact.alt} width={artifact.width} height={artifact.height} sizes={compact ? "(max-width: 720px) 100vw, 34vw" : "(max-width: 720px) 100vw, 60vw"} />
    </a>
    <figcaption><strong>{artifact.label}</strong><p>{artifact.caption}</p><span className={styles.inspectHint}>[ Inspect original ↗ ]</span></figcaption>
  </figure>;
}

function SectionHeading({ id, number, label, title, summary }: { id: string; number: string; label: string; title: string; summary: string }) {
  return <header className={styles.sectionHeading}>
    <p className={styles.index}><span>{number}</span> {label}</p>
    <h2 id={`${id}-heading`}>{title}</h2>
    <p className={styles.summary}>{summary}</p>
  </header>;
}

export function MarketplacePage() {
  return <PortfolioShell project={marketplaceRecord}>
    <main id="portfolio-main" className={styles.page} data-marketplace-page>
      <header className={styles.hero}>
        <div className={styles.heroIdentity}>
          <p className={styles.index}>[02] Instructure / EdTech Collective</p>
          <h1 style={{ viewTransitionName: "region-marketplace-title" }}>EdCo<br />Marketplace<span>.</span></h1>
          <p className={styles.heroSubline}>Discovery, trust, and the work between systems.</p>
        </div>
        <div className={styles.heroStory}>
          <span className={styles.seamMark} aria-hidden="true" />
          <p className={styles.heroThesis}>Three repositories.<br />One shared<br className={styles.desktopBreak} /> marketplace.</p>
          <p>Bringing educator and provider needs together required more than a new catalog. It required orchestrating the data, the workflows, and the transition away from legacy experiences.</p>
          <a className={styles.textLink} href="#orchestration">Explore the orchestration <span aria-hidden="true">↓</span></a>
        </div>
      </header>
      <dl className={styles.facts}>
        <div><dt>Role</dt><dd>Product Manager / end-to-end ownership</dd></div>
        <div><dt>Scope</dt><dd>New marketplace / discovery through delivery</dd></div>
        <div><dt>Window</dt><dd>{marketplaceRecord.duration}</dd></div>
      </dl>
      <div className={styles.navigation}><ProjectReadingRail sections={marketplaceSections} /></div>
      <article className={styles.story} aria-label="EdCo Marketplace case study">
        <section id="people" className={styles.section} aria-labelledby="people-heading" data-marketplace-section>
          <SectionHeading id="people" number="01" label="Two perspectives" title="Different needs. A shared destination." summary="Educators needed confidence in the tools they discovered. Providers needed control over how their products appeared—and a useful way to connect." />
          <div className={styles.perspectives}>
            <div><p className={styles.smallLabel}>Educators + administrators</p><h3>Find the right tool.</h3><p>Search across relevant products, understand compatibility and privacy, and find evidence that supports a decision.</p><ul><li>One place to discover</li><li>Trust signals in context</li><li>A clear path to the provider</li></ul></div>
            <div><p className={styles.smallLabel}>Edtech providers</p><h3>Represent it clearly.</h3><p>Keep product information current, present useful assets, and turn interest into a direct conversation.</p><ul><li>Ownership of the listing</li><li>Visibility in the ecosystem</li><li>A path to receive inquiries</li></ul></div>
          </div>
          <p className={styles.bridgeNote}><span aria-hidden="true">+</span> The product had to create value on both sides of the exchange.</p>
        </section>

        <section id="investigation" className={styles.section} aria-labelledby="investigation-heading" data-marketplace-section>
          <SectionHeading id="investigation" number="02" label="Investigation" title="Follow how people discover, evaluate, and connect." summary="Interviews with educators, administrators, and providers informed personas, user stories, and flows. Concept testing sharpened the requirements for discovery, trust signals, and listing management." />
          <div className={styles.researchPair}>
            <ArtifactFigure artifact={artifacts.discovery} code="A" type="Early user flow" />
            <ArtifactFigure artifact={artifacts.provider} code="B" type="Research persona" />
          </div>
          <div className={styles.findings}>
            <div><span className={styles.smallLabel}>Finding / discovery</span><h3>Fragmentation weakened confidence.</h3><p>People searched across separate sources, encountered repeated tools, and struggled to verify whether a product fit their platform and privacy needs.</p></div>
            <div><span className={styles.smallLabel}>Finding / participation</span><h3>Providers needed a reason to participate.</h3><p>Control over listings, richer product information, and a way to receive inquiries made participation more useful to the provider.</p></div>
          </div>
        </section>

        <section id="repositories" className={`${styles.section} ${styles.repositorySection}`} aria-labelledby="repositories-heading" data-marketplace-section>
          <SectionHeading id="repositories" number="03" label="Three independent repositories" title="The work between three and one." summary="These were separate product catalogs and data sources. Unifying the experience meant bringing their information together while working through the legacy transition." />
          <div className={styles.repositories} role="group" aria-label="The three predecessor catalogs">
            <ArtifactFigure artifact={artifacts.ai} code="01" type="Source catalog" compact />
            <ArtifactFigure artifact={artifacts.appCenter} code="02" type="Source catalog" compact />
            <ArtifactFigure artifact={artifacts.library} code="03" type="Source catalog" compact />
          </div>
          <div className={styles.convergence} aria-hidden="true"><span /><span /><span /></div>
          <div className={styles.foundation}><span className={styles.smallLabel}>A shared catalog foundation</span><p>Product information, trust signals, and provider-managed listings.</p><a className={styles.textLink} href="#orchestration">Follow the transition <span aria-hidden="true">↓</span></a></div>
        </section>

        <section id="orchestration" className={styles.section} aria-labelledby="orchestration-heading" data-marketplace-section>
          <SectionHeading id="orchestration" number="04" label="Orchestration + sunsetting" title="The transition was part of the product." summary="I owned the product strategy and delivery, coordinating research, requirements, and the transition across a connected ecosystem. Catalog consolidation, provider workflows, and legacy retirement had to advance together." />
          <div className={styles.workstreams} role="group" aria-label="The orchestration work">
            {marketplaceWorkstreams.map((work) => <div key={work.id} id={work.id} className={styles.workstream}>
              <span className={styles.workstreamNumber}>{work.number}</span><div><p className={styles.smallLabel}>{work.label}</p><h3>{work.title}</h3><p>{work.body}</p><details className={styles.detail}><summary>Read the decision <span aria-hidden="true">+</span></summary><p>{work.detail}</p></details></div>
            </div>)}
          </div>
          <div className={styles.deliveryNote}><span className={styles.smallLabel}>The critical relationship</span><p>Legacy data continued into the shared backend during the sunset period. The Marketplace launched alongside the sunsetting of Edu App Center.</p></div>
          <div className={styles.planningHeading}><h3>Make the requirements inspectable.</h3><p>Two planning artifacts show how the shared foundation informed public discovery and an in-platform concept.</p></div>
          <ArtifactFigure artifact={artifacts.publicPlan} code="C" type="Annotated planning artifact" />
          <details className={`${styles.detail} ${styles.planningDetail}`}><summary>Inspect the in-platform concept <span aria-hidden="true">+</span></summary><ArtifactFigure artifact={artifacts.canvasPlan} code="D" type="Concept / expansion foundation" /></details>
        </section>

        <section id="shared-product" className={`${styles.section} ${styles.solutionSection}`} aria-labelledby="shared-product-heading" data-marketplace-section>
          <SectionHeading id="shared-product" number="05" label="The shared product" title="What that coordination made possible." summary="A public Marketplace for discovery and evaluation, with meaningful trust signals and provider-owned information. One product-data foundation supported the public catalog and the planned in-platform experience." />
          <figure className={styles.productFigure} id={artifacts.catalog.id} data-marketplace-artifact>
            <MarketplaceOpening><a href={artifacts.catalog.src} target="_blank" rel="noopener noreferrer" aria-label="Open full-size Marketplace product presentation in a new tab"><Image src={artifacts.catalog.src} alt={artifacts.catalog.alt} width={artifacts.catalog.width} height={artifacts.catalog.height} sizes="(max-width: 720px) 100vw, 1200px" /></a></MarketplaceOpening>
            <figcaption><span>{artifacts.catalog.caption}</span><a href={artifacts.catalog.src} target="_blank" rel="noopener noreferrer">[ Inspect original ↗ ]</a></figcaption>
          </figure>
          <div className={styles.productDecisions}>
            <div><span className={styles.smallLabel}>Discover</span><h3>A useful place to start.</h3><p>Visual listings and filters help educators find tools by subject, grade, and role.</p></div>
            <div><span className={styles.smallLabel}>Evaluate</span><h3>Trust at a glance.</h3><p>Interoperability, privacy, and efficacy badges bring key signals into the product detail.</p></div>
            <div><span className={styles.smallLabel}>Connect</span><h3>A next step for both sides.</h3><p>Providers can claim and update listings, add assets, and receive inbound lead forms.</p></div>
          </div>
        </section>

        <section id="impact" className={styles.section} aria-labelledby="impact-heading" data-marketplace-section>
          <SectionHeading id="impact" number="06" label="Impact" title="A shared experience. Less fragmented work." summary="The original case reports growth in provider participation and reduced maintenance across the previously separate environments." />
          <dl className={styles.outcomes}>
            <div><dt>Partner-listing growth</dt><dd>102<span>%</span></dd><dd className={styles.outcomeContext}>Reported over five months</dd></div>
            <div><dt>Maintenance effort reduced</dt><dd>20+<span> hr/wk</span></dd><dd className={styles.outcomeContext}>Reported across separate environments</dd></div>
          </dl>
          <details className={styles.detail}><summary>About the reported outcomes <span aria-hidden="true">+</span></summary><p>These figures come from the original published case study. The listing-growth window is five months; the underlying listing counts and time-measurement method are not included in the source record. The outcomes describe the broader delivery effort, not an isolated individual contribution.</p></details>
          <p className={styles.impactNote}>The operational work mattered alongside the interface: bringing information together, aligning provider participation, and carrying the legacy transition through launch.</p>
        </section>

        <section id="reflection" className={`${styles.section} ${styles.reflection}`} aria-labelledby="reflection-heading" data-marketplace-section>
          <SectionHeading id="reflection" number="07" label="Reflection" title="A shared destination needs a coordinated transition." summary="The interface makes the change visible. Research, ownership, and the decisions between systems make it possible." />
          <div className={styles.reflectionPoints}><p><span>01</span> Treat legacy transition and sunsetting as part of the product scope.</p><p><span>02</span> Make educator confidence and provider participation reinforce each other.</p><p><span>03</span> Keep the shared foundation coherent as the number of surfaces grows.</p></div>
        </section>
        <PortfolioLink href="/drawer" className={styles.endReturn} data-board-return><span>Return to the Board</span><span aria-hidden="true">↗</span></PortfolioLink>
      </article>
    </main>
  </PortfolioShell>;
}
