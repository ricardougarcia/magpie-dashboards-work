# Product–market fit…with no product: two lines of inquiry

September 16, 2026. Owner-selected C composition, with four original prototype frames, protected research overviews and two graphite reconstructions. UAT scope only; production is unchanged.

**Mode: Experience.** The two inquiry tracks let visitors inspect the work and reveal the reasoning behind it. This is a PMF-specific extension of the existing Portfolio identity.

## Story and authority

The published PMF case study and work index, archived September 6, 2026, describe one month of discovery led by Rico as sole product lead. Low-fidelity capability demonstrations, targeted interviews, a complementary Bolt prototype, market investigation and synthesis informed the initial MVP. The subsequent GCM remains a separate linked sample. This page does not claim achieved PMF, invent research quotations or import the GCM's outcome figures.

The selected interactive wireframe was `pmf-layout-study/c-inquiry.html`, reviewed locally in the four-option comparison. The owner approved graphite replacements for the concept map and synthesis diagram, then exact local redaction of four research overviews. Their later approval explicitly selected four original JPG prototype frames for the first research checkpoint, without redaction or re-encoding.

The latest approval overrides the earlier general redaction requirement only for those four JPGs. PMF exposes those exact frames, the approved redacted overviews and labeled reconstructions. The other original source assets remain protected; shared Portfolio design rules are unchanged.

## Visual and interaction contract

- Two columns: user research on warm paper and market analysis on graphite. Six checkpoints remain visible in ordinary native document flow; reasoning expands on hover/focus and pins by click/tap. Escape dismisses the checkpoint expansion. The two tracks stack at 760px and narrower.
- The first research checkpoint contains a four-frame gallery in the approved order: Prototype, Segment, Ask, Enrich. Each frame is labeled “Original prototype frame.” Captions describe visible prototype states without treating displayed estimates or confidence values as validated results. Gallery inspection uses the same approved files.
- Thumbnail hover, focus and tap select a frame. Arrow keys, Home and End move the gallery's single keyboard tab stop. Selection persists when opening or closing the image viewer. Stacked frames crossfade over 320ms; the pane and caption reserve their height across all four selections. Reduced motion removes the crossfade.
- Preserve Portfolio Geist/Geist Mono, paper `#f1efe9`, graphite `#282828`, square edges, existing cursor and native Board navigation. PMF repeats the shared display size, weight and tracking, with a scoped `.99` line height; it reuses the shared gutter. The graphite grid repeats every 28px with 1px paper-colored lines at `.045` opacity. Market-track signal `#ee826e` and diagram signal `#f17962` are scoped to those dark surfaces; paper retains `#bd3e2b` for signal text.
- Native scroll progress draws each rail from its measured top to bottom, using a reading point at 60% of viewport height. At the close, paths begin at the actual rail coordinates and meet at the MVP direction; stacked mobile uses one path from the final track. The join starts when its top reaches 84% of viewport height and spans up to 55% of viewport height, capped by available document scroll. Reverse scrolling reverses drawing. Resize, font readiness and checkpoint expansion remeasure the geometry.
- Checkpoint details expand over 400ms, `cubic-bezier(.22,1,.36,1)`; checkpoint markers change over 240ms. Artifact hover scales to 1.015 over 500ms. These effects are disabled for reduced motion; rails and connectors remain complete.
- The capability reconstruction presents the four named capabilities and public research purposes through mouse, keyboard and tap selection. Its branches highlight over 240ms and purpose text resolves over 220ms. It reproduces no confidential research prompts.
- The opportunity reconstruction describes two contextual inputs toward an initial MVP direction, without invented ranking, scores or proof of PMF. Its paths follow reversible scroll progress; reduced motion and print show complete paths. Both reconstructions are labeled explicitly.

These are PMF implementation values for the selected composition, not new global tokens or replacements for another Project's named motion. Shared Portfolio context files remain unchanged. Technical verification and owner acceptance of the finished experience remain separate gates.

## Protected evidence

Four flattened RGB PNGs retain recognizable original work: the segmentation plot, interview document, research matrix and market board. Sensitive labels, links, identities and body text are permanently masked in the exported pixels. Dense text blocks are replaced with opaque non-text blocks while retaining surrounding source layout and color. These are redacted copies, not AI recreations.

The prototype gallery separately uses the owner's exact selections: `A069-video.jpg`, `A138-video.jpg`, `A139-video.jpg` and `A140-video.jpg` from the local September 6 archive. They are copied byte for byte into `public/portfolio/pmf/prototypes`, with no redaction, resizing, re-encoding or metadata changes. This is a scoped owner exception, not permission to expose other full-detail source assets.

`docs/pmf-safe-assets.json` records the reviewed output hashes, dimensions and treatment. Its separate `approvedOriginalFrames` list records each JPG's local provenance; the four PNG entries and blocked original hashes remain unchanged. Regression checks reject unreviewed output bytes, extra public PMF files, PNG ancillary text/EXIF chunks and known blocked full-detail originals anywhere under `public`.

Inline and modal images reference the same approved files, with no larger original `srcset`, source link or hidden original preload. The bounded modal retains native focus trapping, Escape, Close, backdrop dismissal, focus return and background scroll locking. It remains usable on mobile without forcing a 1100px image.

The old full-detail PMF market image under `public/portfolio/gcm` is removed from the new deployment. The GCM companion uses the protected overview. The Board's existing 03.B placement and connecting interaction are unchanged; its destination and the GCM companion now link to `/work/pmf`. Existing external source sites and older deployments are not retroactively changed by this release.

## Verification and release

Record application checks, direct-file visual/OCR review, browser results, independent review, exact preview SHA and stable UAT verification in the release evidence. The user selected the design and treatments; engineering checks do not imply owner acceptance of the finished page. Production promotion requires a later explicit request.
