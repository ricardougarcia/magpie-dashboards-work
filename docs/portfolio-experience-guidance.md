# Portfolio experience guidance

Status: project guidance from Rico's Marketplace review, September 12, 2026. Marketplace remains **unapproved**. The [Marketplace direction proposal](design/marketplace-experience-direction/README.md) contains three alternatives; Catalog Confluence is the recommendation, not an owner selection. This supplement changes the design process, not the approved tokens or F01–F18 implementation contracts.

## Read the inventory and the creative brief

[PRODUCT.md](../PRODUCT.md), [DESIGN.md](../DESIGN.md), and [Portfolio context v2](portfolio-context.md) preserve approved identity, evidence, and named behavior. They are an implementation inventory, not a sufficient creative brief for another Project.

Before shaping a Project, record its audience, one-sentence narrative, three principal beats, focal artifact in each beat, optional evidence, and proposed behavioral signature in a surface-specific brief. Keep content truth separate from its presentation. Do not label scope or responsibilities as decisions without a documented choice and rationale.

## Make the reference explicit

[Heron](https://heronaiapp.com/) is Rico's named design inspiration. Treat it as a first-class reference alongside the approved Portfolio surfaces. Inspect its rendered composition and interaction before a new direction proposal; record dated observations or captures and the specific principle being translated. A reference's current implementation can change.

Explain the intended influence through attention, scale, negative space, rhythm, transitions, and invitation to explore. Paper, Geist, hairlines, and a custom cursor alone do not establish that influence. Label a recommendation as a recommendation; do not attribute invented behavior or proposed timing values to Heron. Preserve the Portfolio's own identity and source evidence.

## Compose a narrative, then expose its evidence

- Give each narrative beat one dominant focal point. Supporting text, controls, and artifacts must have visibly subordinate roles. Judge the rendered result, not the number of elements in the DOM.
- Use scale, weight, and negative space to distinguish an introduction, a close inspection, a transition, and a conclusion. Do not repeat the same artifact grid and section spacing across every beat.
- Show enough real work to establish credibility early. This does not mean displaying every source at equal prominence in the opening.
- Let visitors inspect the work itself: a source edge, crop, register, or other artifact-attached affordance can expose detail. Keep native links to originals and an understandable keyboard/touch equivalent. Essential understanding must not depend on discovering a hidden gesture.
- Preserve ordinary page scrolling and stable reading position. Direct artifact interaction is compatible with native navigation; it does not require a pan/zoom canvas or scroll interception.

At the wireframe review, answer: **What do I notice first, what do I understand next, and what am I invited to uncover?** If that sequence is unclear, revise the composition before adding motion.

## Specify a signature and its motion

A Project signature is a subject-specific behavior that helps explain the work. A different layout or the reused Coordinate Cursor does not establish a new signature. Specify the narrative purpose, real artifact, invitation, input, transformation, and discovered information. Select one primary mechanism for the representative sequence; do not combine every proposed mechanism into the page.

The Marketplace alternatives are **Workstream Index**, **Registration Proof**, and **Catalog Confluence**. “Workstream” avoids claiming authored decisions absent from the record. Their exact proposed motion values and annotated sequences belong in the [direction proposal](design/marketplace-experience-direction/README.md), scoped to that prototype rather than copied into the shared feature catalog.

Every proposed motion specification must state its source and status and include:

| Field | Required precision |
| --- | --- |
| Trigger and purpose | Pointer, focus, activation, or native-scroll condition; what the movement explains. |
| Geometry | Start/end positions, scale, opacity, clipping, and coordinate units. Preserve original pixels and aspect ratios. |
| Timing | Duration in milliseconds, exact easing, delay, and overlap; never only “subtle,” “fluid,” or “parallax.” |
| State behavior | Preview versus selection, reversal, interruption, repeated input, dismissal, and restored reading position. |
| Alternatives | Keyboard/touch equivalent, reduced-motion state, direct entry, and readable first paint. |
| Provenance | Approved feature and source revision, observed reference, or newly authored proposal. Do not conflate these. |

Preserve exact approved effect specifications when reusing their function. New prototype values are hypotheses for owner review, not replacements for the approved 1,150ms Pixel Acquisition, 900ms Workflow Map transitions, or other scoped contracts. A technically successful animation still needs review for pacing and attention.

## Check the rendered material and affordances

The approved paper-grid baseline remains **28px repeat, 1px lines, graphite opacity .018**. In the reviewed [Marketplace stylesheet](../src/components/portfolio/marketplace.module.css), `.page { background: var(--paper); }` supplies an opaque field that covers the grid beneath it. This is a code diagnosis of missing visibility, not justification for changing the global grid token. First restore the appropriate transparent surface or existing grid layer; propose any opacity adjustment separately and scope it to the reviewed surface.

Verify that the graph paper is perceptible in the actual desktop and narrow rendering, including behind intended open areas, without competing with original artifacts. A CSS declaration or computed background is not evidence that visitors can see it.

Every arrow must clarify a direction, a real relationship, or a necessary action. Remove repeated ornamental arrows and redundant arrows on already clear inspection affordances. Use line weight, placement, edges, focus, and object response deliberately; do not replace every arrow with another repeated symbol.

## Review experience separately from implementation

Before full-page work, review one bounded sequence: **opening → transition → artifact discovery**, with desktop, narrow, keyboard/touch, and reduced-motion treatments. It must demonstrate attention, negative space, narrative continuity, reference influence, discovery, and a Project-specific behavior. A static composition cannot establish motion quality.

Record two independent outcomes:

1. **Technical verification:** source fidelity, layout, interaction, accessibility checks, performance, interruption, and navigation at the tested revision.
2. **Owner aesthetic review:** whether weighting, scale, space, motion, invitation, and signature meet Rico's intended experience.

A test pass, detector score, or UAT deployment does not imply owner aesthetic approval. A proposed direction may be critiqued or prototyped within the authorized scope while remaining excluded from approved reusable guidance. Concept selection alone does not establish approval of the resulting implementation or authorize production release; follow the owner's stated scope. When a surface is accepted, record what was accepted and the revision before promoting its behavior into the shared context.

The current Marketplace proposal supersedes the earlier recommendation to start with critiques of approved surfaces. It authorizes neither site changes nor global Impeccable skill edits. Use project-level guidance first; change an installed skill only if a repeatable gap remains after a clear brief and verified review process.
