# Resume UAT

The resume sits below the existing site masthead. Both US Letter pages retain the original PDF's outlined characters, placement, colors, rules, badges, and registration marks. Only the full-page background and grid are replaced by the existing Portfolio body background. See [source provenance](resume-source.md).

## Selected treatment

Rico selected Construction 1 — Register on September 17, 2026. Small character fragments assemble in reading order over 8.4 seconds. The existing site's paper grid remains visible before, during, and after construction; every resume rendering layer is transparent.

`/resume` opens Register. A compact control bar provides Replay, Finish, full-size reading, and the original PDF download. The comparison selector has been removed. Earlier treatment links redirect to `/resume`. The original four rendering methods remain in the engine for reference, but only Register is exposed on the page.

The two pages build concurrently from a blank, transparent field. Each sequence runs once. The completed canvas gives way to the original outlined SVG for sharp text at every zoom level. No resume font substitution or HTML reflow occurs. The source PDF remains unchanged.

## Navigation and download

The Resume and The Board mastheads share links to The Board (`/drawer`) and Resume (`/resume`), with the current page identified. The masthead retains the site's existing identity and typography.

The floating PDF control downloads the unchanged original PDF directly, including without JavaScript. Clicking the resume has no download interaction. The earlier modal, click targets, and modal-only Register text helpers have been removed at Rico's request.

## Access and interruption

- Reduced motion shows the complete document immediately, including a preference change during playback.
- Finish, Escape, print, and switching away from the browser tab settle the animation.
- Replay cancels and disposes of the previous sequence.
- With JavaScript disabled, the source SVGs are immediately visible. A failed enhancement also exposes the original document; a CSS fallback covers failure before hydration.
- A screen-reader transcript follows each page's visual reading order. The original PDF is downloadable.
- Narrow screens fit the original page geometry. The full-size control provides a horizontally scrollable document without making the browser viewport overflow.
- The route is `noindex, nofollow`. Portfolio content and work-sample navigation are unchanged.

## Scope

This is the selected resume treatment following the four-option UAT exploration. Owner selection covers Register's visual direction; hosted UAT verification remains a separate release step. The open Portfolio context PR is separate; this work uses the current application's background and the supplied PDF as visual authority.
