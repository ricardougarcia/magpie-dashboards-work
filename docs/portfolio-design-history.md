# Portfolio design history and superseded guidance

Reconstructed September 12, 2026 from repository history, PR records, the archived vision, and the owner's Portfolio conversation. Dates in the evidence manifest are UTC. The latest task instruction confirms Magpie, Board, and CCP as approved and excludes unreviewed EdCo Marketplace design.

## Changes that affect future design decisions

| Evidence | Earlier state or proposal | Current approved interpretation |
| --- | --- | --- |
| Original Magpie build; commits `e29f26f`, `c131a36`, `872ff31` | Generic hover card, early pixel fields, earlier cursor/tether behavior | Progressive Telemetry Aperture, separate relationship/tether animations, exact viewport coordinate labels, seeded lane acquisition. Current code is authoritative over the initial build handoff. |
| `2f2591c`, `958fb9c`, `b085928`, `0f1ef28`, `20a7a2c` | Initial Guiding Light and ink experiments | Public Guiding Light focus and the continuous nib/particle/residue implementation. The original handoff's “Guiding Light hidden publicly” instruction is superseded. |
| `665a7dd` → `06a74b2` | Graphite lane-depth experiment | Explicitly reverted. Do not reintroduce that experiment as the established Magpie language. |
| [PR #3](https://github.com/ricardougarcia/magpie-dashboards-work/pull/3) | Lane tiles left uncovered strips and seams | 16×16 tiles cover shared row/column boundaries. Do not apply the later Board square-cell rule to this different implementation. |
| [PR #6](https://github.com/ricardougarcia/magpie-dashboards-work/pull/6), [#7](https://github.com/ricardougarcia/magpie-dashboards-work/pull/7), [#10](https://github.com/ricardougarcia/magpie-dashboards-work/pull/10) | Frame-written panel motion and mobile browser-chrome instability | Native scroll timeline when supported, position fallback, .25 outgoing speed, .15 opacity floor, small-viewport measurement, native readable reduced-motion state. |
| [PR #11](https://github.com/ricardougarcia/magpie-dashboards-work/pull/11), [#12](https://github.com/ricardougarcia/magpie-dashboards-work/pull/12) | Page/timeline bounce | Native scrolling retained with constrained overscroll. The later CCP map exception permits vertical scroll chaining. |
| [PR #14](https://github.com/ricardougarcia/magpie-dashboards-work/pull/14), [#15](https://github.com/ricardougarcia/magpie-dashboards-work/pull/15) | Blank drawer; initial single-Region foundation | Board→Project→Board, genuine CCP originals, normalized source crops, optional detail, direct URLs, and native navigation. Initial letters and composition were later revised. |
| [PR #16](https://github.com/ricardougarcia/magpie-dashboards-work/pull/16) | Early six-square inspection icon | Initial pale Pixel Acquisition and source-located Evidence Trace. The 2.5–8% opacity pass and 120ms mouse dwell are historical, not current. |
| [PR #17](https://github.com/ricardougarcia/magpie-dashboards-work/pull/17) | Bare Board framing | Added ruler/register, dossier treatment, counts, and entry detailing. Later work removed the sheet title block, changed the cursor, and simplified metadata; do not adopt the whole revision wholesale. |
| [PR #18](https://github.com/ricardougarcia/magpie-dashboards-work/pull/18) | A Workflow Map / B Starting point; approximate custom cursor; pale hover | A Starting point / B Workflow Map / C Creation handoff; original CoordinateCursor with full-screen guides; original acquisition lineage; A/B entry followed by source-linked C. |
| [PR #19](https://github.com/ricardougarcia/magpie-dashboards-work/pull/19) | Homogeneous mounts, heavy large type, Board title block, notes interrupting A/B/C | Open artifact sequence, varied mounts, Board title block removed, Portfolio 500 display / 450 metric weights, graphite ink, 1.012 map scale, 2px/700ms B→C trace. Its 900ms acquisition was superseded by #20–21. |
| [PR #20](https://github.com/ricardougarcia/magpie-dashboards-work/pull/20) | Caption/backing changed before the pixel animation | One mask reveals incoming text and backing together. 1150ms stochastic phase, reversible exit, tighter caption padding, Board PanelReplacement from the Sheet coordinates boundary. |
| [PR #21](https://github.com/ricardougarcia/magpie-dashboards-work/pull/21) | Fractional-DPR seams and final mask-removal flash | Integer physical-pixel squares, 180ms smooth fill after acquisition, retained opaque final mask, no further frames once complete. |
| [PR #22](https://github.com/ricardougarcia/magpie-dashboards-work/pull/22) | Static CCP reading/map and unanimated workflows | Reading marker, fluid 900ms camera, workflow replay, original hero replacement, anchor settlement. Workflow drawing was subsequently refined into open handoffs. |
| [PR #23](https://github.com/ricardougarcia/magpie-dashboards-work/pull/23) | Boxed workflows and small arrow glyphs | Graphite open handoffs, one-time traveler/receiver animation, joint/registration details, localized backing motion. Its staggered metric/decision arrangements were later rejected. |
| [PR #24](https://github.com/ricardougarcia/magpie-dashboards-work/pull/24) | Confusing misalignment; unequal creation/matching interaction; click-only map views | Restored aligned figures, decisions, Impact, and Reflection; full-container hover; reciprocal links; map hover/focus preview with click pin; continuous ink across tabs; shared cursor; section takeover and mini-map. |
| [PR #25](https://github.com/ricardougarcia/magpie-dashboards-work/pull/25) | Opaque sections hid the paper grid; mini-map was informational only | Transparent section shells; only content moves and clips; close section labels; reduced bottom spacing; native mini-map section links. |
| [PR #26](https://github.com/ricardougarcia/magpie-dashboards-work/pull/26) | CCP takeover began halfway down the viewport | Takeover begins when the next top boundary reaches the upper third. Other motion values stay distinct from hero replacement. |
| [PR #27](https://github.com/ricardougarcia/magpie-dashboards-work/pull/27) | Map viewport contained vertical scrolling and trapped page navigation | `overscroll-behavior:none auto`: horizontal containment, vertical chaining; existing preview, pin, ink, zoom, and touch remain. |
| [PR #28](https://github.com/ricardougarcia/magpie-dashboards-work/pull/28) | CCP masthead differed from Magpie; original global ink remained near black | CCP reuses Magpie masthead structure with role/company record. UAT global ink and related palette values change to graphite. This does not make all historical dark surface colors identical. |
| Owner's Board concept decisions; [PR #29](https://github.com/ricardougarcia/magpie-dashboards-work/pull/29) | Single CCP Region; eight-sample sketch assumption; Miro-style canvas exploration | True pan/zoom canvas rejected. Authored two-column artifact clusters selected; six specific positions; different Project treatments; honest reserved studies; approved Magpie/CCP detailed pages preserved. |

## Owner corrections that must remain explicit

- The original pointer must be reused accurately: X/Y formatting, viewport coordinates, offsets, and full-screen guides matter.
- Starting point is A. Workflow Map is B. Creation handoff is C and must point to its actual source in B.
- Board pixels must be small complete squares. Dissolve must replace current text and backing together, then finish gradually without visible seams.
- Entry lines may draw, but a first glance must not show an empty Board. Later clusters wait until reached; visible evidence never waits for a flourish.
- Large Portfolio text was too heavy. Preserve later weights and the deliberate differentiation from the original Magpie display.
- The architectural composition must still read clearly. CCP's misaligned metrics, decisions, Impact, and Reflection were reversed; variation does not license arbitrary staggering.
- Reduce repetitive small red arrows. CCP uses specific graphite joints, registration marks, and open handoffs. Do not turn this into a universal ban on every existing arrow or line.
- Preserve the opacity treatments the owner liked while restoring alignment.
- Content and source artifacts were to remain intact through the design changes. The explicit measurement-window clause removal is an editorial exception, not evidence that the window became known.
- Keep each Project's own design signature. Shared components do not require identical page composition.
- EdCo Marketplace is not an approved design reference at the time of this reconstruction.

## Historical future concepts

The old vision proposed question-led Board arrangements, Underdrawing, and an exportable editorial record of a visit. Their present disposition is still open. None is implemented in the approved baseline. The old phase labels are not a current delivery plan. The later rejection of a Miro-like canvas must remain visible even if some future connected-Board ideas are retained.

## Reading verification evidence correctly

Prior release records cover the exact revisions they name. Board PR #29 records 159 tests and responsive/interaction checks; CCP PR #28 records 157 tests and its scoped hosted checks. These are historical evidence, not new checks run for this documentation. Screenshots examined during reconstruction cover the approved CCP masthead and compact Board cluster. They illustrate those surfaces; they do not prove every animation or current deployment state.

Owner design approval for Magpie/Board/CCP comes from Rico's instruction in this task. Physical-device acceptance and future implementation verification remain separate. This package introduces no application behavior changes.
