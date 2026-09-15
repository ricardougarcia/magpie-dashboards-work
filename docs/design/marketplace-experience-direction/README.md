# Marketplace experience direction

September 12, 2026 · **Proposal for owner review. No direction selected.**

Open the [annotated visual sequences](index.html). Compare three approaches using the existing original artifacts. The sequences explain composition and behavior; they are not a deployed revision or proof of finished animation quality.

## The design problem

The current Marketplace has useful content but presents too much of it at similar weight. More artifacts in the opening increased evidence visibility without creating a clear reading order. The shared Coordinate Cursor restores Portfolio identity but does not give Marketplace a distinctive behavior. Repeated arrows, mounts, and disclosure buttons do not make the story interactive.

The next iteration must make one thing compelling at a time: the fragmented starting point, the work of bringing it together, then the shared product and its evidence. Depth stays available through the objects themselves. Preserve the useful content and original pixels; change its staging, density, and disclosure.

## Reference and shared identity

The [Heron study](reference-study.md) separates observed behavior from interpretation. Its useful influence is a dominant artifact, purposeful inspection, local explanation, and continuity while scenes change. Portfolio keeps its own paper, graphite, Geist typography, signal red, exact shared cursor, and graph grid. Heron's orange palette, architectural artwork, repeated arrow links, and long pinned sections are not requirements.

The approved grid remains a 28px repeat with 1px graphite lines at .018 opacity. Current Marketplace `.page` sets a solid `background: var(--paper)`, covering the inherited grid. First restore the visible substrate without changing the shared token. The storyboard uses .055 locally to make the proposed field legible at review scale; this is **an illustration setting, not an approved replacement**. Calibrate on the real page after fixing the opaque layer.

## Three alternatives

These are alternatives, not a list of effects to combine. Every opening includes the Project name, Rico's role, one sentence of purpose, one dominant artifact, and an invitation to inspect. The visual sequences emphasize the central scene rather than final masthead typography.

### Workstream Index

**Thesis:** One shared product, four coordinated responsibilities.

**Signature:** A restrained margin index controls one large evidence field. Activating a workstream moves its registration mark into the artifact margin and exposes the supported scope next to the original. The remaining entries keep their positions. The object, annotation, and index change as one system.

1. **Orient:** The shared catalog is large. Four short scope labels sit in the margin: Catalog and publishing; Research and delivery; Legacy continuity; Edu App Center sunset.
2. **Reveal:** Select a scope label or its matching artifact-edge marker. The relevant original and one explanation occupy the same reading position. Some scopes have prose evidence only; do not fabricate a screenshot for them.
3. **Inspect:** Open the original from its surface. Closing inspection restores the chosen scope and reading position. The rest of the page resumes with reported impact and reflection.

**Strength:** Shows breadth without four equally prominent panels. **Risk:** Can become a tab interface with decorative movement. The connection between index and evidence must feel direct. Existing scope documentation is not enough to claim a sequence of explicit product decisions; hence “Workstream,” not “Decision,” Index.

### Registration Proof

**Thesis:** Understand the need, inspect the plan, then see the shared product.

**Signature:** Research, planning, and product originals enter one stable inspection frame. Exposed paper edges identify the next evidence type. Selecting or pulling an edge brings that document into the frame; registration marks retain orientation, without implying that unlike images have matching geometry.

1. **Understand:** The provider research synthesis dominates, with one supported concern. Label it as synthesis, not an individual interview.
2. **Frame:** The public discovery plan advances into the same position. Research remains a labeled edge. A short note distinguishes planned behavior from product evidence.
3. **Inspect:** The shared catalog presentation becomes the dominant proof. Activate the original for detail. The Canvas discovery concept is optional and explicitly labeled planning.

**Strength:** Makes the depth of the archive discoverable with a clear evidence rhythm. **Risk:** Overly literal paper effects would feel decorative; too much pan/zoom would repeat CCP. Use precise edge registration and bounded disclosure, not a desk metaphor or a second Workflow Map viewer.

### Catalog Confluence — recommended

**Thesis:** Three discovery destinations, brought into a shared Marketplace.

**Signature:** Three distinct catalog sheets share one quiet field. One is readable at a time; the others remain named edges. During ordinary scrolling their outer frames register to a common boundary, then the shared catalog presentation takes precedence. Original image contents never morph or merge.

1. **Distinguish:** Emerging AI Marketplace, Edu App Center, and LearnCommunity Library are all identifiable. Select a source by its exposed edge to inspect it without adding a second hero-sized image.
2. **Bring together:** Scrolling closes the space between the frames. The statement changes once to explain shared catalog/data publishing and delivery coordination. The registration is an editorial illustration of consolidation, not an animation of records moving between databases.
3. **Uncover:** The shared Marketplace occupies the registered frame. Its edge opens source inspection and a local evidence note. Edu App Center sunsetting receives a separate, clearly named note; the other catalogs are not shown as retired.

**Strength:** The signature expresses Marketplace's subject and addresses the crowded opening directly. **Risk:** An elaborate merge could imply unsupported migration details. Animate mounts, boundaries, and emphasis, never fabricated data or a guaranteed cutover sequence.

## Proposed motion contracts for the next prototype

All numbers below are starting proposals. They are neither measurements from Heron nor changes to the approved F01–F18 contracts.

| Behavior | Trigger and geometry | Initial motion | Interruption and fallback |
| --- | --- | --- | --- |
| Index registration | Activate a scope label or evidence-edge marker; mark transfers from rail to artifact margin | 420ms, `cubic-bezier(.22,1,.36,1)`; local artifact/annotation change 240ms, opacity plus 12px travel | New selection starts from current state; no queued animation. Immediate replacement under reduced motion. |
| Proof advance | Activate or pull the next labeled edge; 48px exposed-edge travel into the existing frame | 640ms, `cubic-bezier(.22,1,.36,1)` | Reversal uses current progress; drag is optional. Tap/Enter and ordinary page reading expose equivalent evidence. |
| Catalog registration | Native scroll progress normalized from 0 to 1 across an initial 70vh interval; source-frame separation 56px to 0 | Scroll-linked geometry, no fixed duration and no global smooth-scroll interception; source selection 360ms with the same easing | Reverses with scrolling; short viewports use sequential in-flow states. Reduced motion shows distinct sources and final product statically. |
| Local inspection | Activate an original or its explicit inspection link; expand from its current frame to fit the available reading area | 360ms, `cubic-bezier(.22,1,.36,1)`, bounded clip/scale; no source-image distortion | Close/Escape restores the selected object and focus. Immediate expansion under reduced motion. Full original remains a native link. |

The storyboard illustrates discrete states. Its controls are review controls, not the final page's interaction design. A selected direction still needs a small working prototype to judge continuous motion, direct manipulation, reversal, touch, and perceived quality.

## Layout and narrative rules

- **One focal hierarchy per beat:** dominant evidence first, one claim second, optional supporting detail third. Do not show all three catalogs, the final product, and multiple explanations at equal scale.
- **Meaningful negative space:** leave a clear reading field around the selected object; change density between the opening, explanation, inspection, and impact. Avoid a fixed stack of similarly sized sections.
- **Originals as affordances:** the artifact or its exposed edge invites inspection. Keep a visible text alternative, keyboard focus, and touch access. Never hide the primary story behind hover.
- **A coherent visual vocabulary:** shared paper, hairlines, square edges, and registration marks; introduce one new behavioral signature. Do not repeat every mount, arrow, or animation from another Project.
- **Limited directional marks:** an arrow must explain a supported relationship or necessary action. Use position, labels, and state change where those already communicate direction.
- **Mobile continuity:** stack the same evidence order; use taps and in-flow detail. Keep touch targets at least 44px and native scroll unblocked. Show the purpose of a transition even when motion is removed.

## Evidence boundaries

Use the [Marketplace source record](../../edco-marketplace.md) and [artifact data](../../../src/data/marketplace.ts). The eight original PNGs remain under `public/portfolio/marketplace` and are linked directly by the storyboard.

- The provider persona is research synthesis. Public and Canvas discovery plans are planning evidence, not proof every feature shipped.
- The shared catalog presentation shows product evidence; do not infer field-level research-to-component causality.
- Only Edu App Center is explicitly documented as sunset. Consolidation does not mean every source was retired.
- The source reports 102% partner-listing growth over five months and 20+ maintenance hours saved weekly. Do not add unsupported attribution, denominators, or measurement methods.
- “7-month sample” does not establish full project duration.

## Review and next step

Choose the mechanism whose story and interaction feel right, or name what is missing from all three. **Catalog Confluence is the recommendation; it is not selected or approved.**

After selection, create an annotated wireframe and one bounded prototype covering **opening → catalog transition → artifact inspection**, including narrow and reduced-motion versions. Review whether attention, pacing, discovery, and signature meet the intended experience before extending the direction through the whole case study. The existing UAT page remains the implementation baseline, not an approved aesthetic reference.

The [experience guidance supplement](../../portfolio-experience-guidance.md) turns these lessons into reusable critique requirements. Technical checks and owner design acceptance must be recorded separately.
