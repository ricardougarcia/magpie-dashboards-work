# Portfolio context v2

**Reconstructed:** September 12, 2026. **Purpose:** Durable context for Portfolio design work, including Impeccable. **Approved design baseline:** `201bae93fdc97c030cd1f06ad4e9cba2ac38bdf6` (through PR #29). **Audited UAT head:** `530e1da8636b8d7fb983ec9ad08d46c9b1abc6ca`.

**Owner scope confirmed in this task:** Magpie, the Board, and CCP are approved. EdCo Marketplace design has not been reviewed by Rico and is excluded from the design rules, feature specifications, tokens, motion settings, and surface briefs in this package. Its presence in newer UAT code is not approval.

This record replaces the September 7 vision as the starting point for design decisions. It reconstructs the direction from Rico's subsequent decisions, merged changes, current source, tests, and retained verification evidence. It does not treat the first vision, an abandoned proposal, or a historical screenshot as the current specification.

## How to use this record

Read [PRODUCT.md](../PRODUCT.md) and [DESIGN.md](../DESIGN.md), then this document's relevant feature profile and the matching Impeccable surface brief. Read the referenced implementation before changing a named effect. Preserve its trigger, geometry, timing, interruption, input behavior, and fallback together. “Subtle motion,” “pixel gradient,” and “parallax” are not adequate replacements for these specifications.

The evidence manifest at [portfolio-context-evidence.json](portfolio-context-evidence.json) pins the source revision and file hashes. [Portfolio design history](portfolio-design-history.md) records changes that superseded earlier guidance. The [archived vision](archive/portfolio-vision-2026-09-07.md) remains historical source material.

### Authority and status

1. Rico's latest explicit decision controls intended behavior and task scope.
2. The named implementation at the recorded revision establishes what the application actually does. An implementation can have a gap; its existence does not prove owner acceptance.
3. This context records the relationship between intent and implementation. Conflicts remain visible below.
4. Older documents and screenshots explain history. They do not override later corrections.

**Implemented** means present in the pinned UAT source. **Owner direction** means supported by a recorded user decision. **Future** means an intended possibility with no implementation claim. **Gap** means a difference that needs resolution in separately scoped work. Historical engineering checks are not a new test run or physical-device acceptance.

## Product and experience direction

Rico Garcia's Portfolio presents product leadership and judgment to hiring managers and recruiters. It is intended to replace the older Wix portfolio and eventually hold the broader body of work and résumé. The first impression should communicate scope, contribution, investigation, decisions, and consequences through genuine artifacts and concise annotations. Deeper explanation remains available without being required to understand the work.

The Board is the intended landing experience for all work. It is an authored, native-scrolling open sheet that resembles a workspace. Rico explicitly rejected a Miro-like pan-and-zoom canvas for the current direction because of interaction and delivery risk. Do not infer an infinite canvas, drag layout, zoom controls, or gesture interception from the words “Board,” “spatial,” or “workspace.”

Each work sample has its own **design signature**. Shared identity comes from paper, graphite, typography, annotation, navigation, evidence fidelity, and appropriate shared interactions. Composition, narrative, and signature motion vary by Project. CCP's layout is not a universal case-study template. A uniform card grid, bento arrangement, or compulsory reuse of every effect would erase the intended differences.

The original Magpie work is a completed sample and an important interaction reference. Portfolio work does not authorize a general redesign of it. The later UAT-wide change from `#111311` ink to `#282828` was explicitly requested; that change does not authorize unrelated global styling changes.

### Terminology

| Name | Meaning and scope |
| --- | --- |
| Board | `/drawer`, the authored overview of all selected work. |
| Region / artifact cluster | One Project's recognizable area on the Board. |
| Project / work sample | An independently addressable detailed case. |
| Artifact | Genuine source evidence, including maps, screenshots, research, and planning material. A crop is a detail of an Artifact, not a new original. |
| Design signature | A Project's distinct composition and interaction language within the Portfolio identity. |
| Panel 0–5 / Tri-shelf | Names from the original Magpie sample. Do not rename Board Regions or CCP sections with these terms. |
| Coordinate Cursor | Shared plus cursor, stacked viewport X/Y readout, and contextual full-screen guides. |
| Pixel Acquisition | On the Board, the synchronized stochastic caption dissolve. Magpie's lane acquisition is a related but separate implementation. |
| Evidence Trace | The source-located B-to-C relationship in the CCP Board cluster. |
| Guiding Light | Magpie's categorical focus controls: Learn, Fix, Stabilize, Govern, Grow. The ink trail is their associated pointer treatment, reused on CCP map tabs. |
| Telemetry Aperture | Magpie's hover/selected work-detail surface, distinct from its source-to-aperture tether and item relationship lines. |
| Underdrawing | Earlier future concept for inspecting investigation behind outcomes; not a name for the existing pixel mask. |

## Current surfaces and feature ownership

The approved Board baseline has six Regions: two authored records and four reserved placeholders. The newer audited UAT head includes an unreviewed Marketplace case; that addition is not adopted here. Array order in [the approved board.ts](https://github.com/ricardougarcia/magpie-dashboards-work/blob/201bae93fdc97c030cd1f06ad4e9cba2ac38bdf6/src/data/board.ts) determines both DOM and visual order. Board numbers are independent of case-study numbers: CCP is Board `06`, but its detailed case number remains `01`.

| Board position | Work | Current state / destination | Signature |
| --- | --- | --- | --- |
| 01 | Magpie | Authored; `/` | Timeline excerpt and detached source note on the Board; interactive timeline in the Project. |
| 02 | EdTech Marketplace / EdCo Marketplace | Reserved in approved Board baseline; newer UAT case awaits owner review | No Marketplace design signature is adopted by this context. |
| 03 | GCM | Reserved, no Project destination | `register` drafting study; not approved final product branding. |
| 04 | LTI | Reserved, no Project destination | `bridge` drafting study; not evidence of a delivered interface. |
| 05 | Partner Portal | Reserved, no Project destination | `portal` drafting study; not an interactive preview. |
| 06 | Customer Created Products | Authored; `/work/ccp` | Source-located workflow evidence, graphite handoffs, inspectable decisions. |

Reserved Regions contain no links, buttons, or inputs. The Board's index may link to their on-page Region anchors. “Eight samples” belonged to a wireframe exploration; it is not the current inventory. Adding more samples remains possible.

| Feature | Magpie `/` | Board `/drawer` | CCP |
| --- | --- | --- | --- |
| Plus cursor, X/Y overlay | Yes; guides in timeline | Yes; guides in main area | Yes; guides in main area |
| PanelReplacement | Panel 1 → Panel 2–5 | Masthead + section 00 | Project hero |
| Board Pixel Acquisition | No | Magpie and CCP inspection captions | No |
| 16×16 lane acquisition | Yes | No; excerpt is not the live timeline | No |
| Guiding Light Ink Trail | Guiding Light strip | No | Workflow Map tabs |
| Evidence Trace and 1.012 map scale | No | CCP cluster | No |
| Reading navigation | Timeline controls | Board work index | Left rail; mobile reflow |
| Section takeover / page mini-map | No | No | Yes |
| Workflow handoff traces | No | Source crop only | Yes |

Marketplace is intentionally outside this feature comparison until owner review.

## Visual identity and material

The established direction is editorial systems engineering on paper: precise geometry, graphite, readable Geist typography, technical annotations, and meaningful source relationships. These are explicit project choices. Impeccable's generic warnings about common palettes or mono labels do not authorize replacing them.

### Palette and type boundaries

| Role | Current source value | Scope |
| --- | --- | --- |
| Paper | `#f1efe9` | Shared base |
| Raised paper | `#f8f6f1` | Artifact backing and tonal separation |
| Ink | `#282828` | Current UAT global ink and Portfolio ink |
| Muted text | `#6b6a64` | Secondary text |
| Signal | `#d6452f` | Cursor, focus, source traces, selected emphasis |
| Small signal text | `#bd3e2b` | Portfolio shell's small red headings and labels |
| Global line / strong line | `rgba(40,40,40,.18)` / `.42` | Magpie/global CSS |
| Portfolio line / strong line | `rgba(40,40,40,.16)` / `.36` | Portfolio shell override |
| Graphite | Global `#272a28`; Portfolio `#282828` | Preserve the scoped distinction until deliberately changed |

Geist and Geist Mono are loaded in [layout.tsx](../src/app/layout.tsx). Large Portfolio headings were deliberately lightened: CCP hero uses weight `500`, major metrics `450`. Magpie retains its own large uppercase display role (`670` on the main hero); do not propagate a Portfolio-only weight change into every heading. Metadata and coordinates retain the specific Mono sizes below.

The page grid uses two 1px `rgba(40,40,40,.018)` gradients on a `28px × 28px` repeat. CCP sections remain transparent over that grid. Texture is permitted in the small mounting margins and specific graphite/hatch treatments already implemented. Do not add grain over original image pixels, fake damage, torn edges, or moving paper that makes evidence harder to inspect.

Flat paper is the Portfolio default, not a claim that all Magpie components have no shadows. Magpie's timeline hover and selected detail surfaces have scoped depth treatments. Preserve those exceptions when documenting or refining them.

## Named implementation profiles

### F01 — Coordinate Cursor and viewport guides

**Sources:** [coordinate-cursor.tsx](../src/components/coordinate-cursor.tsx), [globals.css](../src/app/globals.css), [cursor-plus.svg](../public/cursor-plus.svg), [cursor-plus-pick.svg](../public/cursor-plus-pick.svg).

- Default/action assets are 20×20 SVGs with hotspot `(10,10)`. Both use signal-red fill, a 1px paper stroke, and crisp edges. The action plus has longer arms. CSS fallbacks are `crosshair` and `pointer`; text entry retains the text cursor.
- The readout is exactly stacked `X:{rounded clientX}PX` and `Y:{rounded clientY}PX`. Values are viewport CSS pixels, unpadded. No Region code is appended. Do not substitute sheet-relative or page-scroll coordinates.
- Mono `9px`, weight `600`, line-height `1.18`, tracking `-.055em`, 1px row gap; color `rgba(40,40,40,.36)`; fixed `z-index:90`; `pointer-events:none`.
- Default offset is 11px left of the pointer label's width and 11px down. It flips right when `x < 96`, and above when `y > viewportHeight - 48`. Visibility transitions use `140ms ease`.
- Guides span the full viewport at the pointer's X and Y. They are 1px, `rgba(40,40,40,.11)`, centered by `-.5px` translation, fixed at `z-index:70`, with `140ms ease` visibility.
- Only mouse movement updates coordinates. Events are coalesced into one requested frame; mouseleave/window blur hides the overlay. Guides require a `[data-gantt-region]` ancestor. There is no spring or trailing coordinate interpolation.
- Reduced-motion CSS makes transitions immediate; the component does not itself disable the readout. Do not claim it disappears under reduced motion.

### F02 — Board Sheet Registration

**Sources:** [board-registration.tsx](../src/components/portfolio/board-registration.tsx), [board-sheet.module.css](../src/components/portfolio/board-sheet.module.css).

This is separate from F01. Sheet coordinates are rounded, nonnegative, four-digit-padded values. Y is `max(0, -sheet.top)`; width comes from the sheet rectangle. Progress is bounded at 100% using `y / max(1, sheet.height - innerHeight)`.

The sticky register is at `top:0`, `z-index:5`. It combines a 28px coordinate row with a 22px ruler. Fine ticks repeat every 8px; major ticks and labels every 80px. The sheet's maximum width is 1520px. Its inner padding is 28px, 20px at ≤1050px, and 14px at ≤760px. Scroll/resize updates are frame-coalesced; this is not a pan/zoom surface. The removed BOARD / SHEET / REV / ISSUED title block must not be restored as a current requirement.

### F03 — PanelReplacement

**Sources:** [panel-replacement.tsx](../src/components/panel-replacement.tsx), [geometry/state helper](../src/lib/panel-replacement.ts), [implementation notes](panel-replacement.md).

This is a scroll-position function, not a timed entrance. `outgoingSpeed=0.25`; `opacityFloor=0.15`. Start is `max(0, incomingTop - viewportHeight)`. Distance is `max(1, incomingTop - contentTop)`. Default compensation rate is `.75`; outgoing transform is `min(distance, elapsed × .75)`. Progress is shift/distance; opacity is `max(.15, 1-progress)`.

The incoming sheet remains opaque in native document flow. The outgoing content becomes inert only at full replacement. Stopping freezes the state; reverse scrolling retraces the same function. Tall content remains naturally readable before the incoming boundary reaches the viewport. Layout uses a small-viewport measurement (`100svh`), avoiding retiming when mobile browser chrome changes height.

CSS scroll timelines drive visuals when supported; the fallback uses frame-scheduled position updates. There is no wheel interception, timed easing, scroll-direction state, spring, or mandatory snapping. Reduced motion and print restore native positions and full opacity.

Applications differ: Magpie replaces Panel 1 with the Panel 2–5 sheet; the Board replaces the masthead and section 00 from the boundary above Sheet coordinates; CCP replaces its hero with the facts/reading sheet.

`PanelPersistentElement` supports pinned and morph-in-place modes, but no application element uses these tags. Record this as unused infrastructure, not a shipped Portfolio feature.

### F04 — Board Pixel Acquisition / synchronized caption dissolve

**Sources:** [pixel-acquisition.tsx](../src/components/portfolio/pixel-acquisition.tsx), [region-inspection.tsx](../src/components/portfolio/region-inspection.tsx), [region.module.css](../src/components/portfolio/region.module.css). **History:** PRs #18–21, retained by #29.

One canvas-generated mask reveals the incoming **real DOM text and `#282828` backing together**. The resting caption stays underneath. The two paint layers share a stable grid area; both contribute to intrinsic height. The selected semantic text remains available to assistive technology. There is no initial solid fill, immediate visual text swap, blur approximation, or overlay applied after the change.

| Parameter | Exact behavior |
| --- | --- |
| Cell size | Nominal 4 CSS px; `max(1, round(4 × devicePixelRatio))` physical px |
| Backing dimensions | Rounded `bounds.width × DPR` and `bounds.height × DPR` |
| Cell placement | Whole equal squares; floor-sized rows/columns; integer centered insets |
| Stochastic acquisition | 1150ms |
| Completion fill | Additional 180ms; full entry 1330ms |
| Exit | 850ms for a full exit; scaled by remaining phase distance |
| Per-cell delay | Normalized column × 510ms + seeded noise × 190ms |
| Per-cell duration | 190ms + independent seeded noise × 260ms |
| Cell opacity | `floor(progress × 4) / 4` |
| Completion easing | Smoothstep `t²(3−2t)` fills remaining transparency |
| Interruption | Reverse from current acquisition or settling phase; do not restart |
| Completion state | Retain the fully opaque mask; stop scheduling animation frames |

The seeded noise uses the same integer hash family as Magpie lane acquisition. It is not a random CSS gradient. At DPR 1.8, 4 CSS px becomes a 7×7 physical-pixel cell, not 7.2×7.2; this avoids seams. The final fill completes remaining transparency without reducing acquired pixels' opacity. Removing the final mask would reintroduce the compositing change corrected in PR #21.

Current RegionInspection starts immediately on mouse enter; the original 120ms dwell is superseded. Keyboard `:focus-visible`, explicit touch/button toggle, Escape, outside pointer dismissal, and focus departure are supported. Mouse leave dismisses only when focus is outside; touch leave does not dismiss. Explicit inspection takes precedence over entry drawing. Reduced motion switches immediately; no idle acquisition loop exists. Caption padding is 10px desktop / 8px narrow before cluster-specific typography overrides.

### F05 — Magpie lane acquisition

**Sources:** [public-timeline.tsx](../src/components/public-timeline.tsx), [globals.css](../src/app/globals.css). **Do not merge this profile with F04.**

Six seeded fields each contain 256 tiles in a **16×16 grid**, covering lane labels and the future-rail introduction. Tiles stretch to shared row/column boundaries to cover the label. They are not the Board's fixed-size square mask.

- Entry delay: `round(column × 34 + noise × 190)` ms. Entry duration: `round(190 + noise × 260)` ms, with `steps(4,end)`.
- Exit delay: `round((15-column) × 24 + noise × 130)` ms. Exit duration: `round(150 + noise × 170)` ms, with `steps(3,end)`.
- Current sampled tones: `#282828`, `#303030`, `#383838`, `#404040`.
- The CSS keyframe still starts from `rgba(23,25,23,.18)` and settles to **`#171917`**; reduced motion also uses that settled color. This differs from the sampled palette and from the Board's settled `#282828`. Preserve the distinction in descriptions; resolving it is a separate design decision.
- Active lane text changes to raised paper; it is not masked synchronously with replacement prose as in F04.

### F06 — Evidence Trace and source locator

**Sources:** [evidence-region.tsx](../src/components/portfolio/evidence-region.tsx), [CCP Board cluster](../src/components/portfolio/ccp-board-cluster.tsx), [artifact records](../src/data/portfolio.ts).

Current letters are **A Starting point**, **B Workflow Map**, **C Creation handoff**. B is the source of C. B's original is 5780×5060. C uses normalized crop `{x:.30,y:.30,width:.43,height:.30}`; its upper-left source coordinate is `1734,1518` px. Matching & merge is a separate viewer detail `{x:.32,y:.67,width:.48,height:.26}`.

Hover/focus/touch inspection of B or C exposes the crop outline and one orthogonal B→C tether. Desktop routing uses the column gutter; stacked routing uses the sheet margin. The source point uses the crop's left-center in the rendered image; the destination is 22px below C's upper edge. Both ends are 4×4 squares. The B source locator remains useful when the large map is out of view. C is a crop of B, never an independent original or an invented cross-project relationship.

The tether is a 2px signal stroke drawn in **700ms**, easing `[.22,1,.36,1]`. Reduced motion shows the relationship immediately. Geometry follows resize and scroll so it remains attached to the scaled map. The former 350ms draw and decorative C-to-outcome line are superseded.

### F07 — CCP cluster registration entrance

The same EvidenceRegion sequences the entry frames. A draws for **680ms**; B for **820ms**, delayed **90ms**; then the source trace for **700ms**; C's source-anchored frame for **620ms**. All use `[.22,1,.36,1]`.

At ≤760px the sequence waits for the relevant A, B, or C Artifact to enter at intersection threshold `.12`. The current lower Board cluster passes `deferUntilVisible`, so it also waits to be reached on desktop. Images, captions, and resting marks remain visible before/during the sequence. Explicit inspection interrupts entry. Reduced motion resolves immediately. Do not resurrect a blank-first-frame boot sequence.

### F08 — Workflow Map scale on the Board

EvidenceRegion measures the **unscaled mount**. Progress is `clamp((innerHeight - mount.top)/(innerHeight + mount.height),0,1)`. Map scale is `1 + progress × .012`, bounded at **1.012**. The transform origin is `50% 40%`. The transform origin is `50% 40%`. Only the image and its source marker share the transform; the mount does not reflow. Trace endpoints are remeasured. Reduced motion fixes scale at 1. This effect is not the CCP viewer zoom, hero replacement, or section takeover.

### F09 — Artifact clusters and their entrance traces

**Sources:** [board-clusters.tsx](../src/components/portfolio/board-clusters.tsx), [cluster CSS](../src/components/portfolio/board-clusters.module.css), [ClusterEntrance](../src/components/portfolio/cluster-entrance.tsx).

The Board uses two columns, `clamp(40px,5vw,82px)` column gap, and an 80px row gap. At ≤900px it becomes one column with a 58px row gap and 670px maximum width. Array order remains reading order. Inner CCP composition has additional ≤540px handling; do not reduce all responsive changes to one breakpoint.

Magpie's Board image is an SVG excerpt of the checked-in engineering-lane seed, with the Completion Dashboard source note. It is not a duplicate live timeline. Entrance uses intersection threshold `.15`: its source trace draws in **1450ms** with `[.22,1,.36,1]`; work bars animate fill opacity `.2→.4` over **1000ms ease-out**, staggered **23ms** per item. Reserved registration marks draw in **1200ms**. These are one-time enhancements; originals and resting drawings stay readable. Reduced motion removes the animations.

### F10 — Guiding Light Ink Trail

**Sources:** [guiding-light-ink-trail.tsx](../src/components/guiding-light-ink-trail.tsx), [particle and nib functions](../src/lib/guiding-light-ink.ts). **Scope:** Magpie Guiding Light strip and CCP Workflow Map tabs.

This is a continuous, pointer-fed graphite ink surface across a whole control strip. It does not restart at each tab boundary and is not a per-button radial gradient. Core color is `#282828`; residue is `#d6d5d0`. Pointer samples are coalesced, with a 96-sample queue cap. Particle cap is 520; deposition spacing is 5px. Render density is clamped to 1–2× DPR.

- Nib response is `.24` at 60fps, time-adjusted as `1-(1-.24)^min(3,deltaMs/(1000/60))`.
- Advance drips require speed above 72px/s; emission rate is `1.05 + clamp((speed-72)/900)×1.55` per second. Drip radius is `.3–.6` of the stamp radius.
- Particle radius is 15–25px; the pointer-head particle starts at 20px. A particle has 14–18 smoothed radial vertices.
- Lifetime jitter is `.82–1.18`. Core hold is `(500–700ms)×jitter`; fade is `(900–1200ms)×jitter`. Residue starts at `coreHold + coreFade×(.56–.64)` and fades for `(1800–2400ms)×jitter`.
- Core uses cubic-out opacity and shrinks by up to 48%. Residue expands from 1.04 to 1.36 scale. Its local peak is `.35–.45`; compositing adds a `.34` residue multiplier.
- Final compositing uses `blur(1.55px)` for residue and `blur(1.15px)` for core. These values are specific to the ink renderer, not a site-wide blur rule.
- Primary non-touch pointer input drives the effect. Reduced motion disables it. It may continue while the pointer is inside, then until particles expire; do not claim it always stops the instant pointer movement stops. It is not an ambient whole-page animation.

### F11 — Workflow Map preview, pin, camera, and zoom

**Sources:** [artifact-viewer.tsx](../src/components/portfolio/artifact-viewer.tsx), [region.module.css](../src/components/portfolio/region.module.css).

Views are **Overview**, **Creation handoff**, and **Matching & merge**. Mouse/pen hover previews; keyboard-visible focus previews; click, Enter, or touch pins. Priority is keyboard preview → pointer preview → pinned selection. Leaving preview restores the pinned view. The pinned mark and `aria-pressed` describe the pin, while `data-preview` describes the displayed preview.

View changes reset magnification to 1×. Width, left, top, map padding/aspect geometry transition together for **900ms**, easing `cubic-bezier(.22,1,.36,1)`. Zoom controls step from 1× to 4× in integer increments; the scrollable region centers horizontally and resets to its top on view/zoom change. The source locator uses the exact normalized crop.

The viewport is native `overflow:auto`, with hidden scrollbars, `overscroll-behavior:none auto`, and `touch-action:pan-x pan-y pinch-zoom`. At 1×, page scroll passes through. When zoomed, internal scrolling hands vertical movement back to the page at its edges; horizontal overscroll stays contained. No wheel-capture workaround is needed.

Before native anchor navigation measures a destination, running map animations finish, including a same-hash click. Reduced motion removes camera transitions. Source pixels, intrinsic aspect ratio, and full-original links remain intact.

### F12 — Reading index and current-section marker

**Sources:** [project-reading-rail.tsx](../src/components/portfolio/project-reading-rail.tsx), [portfolio.module.css](../src/components/portfolio/portfolio.module.css).

Current-section threshold is `min(160px, innerHeight×.25)`, with a page-end override within 2px so a short last section can become current. The 2×18px signal marker moves with **420ms** `[.22,1,.36,1]`; opacity uses **220ms ease**. `aria-current="location"` is applied to the active native anchor.

CCP has a left rail, sticky at 30px on desktop, reflowing into a two-column in-flow index at ≤760px. The rail is a component with surface-specific layout. Reuse does not require a new Project to copy CCP’s composition.

### F13 — CCP section takeover and stationary paper grid

**Sources:** [project-page-motion.tsx](../src/components/portfolio/project-page-motion.tsx), [ccp.module.css](../src/components/portfolio/ccp.module.css). **History:** PRs #24–26.

Only section **contents** translate and fade. Section shells, top boundaries, anchors, paper grid, and reading rail remain in native flow. Sections are transparent and clip outgoing content with `clip-path:inset(0 -16px)`. The following section starts takeover when its top crosses the **upper third** of the viewport, not the midpoint.

Let `h=innerHeight`, `r=currentSectionRect`, `n=nextSectionRect`. Base progress is `clamp(min(-r.top-80, h/3-n.top)/max(1,h×.5),0,1)`. Shift is `progress×min(120px,h×.16)`; opacity is `1-progress×.28`, giving a .72 floor. No next section means zero progress. A linked detail attenuates progress until it has been read; native anchor clicks reset content transforms before measurement. Focus-visible content remains untransformed and fully opaque.

Top labels sit 18px below the next section boundary, 16px at ≤760px; general bottom padding is 28px. Reflection has its own larger bottom spacing. Reduced motion/print restore zero shift and full opacity. This is not PanelReplacement and must not inherit its .15 opacity floor or .25 speed.

### F14 — CCP Page Mini-map

**Sources:** [project-page-motion.tsx](../src/components/portfolio/project-page-motion.tsx), [mini-map CSS](../src/components/portfolio/project-page-motion.module.css).

This mini-map is navigable, with native links to all six sections, hover/focus labels, and the same current-section threshold as F12. It is not decoration-only and does not replace the main reading index.

Desktop: fixed at left 12px / bottom 18px; 48px width; SVG viewBox 48×150. Document geometry maps into 144 vertical units. Available space below the reading rail sets height between 44 and 150px; below 90px available space, compact mode uses a 10px width. At ≤760px, the visual strip is **8px** wide inside a **20px** interaction area, with 144px height, 4px inset, left 0 / bottom 20px. The small target is an observed implementation constraint, not a new universal accessibility target. Print hides it.

### F15 — CCP workflow handoffs and replay

**Sources:** [workflow-trace.tsx](../src/components/portfolio/workflow-trace.tsx), [workflow-trace.module.css](../src/components/portfolio/workflow-trace.module.css).

Before/after workflows use open graphite connections and 3×3 receiver squares, replacing boxed steps and arrow glyphs. A 6px gap interrupts each connection near its midpoint. Desktop paths are horizontal; ≤760px paths follow the left margin vertically.

The traveler uses `stroke-dasharray:.18 .82`, **760ms** `cubic-bezier(.4,0,.2,1)`. Receiver animation is **850ms ease**, starting **420ms** after each handoff's delay. Handoff delay is `position×580ms`, plus **340ms** from the third handoff onward in the before workflow to emphasize Manual review. These pauses are editorial emphasis, not elapsed operational time.

Entry threshold is `.15`, once per mount. `[Trace workflow]` explicitly replays. Hover near either adjacent step changes route opacity `.22→.7` over **280ms** and emphasizes the receiver. Reduced motion disables traveler/receiver animation while retaining the explanatory workflow. Create locally and Match & merge both link to their corresponding decisions.

### F16 — CCP decision connections and graphite details

**Sources:** [project-surface.tsx](../src/components/portfolio/project-surface.tsx), [ccp.module.css](../src/components/portfolio/ccp.module.css).

Both complete decision containers participate in hover; keyboard focus also resolves their related workflow step. Connections draw in **520ms**, `cubic-bezier(.22,1,.36,1)`, with 1px graphite stroke at .55 opacity and a small signal endpoint. Preserve reciprocal links `new-create ↔ local-creation` and `new-match ↔ global-matching`.

Research figures, decisions, Impact metrics, and Reflection text are aligned. The staggered composition was explicitly reversed. Intentional opacity and paper treatments remain: the default hatch is 132°, 1px ink line per 5px; Approach and Impact backing shifts range from −6 to +6px using `(progress-.5)×12`. The page grid itself does not move.

Keep the smaller named treatments: map registration corners (600ms transform / 400ms opacity), source-link underline (350ms), Impact underline (400ms), Reflection revisit label (220ms opacity / 300ms movement), joint mark (300ms, halves translate 3px inward), and registration mark (350ms, corners resolve from 2px offsets). These are CCP-local controls, not permission for red arrows at every link.

### F17 — Magpie Telemetry Aperture and relationship lines

**Sources:** [telemetry-aperture.tsx](../src/components/telemetry-aperture.tsx), [public-timeline.tsx](../src/components/public-timeline.tsx), [telemetry-tether.ts](../src/lib/telemetry-tether.ts), [orthogonal-connectors.ts](../src/lib/orthogonal-connectors.ts).

Keep three line systems distinct:

| System | Timing / behavior |
| --- | --- |
| Item relationship paths | `350ms` Framer Motion draw; source/target boundaries and stored orthogonal route geometry matter. |
| Item-to-aperture tether | **1700ms**, times `[0,.6,1]`, ease `[.22,1,.36,1]`; fixed viewport layer, 1px signal stroke. |
| Guiding Light tethers | **1700ms**, times `[0,.58,1]`, stagger `index×35ms`; 1.15px signal, butt caps/miter joins. Reduced motion removes the draw and fades opacity from .42 to 0 over 180ms. |

Aperture entrance uses **200ms** `[.22,1,.36,1]`; hover body **140ms**; selected body **180ms** with **50ms** delay; media preview transitions use **140ms**. Hover is temporary, selection pins a work record, and relation focus is distinct from selection. The selected detail offers Overview and Connections. Media preview returns to the previous selected state when dismissed. Do not collapse these into a single “modal animation speed.”

Orthogonal geometry and public/editor connector parity are implementation contracts. Do not redraw stored connections decoratively or treat line crossings as new evidence of a relationship.

### F18 — Native Portfolio navigation and restoration

**Sources:** [portfolio-link.tsx](../src/components/portfolio/portfolio-link.tsx), [portfolio-navigation.ts](../src/lib/portfolio-navigation.ts), [portfolio-motion.css](../src/components/portfolio/portfolio-motion.css).

Portfolio links use native document anchors. Matching title/map landmarks participate in cross-document view transitions where both documents support the opt-in. Duration is **420ms**, group easing `cubic-bezier(.2,.7,.2,1)`. Outgoing root moves −12px and fades to .4; incoming root starts +36px away. Reduced motion disables these transitions.

Board→`/work/…` records Board Y and Project path in `portfolio-board-position`. An explicit Board return records `portfolio-return`; the prepaint script restores only the matching Project's saved Y with instant behavior. Storage is best effort; modified clicks, new tabs, direct entry, and browser Back retain ordinary behavior. Magpie `/` is outside that explicit `/work/` storage condition and uses native history behavior. Its document does not load the Portfolio transition opt-in, so Board→Magpie may report a native `Transition was skipped` fallback. Do not promise shared-element animation or explicit saved-position restoration on that path.

## Content fidelity and constraints

- Genuine originals live under `public/portfolio`. CCP has two originals: workflow 5780×5060 and starting-point screenshot 2388×1572. Preserve original pixels; inspect details through source-linked crops or full-size links.
- CCP's request screenshot is the **existing** experience. It is not evidence of the delivered creation wizard. Creation and district approval are distinct operations.
- CCP reported outcomes include immediate time to value, −95% product-request support cases, and +130% administrator session duration. They are source-reported, not independently validated analytics. The measurement window remains unknown even though Rico removed that awkward clause from visitor-facing prose. Do not put it back into the UI simply because this internal record preserves the limitation.
- Contractor-hour sources conflict (330 versus approximately 660 annual hours), so do not reuse either as settled. Do not claim all duplicates were eliminated or invent a total phase count from conflicting source descriptions.
- The Board's Magpie excerpt comes from the checked-in seed; the detailed Magpie sample loads its own persisted timeline. Do not claim automatic live parity between them.

## Open decisions and implementation gaps

1. **Future concepts:** Question-led Board rearrangement, Underdrawing, and an exportable visitor journey were future concepts in the old vision. Their current disposition is awaiting Rico's answer during this reconstruction. None is implemented. A renewed future direction would not restore the rejected Miro interaction model automatically.
2. **Marketplace review boundary:** The new UAT case is not an approved reference. Do not import its central composition, effect names, timings, navigation variants, colors, or component choices into the shared context. Add it only after Rico’s review.
3. **Pixel tone difference:** Magpie's lane keyframe settles to `#171917`; its sampled tones and the Board settle use `#282828`. These are separate implementations. Do not state they are an exact visual match or normalize their values as part of documentation.
4. **Publication and résumé:** Board is the intended landing experience, but `/` is still Magpie; the original public sample does not link into the expanding Portfolio. Public launch, domain migration, résumé placement, and indexing require their own decisions.
5. **Maintenance details:** Board counts and the masthead record year are currently authored literals. New entries or a new record year require an intentional update. They are not automatically derived capability.
6. **Impeccable build default:** Image-composition-first versus code-first has been asked separately. Do not persist a preference inferred from silence. Prior concept/wireframe selection remains evidence of the owner's preferred collaboration sequence.

## Workflow for the next design task

For a new Project, establish content evidence, propose distinct design/movement directions, and develop an annotated wireframe after selection. Rico has repeatedly requested that sequence. A local refinement should preserve the accepted surface and its specific features. A request for critique or ideation does not authorize implementation.

Use Impeccable's per-surface **Experience** mode for the Board and showcased work. The Portfolio is not a generic dashboard merely because one Artifact depicts software. Persist the mode in the surface brief, not as a universal product mode; owner editing tools are an Operate surface.

The setup package includes [PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md), its [schema-v2 component sidecar](../.impeccable/design.json), and three registered [surface briefs](../.impeccable/surfaces). These records reference this catalog and retain each feature’s separate settings. The sidecar’s color ramps are generated preview aids, not additional approved color tokens; its component examples reproduce control styling, not the full JavaScript behaviors. Impeccable’s build-path configuration remains unset pending Rico’s choice.

The recommended first Impeccable task is a scoped **critique** of the approved Board, Magpie, and CCP against these records. Report preservation risks and evidence-backed opportunities before proposing implementation. Exclude EdCo Marketplace. Then run a targeted technical **audit** where the critique identifies an accessibility, performance, or responsive concern. A critique is not permission to replace the approved identity or silently normalize motion.

For changes that later affect these features, update the relevant profile and source manifest with the same change. Record what was superseded. Verify desktop/narrow layouts, source attachment, keyboard/touch behavior, reduced motion, interruption/reversal, settled navigation, and browser errors where relevant. Historical check counts do not substitute for checking the new revision.

Development and release follow [AGENTS.md](../AGENTS.md): focused branches from fresh UAT, review, appropriate checks, and exact-revision verification. Production promotion needs Rico's explicit release request. Never publish in Wix. Do not alter source evidence, timeline data, authentication, secrets, storage, or infrastructure as a side effect of design-context work.
