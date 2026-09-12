---
name: Rico Garcia Portfolio
description: An authored Board of product work on paper, with graphite detail and source-linked evidence.
colors:
  paper: "#f1efe9"
  paper-raised: "#f8f6f1"
  ink: "#282828"
  muted: "#6b6a64"
  signal: "#d6452f"
  signal-text: "#bd3e2b"
  portfolio-line: "rgba(40, 40, 40, 0.16)"
  portfolio-line-strong: "rgba(40, 40, 40, 0.36)"
  global-line: "rgba(40, 40, 40, 0.18)"
  global-line-strong: "rgba(40, 40, 40, 0.42)"
  magpie-graphite: "#272a28"
  ink-residue: "#d6d5d0"
typography:
  project-display:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(44px, 5.4vw, 82px)"
    fontWeight: 500
    lineHeight: 0.97
    letterSpacing: "-0.065em"
  project-heading:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(28px, 3.4vw, 48px)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.05em"
  project-prose:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, monospace"
    fontSize: "10px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0.055em"
  coordinate:
    fontFamily: "Geist Mono, monospace"
    fontSize: "9px"
    fontWeight: 600
    lineHeight: 1.18
    letterSpacing: "-0.055em"
  magpie-display:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(4rem, 9vw, 9.5rem)"
    fontWeight: 670
    lineHeight: 0.8
    letterSpacing: "-0.075em"
rounded:
  square: "0px"
spacing:
  portfolio-gutter: "clamp(20px, 3.4vw, 56px)"
  board-column-gap: "clamp(40px, 5vw, 82px)"
  board-row-gap: "80px"
  board-row-gap-narrow: "58px"
components:
  board-link:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.square}"
  map-view-control:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    padding: "12px 16px"
  workflow-replay:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    padding: "8px 0"
  artifact-backing:
    backgroundColor: "{colors.paper-raised}"
    rounded: "{rounded.square}"
---

# Design System: Rico Garcia Portfolio

## Overview

**Creative North Star: "An authored Board of product work"**

Use the approved paper, graphite, editorial type, and technical annotation language to make real evidence understandable. Composition should reveal scope and judgment while allowing inspection. Preserve distinctive work samples rather than applying one case-study layout everywhere.

This is an implementation-derived record of the approved Magpie, Board, and CCP work, through commit `201bae93fdc97c030cd1f06ad4e9cba2ac38bdf6`. Rico confirmed these surfaces are approved during this reconstruction. **EdCo Marketplace design is excluded pending owner review**, even though its newer code exists in UAT. No tokens, motion settings, snippets, or surface rules here are extracted from that unreviewed design.

Exact effect contracts live in [Portfolio context v2](docs/portfolio-context.md). The frontmatter records current token roles; it is not permission to standardize every source value. Type roles labeled `project-*` come from the CCP/general Project styles. Magpie keeps its separate display role. Surface briefs own composition and mode.

**Key Characteristics:**

- Genuine artifacts with concise, source-aware annotations.
- Flat paper and precise graphite structure.
- Deliberately different Project signatures.
- Named interactions with preserved timing, geometry, and interruption behavior.
- Native scrolling and navigation with explicit inspection controls.

## Colors

Paper and graphite carry the experience. Signal color identifies interaction, source relationships, and selected emphasis. Small red Portfolio labels use the dedicated signal-text token. These are owner-established choices; a generic style warning does not override them.

### Primary

Use `ink` for primary reading and Portfolio graphite marks. The earlier near-black ink was deliberately replaced in UAT. Use `signal` for cursor, focus, and relationship lines; use `signal-text` for small Portfolio headings.

### Neutral

Use `paper` for the field and `paper-raised` for the existing artifact backing and tonal separation. `muted` supports secondary text. Preserve the difference between global and Portfolio line opacities. Magpie's separate graphite role and ink residue are scoped values, not competing defaults.

**The Scope Rule.** A token or color used by one component does not automatically become a Portfolio-wide rule. Magpie's lane acquisition still settles to `#171917`; its sampled tones and the Board's dissolve use a different palette. See F04–F05 before changing either.

## Typography

Geist carries display and reading text; Geist Mono carries indices, metadata, coordinates, and compact controls. Keep exact role relationships. Display weight was reduced on the Board/CCP; it was not globally reduced on the original Magpie hero.

The frontmatter's Project display/heading/prose roles come from `portfolio.module.css`; the coordinate role comes from the shared cursor CSS. Portfolio metrics use weight 450. The Board's compact cluster typography overrides its larger Region styles. Mobile Project hero text uses `clamp(42px,10vw,68px)` at ≤760px. Consult the component rather than copying one size everywhere.

**The Role Rule.** Vary size and weight within the established Sans/Mono roles to create hierarchy. Do not introduce a new type family merely to make another Project different. Preserve unpadded `X:…PX` and `Y:…PX` viewport labels; padded Sheet coordinates are a separate instrument.

## Layout

The Board is an authored open sheet with native vertical scrolling. Two columns become one at 900px. Reading order follows the configuration array. Regions may have different internal compositions, while the shared field stays ordered. The approved Board does not have a draggable or zoomable Miro canvas.

The paper grid is a 28px repeat with 1px lines at .018 graphite opacity. CCP's section shells remain transparent and in flow; only their content moves during takeover. Section labels remain close to their upper boundary, with 18px desktop / 16px narrow padding, and a 28px standard bottom padding. Preserve the visible grid and stable anchors.

CCP's desktop reading layout has a left rail and a distinct page mini-map. At ≤760px the index becomes an in-flow two-column list. This layout is a CCP surface decision, not a mandate for new Projects.

**The Evidence Rule.** Keep source images readable and use normalized crop geometry to connect a detail to its original. A full-size original must remain reachable. Do not reinterpret a source-linked detail as an unrelated image or draw a connection without evidence.

## Elevation & Depth

Portfolio paper is flat by default. Depth comes from tonal separation, source mounting, exact spacing, open margins, and registration marks. Preserve the differing A/B/C mount treatments. Existing grain/hatching belongs in the designated margins and graphite details, not on the original pixels.

Magpie's item hover uses scoped depth, including a −2px lift and its existing shadow; selected detail/media surfaces have their own treatments. These are exceptions owned by Magpie. Do not remove them to enforce a fabricated global “no shadows” rule, or apply them to Portfolio artifact mounts.

**The Material Rule.** Preserve original image pixels. Use an external backing, mount, crop, or annotation to explain them. Avoid fake wear, torn edges, scrapbook effects, or decorative motion that competes with evidence.

## Shapes

Use square paper edges, hairlines, understated brackets, source windows, and registration marks. The cursor SVG is 20×20px with a `(10,10)` hotspot; the action variant extends its plus arms. Do not substitute a generic custom cursor.

Board pixel acquisition uses whole nominal 4px square cells aligned to integer physical pixels. Magpie's 16×16 lane field instead stretches to cover its labels. “Pixels must be square” applies to the Board mask; it does not silently rewrite the older lane implementation.

## Components

### Masthead and navigation

CCP uses the original Magpie masthead structure with Project role and `[organization] record / 2026`; the Board keeps its own approved masthead. Native Portfolio links support direct entry, modified clicks, and history. Board return storage is scoped to `/work/` Project paths. Record year and Board counts are authored, not automatic.

### Coordinate Cursor

Reuse the existing component and assets. Preserve stacked viewport labels, 11px offsets, edge thresholds, full-screen 1px guides, exact type, and mouse-only coordinate updates. See F01. Do not substitute Board sheet coordinates.

### Inspection caption and Pixel Acquisition

The incoming DOM text and backing resolve through one mask over the resting caption. Preserve 1150ms stochastic acquisition, 180ms settlement, reversible 850ms exit, complete square cells, and a retained opaque final mask. Keyboard, touch, focus, and dismissal are part of the component contract. See F04.

### Evidence Trace and source locator

Use B Workflow Map as the source for C Creation handoff. Preserve normalized crops, 2px line, 4px endpoints, 700ms easing, responsive gutter/margin routing, and the source locator. The map's 1.012 maximum scroll scale remains attached to the crop marker. See F06–F08.

### Workflow Map controls

Preview on hover or keyboard focus; pin on activation; restore the pin after preview ends. Preserve 900ms camera transitions, native 1–4× zoom, scroll chaining, and the continuous shared ink surface across the tabs. See F10–F11.

### Reading rail, mini-map, and takeover

Preserve distinct values: reading detection at `min(160px,25vh)`, marker motion at 420ms, section takeover at the viewport's upper third, section opacity floor .72, and hero replacement opacity floor .15. The mini-map has native section links. See F03 and F12–F14.

### Graphite workflow and decision controls

Keep aligned before/after workflows, open handoffs, explicit replay, equivalent creation/matching interactions, reciprocal decision links, and restrained registration/joint marks. Preserve their separate 760ms traveler, 850ms receiver, and 520ms decision-connection timings. See F15–F16.

### Magpie-specific components

Guiding Light focus, lane acquisition, Telemetry Aperture, source-to-aperture tether, item relation paths, and media preview are distinct systems. Reuse only when the new surface calls for the same function. Their original timings and geometry are in F05, F10, and F17; the Board excerpt is not the live timeline.

## Do's and Don'ts

### Do:

- Do preserve each named behavior's trigger, geometry, timing, interruption, and fallback together.
- Do keep source artifacts and essential explanations readable before an entrance animation.
- Do use shared identity while letting approved Project compositions differ.
- Do preserve keyboard, touch, visible focus, native scrolling, and reduced-motion alternatives.
- Do record superseded decisions and distinguish owner approval from code presence.

### Don't:

- Don't extract reusable design guidance from unreviewed EdCo Marketplace work.
- Don't collapse different effects into one “subtle animation” or “parallax” preset.
- Don't restore the removed Board title block, pale pixel wash, or CCP's rejected staggered alignment.
- Don't add Miro-style pan/zoom, decorative arrows everywhere, or an empty boot state.
- Don't fabricate evidence, treat historical tests as a new pass, or promote production without the owner's release request.
