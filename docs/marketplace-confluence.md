# Marketplace: Catalog Confluence

September 13, 2026 · Implementation record for UAT review. **The owner approved the held catalog sequence and Catalogs-to-Research prototype. Full-page aesthetic acceptance remains pending. Production is outside this release scope.**

## Diagnosis and authority

The first Confluence revision improved hierarchy but let the opening move upward before every original had been seen. It also exposed section navigation before Research. The owner requested one held opening: scroll through all four images, then carry the word “catalogs” into the navigation as Research replaces the scene. The owner reviewed the interactive `catalogs-to-research.html` progress study and explicitly approved proceeding on September 13.

That approval covers this sequence and prototype, including the mobile reading alternative. It does not approve every Marketplace aesthetic choice or make Marketplace a shared Portfolio reference. Research, delivery, impact, factual qualifications, and original assets remain intact.

Guidance remains separate: [Portfolio proposal/context draft, PR #31](https://github.com/ricardougarcia/magpie-dashboards-work/pull/31), and the local working draft's `README.md` and `motion-study.md` under `docs/design/marketplace-experience-direction`. Those draft files are outside this checkout, not represented as merged files.

The Impeccable document comparison preserves the approved Magpie/Board/CCP authority in that proposal's `PRODUCT.md`, `DESIGN.md`, and `.impeccable/design.json`. Shared paper, graphite, Sans/Mono roles, graph paper, cursor, and source preservation still apply. This page's sequence, fit checks, and pinned masthead are scoped extensions, not changes to F01–F18 or installed skill rules. H01–H05 remain reference observations.

## The held sequence

Sources: [timeline](../src/components/portfolio/marketplace-sequence.ts), [controller](../src/components/portfolio/marketplace-confluence.tsx), [scene styles](../src/components/portfolio/marketplace-confluence.module.css), and [page integration](../src/components/portfolio/marketplace-page.tsx).

The masthead stays at the viewport top. A single stage holds the intro, catalog heading, selected original, source controls, and description beneath it. Native document scrolling drives one reversible progress value; it does not intercept wheel or touch input. Stopping scroll stops the authored transition. These intervals are percentages of that sequence, not elapsed animation durations:

| Progress | Visible change |
| --- | --- |
| 0–14% | Hold Emerging AI Marketplace. |
| 14–22% | Reveal Edu App Center from top to bottom. |
| 22–36% | Hold Edu App Center. |
| 36–44% | Reveal LearnCommunity Library. |
| 44–58% | Hold LearnCommunity Library. |
| 58–66% | Reveal the shared Marketplace. |
| 66–76% | Hold the shared Marketplace. |
| 76–96% | Transfer “catalogs” to the navigation and replace the opening with Research. |
| 96–100% | Hold the settled Research view before ordinary page movement resumes. |

Each reveal clips the incoming original within the same frame. The signal line tracks its boundary. Selection and caption change at the reveal midpoint; caption opacity decreases to .45 midway and returns to 1. Registration frames contract from 28px separation to zero over 58–72%, with line opacity 1→.35. Original pixels do not morph into another product or imply a migration sequence.

## Catalogs becomes navigation

From 76–96%, an assistive-hidden copy of the heading word travels to the measured Catalogs label position and shrinks toward its font size. A final blend over 92–96% resolves to the real navigation label and its exact type. The semantic heading and native navigation remain separate, without duplicate reading content.

The remaining opening fades over 76–88%. Navigation emerges over 83–94%; Research becomes current at 84%. Research arrives over 84–96%, fading in and settling from 24px below its resting position. These ramps use `t²(3−2t)` easing against scroll progress. The navigation has no top or bottom rule and remains sticky beneath the masthead through the article.

The existing Research/Delivery/Impact article appears once in the DOM. During the held scene it occupies the stage's reading layer. After release, that same content continues down the page; a nonsemantic spacer reserves its remaining height, `max(0, reading height − stage height)`. No duplicate Research preview or rasterized page stands in for the real content.

## Fit and functional alternatives

Available stage height is the smaller of the stable `100svh` probe and visual viewport, minus the measured masthead. Enhancement requires a positive opening height that fits with at least 12px spare space, no reduced-motion preference, and no catalog-artifact hash. At widths below 720px it additionally requires portrait orientation and at least 660px of stage height; wider screens require at least 540px. A breakpoint alone does not establish fit.

Native scroll travel is 2.5 stage heights below 720px and 2.8 otherwise. The runway reserves stage height plus travel. The continuation spacer accounts for the rest of the article. Resize, font loading, disclosure changes, and viewport changes trigger measurement; mode changes attempt to retain the current original or article position.

A fitting phone uses a compact heading, image and caption, a two-column source control group, and Continue to Research. Controls retain 44px minimum targets. Short screens, narrow landscape, enlarged content that fails the fit check, reduced motion, and catalog-artifact hashes use normal flow. **All four originals and their captions are server-rendered and readable in the static/no-JavaScript alternative.** Reduced motion also removes drawn-control and note transitions.

Source choices move to sequence stops at 0%, 22%, 44%, and 66%, or to the corresponding in-flow original. Modified clicks retain native original-file navigation. Continue to Research skips the held sequence. Section links retain real hash destinations; artifact navigation remeasures and settles across two animation frames, checks the current hash, and cancels stale work. History changes use the same landing logic.

During a wipe, pointer inspection follows the visible clipped image. Only the selected image link is in the keyboard reading order. Keyboard focus in an original holds that original; focus in the note holds the product; focus in the reading content reveals Research. Hidden frames and unavailable reading layers are inert. An open inspection dialog suspends sequence painting. Navigation and Continue activation transfer focus to the destination control without a second scroll.

## Retained inspection and detail

Original-image inspection retains its native modal, fit/actual-size views, dimensions, file link, error fallback, and focus return. Its inner paper reveals from the trigger rectangle over 360ms, `cubic-bezier(.22,1,.36,1)`, opacity .75→1; original dimensions do not animate. Reduced motion opens immediately. Close remains outside the animated paper and receives focus. Close, reopen, unmount, and paper interaction cancel the reveal. Escape, Close, and outside press-and-release dismiss.

Source registration strokes draw over 420ms with the same easing and an 80ms inner-stroke delay. The native evidence note contracts its marker to .65 scale and settles over 650ms from 6px/.55 opacity; it stays open until dismissed. These are authored implementation values, not measured Heron timings.

The straight wipe differs from Heron's irregular material reveal. The word handoff adapts a narrative relationship to Marketplace's own content. H03 directional pixel acquisition is not implemented. Impeccable must assess the actual moving sequence, continuity, spacing, and phone fit; functional checks alone do not establish satisfactory pacing.

## Evidence and verification

Follow [the source record](edco-marketplace.md): persona is synthesis; public/Canvas plans are planning; only Edu App Center is explicitly sunset. Retain the qualifications for 102% growth, 20+ hours/week, and “7-month sample.” The timeline is a presentation order, not evidence of an exact operational cutover.

**Checks for this revision are pending at document authoring.** Prior Confluence checks do not validate this replacement. The final release PR must record the exact reviewed head, full application checks, rendered desktop/mobile/reduced-motion and keyboard behavior, forward/reverse scroll, resize/hash/history continuity, inspection, and exact preview and merged-UAT deployment verification. Owner review of the implemented pacing remains distinct from approval of the prototype. Production release requires separate authorization.
