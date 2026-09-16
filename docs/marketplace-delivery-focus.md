# Marketplace Delivery: One focused workstream

## Approved scope

The owner approved the focused-workstream wireframe and its hover revision on September 15, 2026. The local reference is `delivery-focused-hover.html` in the thread's visualization directory. This is the selected Delivery design, not an approval of every Marketplace surface as a shared Portfolio reference. The release PR records verification of the implemented revision separately.

Delivery retains `#orchestration`, the heading “The work between three and one,” the transition statement, and the existing source wording. The compact left column carries the transition context and the inspectable public discovery plan (A044). The right column contains the four workstream titles and a stable reading tray:

| Index | Workstream | Tray label |
| --- | --- | --- |
| A | Bring the catalog together. | Data + publishing |
| B | Coordinate the moving parts. | Discovery + delivery |
| C | Carry the data through. | Transition + continuity |
| D | Sunset Edu App Center. | Sunsetting + operations |

The in-platform discovery concept (A051) opens directly into image inspection from its compact text control. Captions and original image inspection retain the distinction between exploratory concepts and shipped behavior. The claim about retiring Edu App Center does not establish that all source catalogs were retired. No copy, outcome, image, or research finding is invented by this change.

## Interaction contract

- A is the initial selected workstream. Hovering a desktop index item for 120 ms selects its reading tray without requiring a click. Mouse and hover-capable pen input receive this enhancement; touch remains activation-based.
- Leaving an item cancels its pending hover. Moving into the tray keeps the selected content visible. Native scrolling, keyboard or touch input, viewport/input-mode changes, and unmount cancel pending selection.
- Keyboard focus and click/tap select immediately. Re-activating the selected item does not restart its animation or collapse its content. Selection does not move keyboard focus.
- The tray reveals with a 380 ms transition: opacity .3 to 1, an 8 px horizontal translation, and a right-side inset mask of 12% resolving to zero. The index bracket follows the selection over 650 ms. Both use `cubic-bezier(.16, 1, .3, 1)`.
- The tray is the primary workstream reading area, such as “A Data + publishing.” Its nested supporting disclosure stays manually expandable. Hover does not open that extra layer. Manual expansion animates height over 350 ms, with a 180 ms body fade after 70 ms; interrupted motion resolves to the latest requested state.
- Rapid selection cancels stale motion. Reduced motion preserves selection and content, while removing spatial animation and settling any running transition.
- The four existing workstream hashes remain usable. Direct entry and hash changes activate the matching tray.

This section uses native page flow. It has no scroll hold, playback control, progress slider, device selector, or automatic demonstration in the deployed page. Those controls belonged only to the wireframe.

## Responsive and fallback behavior

On narrow screens, the reading order is the heading and transition statement, workstream index and tray, then planning evidence. DOM and visual reading order agree. Tapping a workstream brings the workspace below the page navigation so its selected tray can be read. Keyboard focus and desktop hover do not force a scroll. The composition can extend below a short or narrow viewport; text and touch targets are not reduced to force a single-screen fit.

Before hydration or without JavaScript, all four workstream bodies and their native disclosures remain available. Enhanced selection hides inactive trays only after initialization. Original artifact links remain usable without JavaScript. Existing Catalog Confluence, the Research lens, Impact, authentication, data, and environment configuration are outside this revision.

## Release evidence

Required checks include content-preserving SSR, hover intent and cancellation, keyboard/touch selection, persistence while moving into the tray, same-item activation, rapid changes, deep links, reduced motion, responsive geometry and reading order, original image inspection, runtime errors, and the exact deployed UAT revision. The PR distinguishes local tests, rendered browser checks, and owner review. Production requires a separate explicit release request.
