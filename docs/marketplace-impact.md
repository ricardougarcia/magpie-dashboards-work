# Marketplace Impact: five reported outcomes

## Approval and scope

On September 15, 2026, the owner requested that the final Impact section include all five outcomes from the original portfolio. The owner then corrected the maintenance figure from 20+ to 40+ hours per week and authorized implementation of the proposed treatment. This approval covers the Impact content and compact motion treatment described here. It does not authorize production release or establish all Marketplace aesthetics as a shared Portfolio reference.

The section retains `#impact` and the heading “A shared destination. Less fragmented work.” The five outcomes replace the two-metric treatment, the Discover / Evaluate / Connect recap, and the large closing reflection. In the subsequent balance and motion revision, the owner explicitly requested removal of the entire “About the reported outcomes” disclosure from the page. Its provenance remains in this internal contract. The existing short closing copy and the Board return complete the case study. Catalogs, Research, Delivery, and the archived source assets remain outside this revision.

## Content and provenance

The historical source is the owner's recovered portfolio archive, `portfolio-migration-research-2026-09-06/source-pages/work--marketplace.txt`, under its Impact heading. The archive is retained as source evidence and must not be rewritten to match later corrections. The source selection follows the owner's explicit instruction to restore all five original outcomes; earlier exclusions in this case-study record are superseded for this section.

| Display figure | Outcome | Supporting context and evidence boundary |
| --- | --- | --- |
| #1 | Edtech Marketplace | The original case describes the largest private marketplace of interoperable edtech tools. This is an original reported claim, not an independently verified current ranking. |
| 102% | Partner-listing growth | Reported within five months. Baseline listing counts are not included in the source record. |
| $2M+ | First-year partnership revenue | Reported partnership revenue in the first year. Do not recast it as profit or revenue attributable solely to the Marketplace or one individual's work. |
| +95% | User sentiment | Positive reception among interviewed end users. Do not label this NPS, a 95-point score, a 95% improvement, or a finding about all users. The source does not give the interview sample or method. |
| 40+ hr/wk | Maintenance effort saved | Owner correction on September 15, 2026. The original archive says 20+ hours per week; the authored page uses the corrected 40+ figure. The source record does not include a time-measurement method. |

The page contains no “About the reported outcomes” disclosure or replacement disclosure. This internal record retains attribution to the original published case study, the owner's maintenance correction, and the absence of underlying measurement details. The ranking and sentiment qualifications above remain the source boundaries. The outcomes describe the broader delivery effort rather than an isolated individual contribution; do not infer independent verification or causal measurement.

## Composition and motion

The composition is compact and unboxed, with one common three-column alignment across both desktop rows. The first three outcomes occupy the top row. The remaining two align under the first and second columns. The existing closing copy occupies the lower-right position: “Three catalogs brought together. A stronger foundation for both sides.” This copy remains outside the outcomes' definition list and is not a sixth result. Each outcome has a prominent final figure, a short label, and one supporting line. All five have a clear reading order and remain part of the document. Phone layouts stack the five outcomes vertically, followed by the closing copy, without horizontal overflow. Content can wrap and the section remains in normal document flow; viewport height is not enforced by clipping content.

On first visible arrival, each final figure reveals through a full bottom-up mask, from `inset(100% 0 0 0)` to `inset(0 0 0 0)`, and settles upward by 6px over 420ms. The stagger is 80ms, with `cubic-bezier(.16, 1, .3, 1)`. Labels and supporting lines remain stationary. Each figure plays once per page visit, then stays in its completed state. The figures are never counted up or substituted with temporary values. There is no pinning, looping, hover requirement, or scroll-controlled replay.

Arrival requires an actual intersection ratio of at least 60% for the outcome, with the observer's bottom boundary inset by 48px (`rootMargin: 0px 0px -48px 0px`). The reveal waits for 100ms without a new scroll or relevant visibility change, so anchor travel and the Catalogs handoff can settle. A hidden document, an inert ancestor, or an article opacity below 0.95 must not consume the one-time reveal. Pending outcomes remain eligible when the article becomes visible and interactive. Outcomes that leave the intersection boundary before the reveal are removed from the pending group.

All five outcomes and their complete text are server-rendered and readable without JavaScript. Motion is progressive enhancement. Reduced motion shows the completed composition immediately. Unsupported animation must not suppress a figure. The Board return remains directly accessible by keyboard and touch.

## Release verification

Before the UAT release, record the application checks and exact-preview verification on the release PR. Verify all five figures and supporting lines, the corrected 40+ value, shared desktop column alignment, the closing copy's lower-right position outside the outcomes list, phone stacking, no horizontal overflow, and removal of the entire outcomes disclosure. Verify the visible full-mask entrance after scroll settles, including direct Impact navigation and arrival after the Catalogs handoff; confirm that hidden or inert content cannot consume the reveal. Check reduced motion, keyboard access, Board navigation, and runtime errors. Verify the merged SHA and stable UAT deployment separately. Functional and browser checks do not establish owner acceptance or independently validate the reported outcomes. Production remains outside this release scope.
