# Board artifact clusters

The `/drawer` work area uses an authored two-column sheet, with ordinary vertical scrolling. It collapses to one column at 900px. The masthead, section 00, paper grid, rulers, coordinate cursor, and hero replacement effect remain in place.

## Placement

Edit `src/data/board.ts` to control the reading sequence. Array order is both DOM and visual order; there is no dense auto-placement, draggable canvas, or independent mobile order.

| Board number | Work | State | Destination |
| --- | --- | --- | --- |
| 01 | Magpie | Published | `/` |
| 02 | EdTech Marketplace | Reserved wireframe | None |
| 03 | GCM | Reserved wireframe | None |
| 04 | LTI | Reserved wireframe | None |
| 05 | Partner Portal | Reserved wireframe | None |
| 06 | Customer Created Products | Published | `/work/ccp` |

Board display numbers are independent of case-study numbers in `src/data/portfolio.ts`. Keep the stable entry IDs when reordering so Board index anchors remain valid. Additional work can be added later; this change publishes only the six requested areas. Reserved areas are explicitly labeled placeholders and do not expose dead project links.

## Source and treatment

- Magpie uses a Board-only SVG excerpt of the engineering lane from `src/data/timeline.seed.json`, laid out with the existing timeline geometry helper. Its detached Completion Dashboard annotation uses that record's existing value statement. This is a source-record preview, not a duplicate interactive timeline. The completed Magpie route continues to load its own live data without any change.
- CCP retains its original images, crop coordinates, A/B/C references, source locator, inspection text, square stochastic mask with opacity settlement, evidence trace, and slight map scale. Its Board wrapper recomposes those elements at smaller dimensions. Entry drawing waits until this later cluster is in view; source images are visible without waiting for an interaction.
- Reserved areas have different blank drafting studies. They are schematic placeholders, not claims about completed product interfaces or final project branding.

All cluster styling is scoped to the Board. The finished Magpie and CCP routes, project content, shared cursor, pixel effect implementation, owner access, data storage, and production environment are unchanged.

## Verification

`pnpm check` covers source-data fidelity, the existing interaction tests, the six-entry sequence, valid destinations, and noninteractive placeholders. Browser review additionally checks responsive dimensions, real image loading, source-trace placement, keyboard and touch inspection, reduced motion, native scroll, and project navigation with Board restoration. Release only through a reviewed PR targeting `uat`.
