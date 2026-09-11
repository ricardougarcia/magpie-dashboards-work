# Portfolio foundation

## Shared shorthand and intent

- **Board**: the space containing all portfolio Projects. The first surface is `/drawer`.
- **Region**: the stable area a Project and its supporting Artifacts occupy on the Board.
- **Project**: an independently addressable case study, initially `/work/ccp`.
- **Artifact**: a real supporting image, map, video, or document.

Use these terms consistently. Rico wants shared shorthand maintained as features evolve.

The agreed Project sections are **Context → Problem → Approach and decisions → Solution → Impact → Reflection**. Discovery/investigation is critical and belongs prominently in Approach and decisions. Sections can vary in depth or be omitted when irrelevant. Do not require a pivot, a shipped product, or measured impact for every future case.

The experience is visual first: large real Artifacts, compact annotations, workflow diagrams, and outcomes, with native expandable details for longer explanations. The desktop section rail becomes a compact mobile index. Scroll stays native; the existing hidden-scrollbar and overscroll treatment is inherited without changing the Magpie page.

## Implementation

`src/data/portfolio.ts` contains authored Project records using `src/lib/portfolio-types.ts`. Stable Project, section, block, decision, and Artifact IDs are independent of Board placement. Blocks support Artifacts, metrics, simplified flows, decisions, text, and details. The six section titles are the defaults, not six required database fields. Routes and the Board read the same collection. No timeline schema, Blob data, editor, authentication, environment, or existing `/` changes are needed.

`src/components/portfolio/` renders the shared presentation using scoped CSS and Server Components. The authored content remains server-rendered. Small client components handle inspection reveals, Artifact magnification, and Board framing; native links and the existing expandable Project details remain available. Full-size Artifacts open locally hosted originals in a new tab so the reading position is preserved. `next/image` generates responsive delivery sizes. No external Wix runtime or asset dependency remains on these two pages.

New portfolio routes remain `noindex, nofollow` during UAT development, matching the previous drawer policy. Review metadata, canonical domain, and indexing when the expanded portfolio is approved for launch. The current Magpie route does not link to the Board yet.

## CCP source and editorial decisions

Content comes from the local research archive captured September 6–7, 2026, principally the public `/work/ccp` case and `/work` index at ricardougarcia.com. Research was discontinued at Rico's request; this implementation uses the existing archive and does not resume Wix inspection. **Never publish in Wix under any circumstances.**

- The work index supplies role, six-month duration, and team composition: four engineers, two designers, three contractors, and Rico as product manager.
- The case supplies the interview groups, 2.5 years of data, duplicate analysis, copy testing, prototyping, local-creation and matching releases, and reported outcomes.
- The two stated delivery stages are described without asserting a total project phase count: the work index says three phases while the detailed case describes two rollout phases.
- Contractor hours are withheld: the case says approximately 660 annual hours while the résumé says 330. Reconcile before reuse.
- The claim that duplicates were entirely eliminated is omitted as an absolute. The duplicate-reduction goal and approximately 25% baseline remain.
- Immediate time to value, −95% product-request support cases, and +130% administrator session duration are the case's self-reported outcomes, not independently validated analytics. The expanded measurement explanation notes that a measurement window is unavailable.
- Reflection copy and concise headlines are editorial synthesis of the source, not verbatim quotations or a newly claimed research event. Rico can refine these in UAT.
- Flow diagrams are simplified explanations of the published workflow. Provider matching can occur when a matching global product is available; the diagram does not implement the original product's behavior.

## Artifact provenance

Both files are unchanged copies from the recovered public portfolio, hosted under `public/portfolio/ccp/`:

| File | Archive ID / Wix media ID | Size |
|---|---|---|
| `workflow.png` | A109 / `7eca65_b251d050c73f46dd8f3f6292563e578f~mv2.png` | 5780 × 5060 |
| `request-experience.png` | A114 / `7eca65_f4590e2fdc7441f49e423111a838136a~mv2.png` | 2388 × 1572 |

The request screenshot is labeled as the existing experience, not the newly shipped creation wizard. The full workflow map is the actual planning Artifact. Unrelated platform screenshots and decorative stock-style images from the old case are not presented as CCP-specific evidence.

## Future direction, in phases

First complete Board → Project → Board for CCP, then validate the same template with Magpie and populate the remaining Projects. The eventual concepts are a Board that reorganizes around a question, an underdrawing revealing original thinking, and a visitor journey composed into a saved editorial drawing. The stable content and Artifact IDs support those relationships later; no speculative interaction engine or fabricated cross-project connections are included now.

## Release boundary

Use an isolated `codex/` branch from fresh `uat`, run `pnpm check`, verify responsive behavior and the exact Vercel preview, and record review evidence in a PR targeting UAT. Production release requires Rico's later explicit approval. Other contributors may push asynchronously; recheck both branch heads and the PR immediately before merge. Do not modify production data to verify a deployment.

## Region composition and inspection — September 7, 2026

Rico approved the Region composition, paper-backed map correction, continuous Project entry, and inspection reveals for UAT only. The Board now composes the full Workflow Map, original request screen, a located detail of the creation handoff, research scope, and an outcome marker. Labels A/B/C refer to the actual local Artifacts/detail; the handoff detail is explicitly identified as a crop of the full map. No speculative cross-project relationships or infinite-canvas controls are introduced.

The Workflow Map PNG is approximately 81% transparent with dark connectors. All overview/detail/hero surfaces now paint paper behind it, preserving the original pixels. Normalized crop coordinates select Creation handoff and Matching & merge within that same original. The Project inspector offers Overview, these two located details, and 1–4× magnification with native bounded scrolling, hidden scrollbars and no overscroll bounce. The locator marks the selected detail in the full map.

Hover or keyboard focus reveals an annotation through a brief signal-red tether/pixel sequence. An explicit toggle provides touch access. Reserved annotation space prevents neighboring Artifacts from shifting. Role, outcome, research scope and resting captions are always visible. Reduced motion disables pixel and page transitions while preserving all controls and content.

Board/Project document links opt into native cross-document view transitions: the title and map retain stable unique names derived from the Project ID. A brief 420ms sheet transition moves outgoing and incoming content at different distances. Browsers without support retain standard links. This follows the browser’s [cross-document transition model](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document); no experimental Next.js flags, custom scroll loop or application dependency was added.

Native Back retains browser restoration. Explicit Return-to-Board links restore the recorded Board scroll position only for the matching Project, using best-effort session storage. Modified clicks and blocked storage retain ordinary navigation. The registration marks and Artifact placement establish a Region that future Board navigation can reuse.


## Pixel Acquisition and Evidence Trace — September 7, 2026

Rico approved the first two Board refinements with a specific constraint: the paper should feel considered, and motion should remain light. Open Mounts and Board Threshold remain proposals for later; this change is limited to Board inspection.

Pixel Acquisition replaces the six-square icon with one bounded tonal pass across the annotation surface. Deterministic variation in tone and delay recalls the Gantt acquisition language at much lower opacity (2.5–8%). A 120ms mouse dwell suppresses passing hovers; the pass settles in under half a second. Paper stays flat and uniform, with no texture, shadow, scale, tilt or changes to original image pixels. Corners and a short rule identify the active annotation. Touch toggles immediately; keyboard focus, Escape and outside pointer dismissal are supported.

Evidence Trace belongs specifically to C / Creation handoff. Its inspection outlines the existing crop coordinates in A / Workflow Map and draws one orthogonal tether through the outer margin, replacing the former decorative C-to-outcome line. An A / Source locator supplies the same relationship when the full map is off-screen. On narrow layouts the long tether is omitted; the source outline and locator remain. Source files and content claims are unchanged. Reduced motion presents a static relationship without pixel or stroke animation.

Inactive and active captions share a CSS grid cell and both contribute to intrinsic sizing. Inactive content is visually hidden and marked aria-hidden, avoiding layout movement and clipped copy at narrow widths or increased text size. Geometry is measured only during active inspection and resize; no scroll loop or idle animation is introduced. The existing Project pages, Board/Project transitions, and Magpie timeline are unchanged.

## Board sheet registration — September 10, 2026

The Board has a numbered sheet record, an issued date for the sheet (not a project date), graduated rulers, and a sticky coordinate register. Ruler divisions measure CSS pixels from the sheet origin. The register follows native vertical scrolling; there is no added pan or zoom interaction. A small mouse readout reports the point on the sheet and the containing Region code. Updates are event-driven and coalesced through one animation frame. Touch retains native gestures, and reduced motion hides the moving pointer readout.

Each Region presents a colon-aligned Project, Role, Window, and Status plate. “Documented case study” describes the record, not an inferred shipping status. Counts derive from original Artifact records and decisions in the Solution section: CCP has two original Artifacts and two delivery decisions. Crops and Reflection items are not counted as additional Artifacts or delivery decisions. The first Region has a direct entry link; additional unpublished Projects are not implied.

Artifact mounts use the existing raised-paper tone and fine borders, with resting corner marks and active reticles. A / Workflow Map exposes its “What to notice” annotation at rest; inspection supplies the source caption. C's source label identifies the crop's upper-left point in original-image pixels (1734,1518), matching the source locator and crop bounds. Square endpoints finish the existing A–C trace. The line resolves once per inspection and remains static, with animation removed under reduced motion.

General notes distinguish original Artifacts, enlarged details, and reported outcomes. No boot overlay or forthcoming-project index is included. This pass changes only Board components and scoped styles; the Project pages, original image files, Magpie timeline, storage, and production release remain unchanged. UAT only.
