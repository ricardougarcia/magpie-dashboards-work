# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Hiring managers are the primary audience; recruiters also need a useful first impression without reading a long case study. Interested visitors can inspect the evidence and product reasoning in more depth. Rico Garcia is the owner and author; his protected editing tools serve a different task from the public Portfolio.

## Product Purpose

Present Rico's product leadership through real work: scope, contribution, investigation, decisions, outcomes, and reflection. Expand the existing Magpie sample into a Portfolio that eventually replaces the older Wix site and holds the broader body of work and résumé.

Success means a visitor can understand what Rico contributed and why it mattered, inspect supporting artifacts, move between the overview and a Project, and retain their place. No quantitative conversion target or visitor tracking requirement has been established.

## Positioning

An authored Board of product work gives each Project its own recognizable presentation while exposing the underlying evidence and decisions. The Portfolio is a presentation of work, not a general-purpose planning, diagramming, or project-management tool.

## Operating Context

The Board at `/drawer` is the intended overview and landing experience. The root `/` currently remains the original Magpie sample. CCP has a direct route at `/work/ccp`. Visitors use native links, page scrolling, section navigation, and explicit inspection controls. Direct Project entry must remain understandable.

The approved Board uses an open sheet with authored artifact clusters and ordinary vertical scrolling. Rico explicitly rejected Miro-style pan/zoom interaction for the current direction. “Board” does not imply a canvas editor.

## Capabilities and Constraints

- Approved design references: the Magpie work sample, Board through PR #29, and CCP through PR #28. Rico reaffirmed these approvals during the September 12 context reconstruction.
- EdCo Marketplace is present in newer UAT code but has not received owner design review. Its design and implementation choices are excluded from the reusable design context until Rico reviews them.
- The approved Board has six ordered areas: Magpie, EdTech Marketplace, GCM, LTI, Partner Portal, Customer Created Products. Two were authored and four reserved at the approved Board baseline. Current UAT inventory can differ; do not interpret presence in code as design approval.
- Board numbers and case-study numbers are independent. Preserve stable Project/Artifact IDs and source-linked crop relationships.
- Present source-reported outcomes with appropriate attribution. Do not invent source evidence, metrics, causal claims, research, relationships, or shipped functionality.
- Existing Magpie data and editing behavior are outside ordinary Portfolio design scope. Read public data without writing it to validate a design.
- Use the existing Next.js/React stack, repository, and Vercel project. Preserve the UAT/production workflow in [AGENTS.md](AGENTS.md). Production release requires Rico's explicit request. Never publish in Wix.

## Brand Commitments

The existing Portfolio identity and named interactions are intentional. Each sample has its own design signature within the shared identity. Preserve the approved Magpie reference and the later Board/CCP decisions. Read [DESIGN.md](DESIGN.md) for visual rules and [the implementation catalog](docs/portfolio-context.md) before changing a named behavior.

Use clear, direct, evidence-grounded language. Explain Rico's contribution without promotional claims. Preserve Board, Region, Project, Artifact, and the original Magpie panel terminology with their specific meanings.

## Evidence on Hand

- [Portfolio context v2](docs/portfolio-context.md): reconstructed direction and 18 named implementation profiles with exact parameters.
- [Design history](docs/portfolio-design-history.md): owner corrections, merged changes, and superseded guidance.
- [Evidence manifest](docs/portfolio-context-evidence.json): approved baseline, audited head, source hashes, and evidence scope.
- [Archived September 7 vision](docs/archive/portfolio-vision-2026-09-07.md): historical source; its phase descriptions and older values are not current authority.
- [CCP source records](src/data/portfolio.ts) and original PNGs under `public/portfolio/ccp`.
- Magpie's [authored source documents](docs/source/magpie-dashboards-timeline-handover.md), [checked-in seed](src/data/timeline.seed.json), and existing persisted public data. Board excerpt and live timeline are different data paths.

CCP contractor-hour sources conflict and its measurement window is unavailable. Preserve those internal limitations without reintroducing an owner-rejected clause into visitor copy. The catalog contains the specific evidence qualifications.

## Product Principles

1. Let genuine work and supporting evidence lead the experience.
2. Make contribution and judgment understandable at a glance, with deeper explanation available.
3. Keep each Project independently understandable and connected to a clear overview.
4. Give Projects distinct signatures while preserving shared identity and interaction conventions.
5. Keep future ideas, source interpretations, approved designs, and implemented capabilities distinguishable.

## Accessibility & Inclusion

Preserve keyboard, touch, native scrolling, readable source artifacts, explicit controls, and reduced-motion alternatives. Hover cannot be the only route to important information. Retain visible focus and understandable direct links. Inspect interruption, reversal, and settled anchor geometry when changing motion. A historical automated check is not proof of current physical-device acceptance or complete accessibility conformance.

## Open Decisions

Question-led Board rearrangement, Underdrawing, and an exportable visitor-journey drawing/PDF were future concepts in the older vision. Their current disposition awaits Rico's answer; none is an implemented requirement. A future spatial concept does not supersede the later rejection of Miro-style pan/zoom.

Public launch, domain migration, résumé placement, final indexing, and the remaining case-study inventory are not resolved by this context asset. Impeccable's build-path preference belongs only in its configuration after the owner chooses it, not in this product record.
