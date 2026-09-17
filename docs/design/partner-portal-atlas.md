# Partner Portal: Integrated milestones

Rico selected **02 / Integrated milestones** from the Ecosystem Atlas comparison on September 17, 2026. The contribution, capability, and supporting artifact remain visible together at each milestone. The sole requested amendment to the selected direction was to put **Workflow Map first and selected by default**, followed by **Journey Map**.

This is a Partner Portal extension within the existing Portfolio identity. It uses the shared Portfolio shell, navigation, typography roles, paper and graphite surfaces, signal accents, original artifacts, and restrained inspection behavior. The Atlas composition and motion are scoped to this project. The implementation does not change shared design tokens or establish new app-wide guidance.

## Placement and composition

The project lives at `/work/portal`, with `noindex, nofollow` route metadata. Board region **05 / Partner Portal** links to it through the title, artifact preview, and project link. The Board preview combines an original product interface with the four named ecosystem connections. It uses the existing Board entrance and Portfolio navigation components.

The opening milestone names **EdCo Marketplace, Canvas, Impact, and LearnPlatform**. Selecting a destination identifies its connection to Partner Portal. These connections do not claim a direction of data flow. The original prose mentions five interconnected products, but the original diagram names four destinations; this treatment reproduces those four.

The active milestone places the artifact or capability beside a visible product-work panel on wide layouts and above it on narrow layouts. A desktop connector relates the two surfaces. Contribution copy, phase, and key capabilities are visible before opening “Explore the work.” The detail dialog adds context and access to the original artifact.

| Milestone | Visible product work and delivery coverage |
| --- | --- |
| Ecosystem | Product leadership across nine months, five engineers, one designer, and four delivery phases; coordination of the Marketplace launch and legacy portal retirement. |
| Discovery | Provider and internal interviews, personas, journey and workflow mapping, and prioritization workshops. Research continued during development. Workflow Map is first and initially selected; Journey Map is second. |
| Assets | Phase 1: central asset management, cross-product synchronization, and a maintained product record. |
| Integrate | Phase 2: integration tools, direct partner requests, and asset sharing with end users. |
| Evidence | Phase 2: evidence containers, vetting-resource requests, controlled sharing, and efficacy evidence. |
| Services | Phase 2: monetization options and paid partner services, including ESSA evaluations. |
| Launch | Phase 3: login routes from sunset products, migration, program rebrand, and communications. Phase 4: UI tagging and behavioral reporting, in-app guidance, and support documentation. |
| Impact + demo | The published adoption trajectory, the reported eight most-used new features, full product walkthrough, and closing summary of Rico’s role. |

The copy describes Rico’s product leadership and coordination without attributing every design or engineering task to him. Discovery artifacts are placed beside relevant capabilities as an editorial relationship; their exact creation dates and delivery phases are not established by the original case.

## Source and outcome boundaries

The [asset and claim register](../../public/portfolio/portal/sources.md) records the published case, individual image URLs, project facts, owner-provided business context, and original demo URL. The local images preserve the source material recovered for the approved study; product and impact JPEG copies differ in format from their published PNG references. Inspection includes a link to the full published original.

The impact chart reproduces the following source-reported percentages. The original graph runs from July launch through December and supplies no year.

| Month | MAA | MAU |
| --- | ---: | ---: |
| July launch | 0% | 0% |
| August | 24.68% | 22.95% |
| September | 41.23% | 37.96% |
| October | 47.73% | 44.25% |
| November | 65.91% | 58.72% |
| December | 75% | 65.18% |

MAU means monthly active users. The graph labels its account series Monthly Active Accounts (MAA), while surrounding prose also calls it total accounts. Its account definition and calculation remain unconfirmed. The chart preserves MAA and presents the percentages as reported; it does not infer account counts, a denominator, or a causal effect of individual features. Both series use the graph’s shared launch-zero label.

The case reports eight new features among the application’s most-used, without an independent ranking or quantified adoption for each feature. Paid services, including ESSA evaluations, are owner-provided business context. No revenue amount, conversion rate, or attributed revenue growth is claimed. Phase 4 instrumentation and support are delivered capabilities; the case does not quantify reductions in friction or attrition.

## Interaction and motion

Native page scrolling advances the sticky Atlas stage through eight milestones. The camera, route trace, and active product-work annotation follow that progress. Wheel input remains native. The milestone navigation, minimap, and progress slider provide direct access without requiring playback.

“Play story” advances the remaining sequence over 40 seconds and provides pause and replay. Wheel, touch, pointer, or keyboard input elsewhere interrupts playback; opening an inspection or hiding the document also stops it. The Play/Pause toggle owns its own pause action so its pointer event does not restart playback accidentally.

The operating system’s reduced-motion preference and the local “Less motion” control disable playback and use discrete milestone camera positions. They remove Atlas transitions and work-panel animation while retaining direct milestone access and inspection. Original assets remain accessible without motion.

Discovery uses a tablist with one selected tab. Left/Right arrows cycle the tabs; Home selects Workflow Map and End selects Journey Map. Selection, focus, the displayed artifact, and the panel’s accessible label change together. Inactive milestone surfaces use `inert` so hidden controls do not remain in the interaction order.

Inspection uses a native modal dialog with a Close control, Escape dismissal, background scroll locking, and focus restoration to the opening control. Readers can enlarge an image, scroll within its inspection area, or open the full published original. “Explore the work” opens the contribution details and lets readers continue to the associated source image.

The impact chart supports mouse inspection and deliberate touch selection. Six month buttons provide equivalent keyboard access and display both exact values. Hover changes the visible values without announcing every movement; an explicit selection updates a polite status announcement. December is initially selected. The full product demo opens the original hosted video through an explicit link; the repository does not contain a video copy.

## Implementation references

| Responsibility | Source |
| --- | --- |
| Route and metadata | [src/app/work/portal/page.tsx](../../src/app/work/portal/page.tsx) |
| Board registration and rendering | [src/data/board.ts](../../src/data/board.ts), [portfolio-board.tsx](../../src/components/portfolio/portfolio-board.tsx) |
| Board 05 preview | [portal-board-cluster.tsx](../../src/components/portfolio/portal-board-cluster.tsx), [portal-board.module.css](../../src/components/portfolio/portal-board.module.css) |
| Milestones, tabs, and inspection | [portal-page.tsx](../../src/components/portfolio/portal-page.tsx) |
| Content, asset references, and chart values | [portal-data.ts](../../src/components/portfolio/portal-data.ts) |
| Native scroll and playback | [portal-motion.ts](../../src/components/portfolio/portal-motion.ts) |
| Impact chart and demo | [portal-impact.tsx](../../src/components/portfolio/portal-impact.tsx) |
| Scoped responsive treatment | [portal.module.css](../../src/components/portfolio/portal.module.css) |
| Asset provenance and claim limits | [public/portfolio/portal/sources.md](../../public/portfolio/portal/sources.md) |
| Focused coverage | [portal-page.test.tsx](../../src/components/portfolio/portal-page.test.tsx), [portal-impact.test.tsx](../../src/components/portfolio/portal-impact.test.tsx), [portal-motion.test.tsx](../../src/components/portfolio/portal-motion.test.tsx), [portfolio.test.tsx](../../src/components/portfolio/portfolio.test.tsx) |

The approved comparison was inspected from `/private/tmp/portal-atlas-build/study.html` and `study.js`. The implementation fixes the selected integrated variant; the comparison’s alternative variants are not part of this project route.

## Verification status at documentation handoff

This document was checked against the current implementation, asset register, selected comparison, and focused test source. At handoff, the implementation coordinator reported 470 passing tests across 46 files, passing data-fidelity and lint checks, and successful build compilation; the build’s TypeScript stage was still finishing. Independent source review confirmed that its three findings were resolved. Local browser review covered 1440 × 1000, 390 × 844, and 320 × 664. These sizes identify reviewed configurations, not a claim that every interaction or viewport has been exhaustively verified. Hosted preview confirmation at the committed SHA remained pending.

No UAT deployment had been completed at this handoff. Exact-revision checks, preview and UAT verification, and release evidence belong to the implementation PR under [AGENTS.md](../../AGENTS.md). Selection of the wireframe does not establish owner acceptance of the finished implementation or authorize a production release.

Existing context drift remains outside this documentation change: [docs/board-artifact-clusters.md](../board-artifact-clusters.md) still describes Board 05 as a reserved wireframe. `PRODUCT.md` and `DESIGN.md` are absent from this checkout; this document does not import unmerged context from PR #31 or create global design guidance.
