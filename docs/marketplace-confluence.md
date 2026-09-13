# Marketplace: Catalog Confluence

September 13, 2026 · UAT implementation record. **Owner aesthetic acceptance is pending. Production is untouched by this work.**

## Diagnosis and authority

The previous page exposed useful evidence without establishing a focal hierarchy. Similar artifact weighting and repeated actions produced density without a distinctive interaction. Functional fixes did not establish design quality.

Catalog Confluence is the agent's working recommendation after an optional direction-selection question, not an owner-selected aesthetic. One source original dominates; surrounding frames register into a shared-product presentation; originals invite inspection. Research, delivery, and impact then vary composition and density.

Guidance is separate: [Portfolio proposal/context draft, PR #31](https://github.com/ricardougarcia/magpie-dashboards-work/pull/31), and the September 13 local working draft's `README.md` and `motion-study.md` under `docs/design/marketplace-experience-direction`. The latter are outside this checkout, not represented as merged files.

Impeccable's document workflow was applied as an incumbent comparison. The proposal's `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json` retain approved Magpie/Board/CCP authority and exclude Marketplace. Shared paper, graphite, Sans/Mono roles, cursor, and source preservation remain applicable. Marketplace-specific sizing, breakpoints and motion are surface extensions; they do not redefine those files or F01–F18. H01–H05 remain reference observations. No global guidance or installed skill was rewritten.

## Actual choreography

Source: [confluence component](../src/components/portfolio/marketplace-confluence.tsx) and [styles](../src/components/portfolio/marketplace-confluence.module.css).

- Choreography requires **≥1000px width, ≥760px height**, and no reduced-motion preference. The stage sticks **24px** from the top. Section minimum height is measured stage height plus **70vh**, supplying native scroll travel without wheel interception.
- Progress uses section position and section-minus-stage height. From **20–60%**, frame separation contracts **28px→0** and line opacity **1→.35**. From **60–85%**, a straight top-to-bottom clip reveals the product. A signal line follows its boundary. Caption and keyboard/assistive reading layer switch at **65% of reveal**.
- During a partial reveal, pointer access follows visible clipped originals. Product becomes `inert` only at zero reveal; source becomes `inert` only at full reveal. Inactive image anchors receive `tabIndex=-1` and `aria-hidden=true`. Focus within either reading layer holds that layer fully visible; an open dialog suspends scene painting.
- Ordinary source-link activation selects its original; modified activation retains native file navigation. Manual source/product selection lasts until scroll moves **>40px**. Current-product state clears the source-current indicator and marks the product control. Geometry follows present progress without queued playback.
- Artifact hashes disable choreography and select their source. Two animation frames allow selection/layout to settle before scrolling to the artifact; current-hash/disposal checks and cancellation prevent stale navigation.
- Hover, visible focus and source selection construct registration strokes over **420ms**, `cubic-bezier(.22,1,.36,1)`, with an **80ms** inner-stroke delay. These are implementation values, not Heron measurements.
- The native evidence disclosure contracts its marker to **.65 scale** and settles its note over **650ms**, from **6px** displacement and **.55 opacity**. Text remains open. Close/Escape dismiss and return focus to the summary.

## Responsive reading and inspection

Without choreography, the selected source and shared product remain in normal flow, without a sticky runway or reveal clipping. At **≤600px**, the source artifact visually precedes stacked source controls; controls retain **44px** minimum height. Reduced motion also removes stroke/marker transitions and note animation. Removing the page's opaque background exposes inherited graph paper. The existing Coordinate Cursor remains unchanged.

[Image inspection](../src/components/portfolio/marketplace-artifact.tsx) uses a native modal with fit/actual-size views, dimensions, original-file access and load-failure fallback. Its inner paper reveals from the trigger rectangle intersected with dialog bounds to full visibility over **360ms**, `cubic-bezier(.22,1,.36,1)`, opacity **.75→1**. Original image dimensions do not animate. Close sits outside animated paper and receives immediate focus. Reduced motion or unavailable animation opens immediately. Close, reopen, unmount, or interaction/focus inside the paper cancels the reveal. Escape, Close and outside press-and-release dismiss; focus returns to the image trigger.

## Reference differences and critique

The straight clip differs from Heron's irregular material reveal; the moving line differs from its near-steady opposite-column handoff. Hover draws registration marks rather than distinct illustrative diagrams. H03 directional pixel acquisition is not implemented. These differences remain documented rather than silently repaired into global rules.

Impeccable must judge focal hierarchy, meaningful registration, settled inspection, visible grid, spacing, caption continuity, and phone density from rendered motion. Passing interaction checks does not establish satisfactory pacing or owner acceptance.

## Evidence and verification

Follow [the source record](edco-marketplace.md): persona is synthesis; public/Canvas plans are planning; only Edu App Center is explicitly sunset. Retain qualifications for 102% growth, 20+ hours/week and “7-month sample.” Never imply screenshot morphing or record-level migration.

**Final local checks passed:** `pnpm check` completed with 201 tests across 24 files, data validation (45 items, six lanes), lint, TypeScript and production build. The final browser report passed at 1440, 820, 390 and 320px widths with zero runtime errors; additional partial-click/focus/hash checks passed. Independent engineering review found no P0–P2 issues. Visual review's current-state cue finding was resolved within its reviewed scope. Evidence archive destination: `GANT/verification/marketplace-confluence-2026-09-13`, outside the repository. The release PR must record the exact revision. **Hosted preview/UAT verification and owner aesthetic acceptance remain pending.**
