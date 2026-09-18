# Resume UAT

The resume is the only content on this surface. Both US Letter pages retain the original PDF's outlined characters, placement, colors, rules, badges, and registration marks. Only the full-page background and grid are replaced by the existing Portfolio body background. See [source provenance](resume-source.md).

## Selected treatment

Rico selected Construction 1 — Register on September 17, 2026. Small character fragments assemble in reading order over 8.4 seconds. The existing site's paper grid remains visible before, during, and after construction; every resume rendering layer is transparent.

`/resume` opens Register. A compact control bar provides Replay, Finish, full-size reading, and the original PDF download. The comparison selector has been removed. Earlier treatment links redirect to `/resume`. The original four rendering methods remain in the engine for reference, but only Register is exposed on the page.

The two pages build concurrently from a blank, transparent field. Each sequence runs once. The completed canvas gives way to the original outlined SVG for sharp text at every zoom level. No resume font substitution or HTML reflow occurs. The source PDF remains unchanged.

## Access and interruption

- Reduced motion shows the complete document immediately, including a preference change during playback.
- Finish, Escape, print, and switching away from the browser tab settle the animation.
- Replay cancels and disposes of the previous sequence.
- With JavaScript disabled, the source SVGs are immediately visible. A failed enhancement also exposes the original document; a CSS fallback covers failure before hydration.
- A screen-reader transcript follows each page's visual reading order. The original PDF is downloadable.
- Narrow screens fit the original page geometry. The full-size control provides a horizontally scrollable document without making the browser viewport overflow.
- The route is `noindex, nofollow`. No existing navigation or portfolio data changes are part of this work.

## Scope

This is the selected resume treatment following the four-option UAT exploration. Owner selection covers Register's visual direction; hosted UAT verification remains a separate release step. The open Portfolio context PR is separate; this work uses the current application's background and the supplied PDF as visual authority.
