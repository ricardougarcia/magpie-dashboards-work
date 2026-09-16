# PMF implementation evidence

Owner-selected “Two lines of inquiry,” implemented for UAT. The scope and confidentiality contract are in `../../docs/pmf-two-lines.md`; reviewed asset hashes are in `../../docs/pmf-safe-assets.json`.

## Application and asset checks

- `pnpm check`: 39 test files, 429 tests, lint, TypeScript and production build passed on September 16, 2026.
- Four redacted originals were inspected directly at their exported resolution. Local OCR supplemented that inspection; it is not a guarantee on its own. No proprietary OCR transcripts or original source images are included here.
- Regression tests check the exact approved image hashes, flattened PNG chunks, absence of known original image bytes under `public`, accessible interactions, reversible motion and tall-viewport convergence.
- The older full-detail GCM teaser image was removed from this deployment and replaced with the protected market overview.

## Browser evidence

`browser.cjs` exercises 1440×1000, 1280×800, 820×1180, 390×844 touch and 320×700 touch, plus Board/GCM entry points and read-only access boundaries. It covers six disclosures, four artifact viewers, diagram selection, scroll/reverse scroll, reduced motion, resize, image loading, private-source requests and runtime errors.

`local-confirmation.json` preserves the local confirmation as recorded, including failures. It must not be described as a clean pass. Eight representative reviewed captures are in `captures/`. The full capture sets are retained in the local review workspace.

The local confirmation prompted focused checks for modal scroll-baseline timing, direct-hash settling and an intermittent Board return. The corrected harness records settled modal positions, waits for scrolling to settle, and includes Board restoration diagnostics. An isolated dev-server favicon request also requires hosted confirmation. Exact preview and UAT results are recorded on the pull request against their deployment SHAs; those results determine release readiness.

Focused follow-up passed three independent Board return trials, four modal lock/focus trials, and two 320px fresh direct-hash/reload trials. Modal discrepancies matched the previous disclosure's changing height; once the viewer opened, scrolling remained locked. The earlier hash failure reused a document during disclosure collapse and synthetic mouse hover. The harness now starts a fresh document for its direct-link check and uses touch input for touch-device viewers. These corrections required no application or shared-navigation changes.

Native browser `Transition was skipped` exceptions from interrupted document transitions are retained separately with URL and stack; other runtime and console errors fail the checks. This classification does not suppress broken navigation or scroll-restoration assertions.

## Design review

A separate fresh-context reviewer checked selected-C fidelity, desktop/tablet/phone captures, source changes and exported images. The corrected interview thumbnail strip, paper-modal focus contrast, convergence alignment, and tall-screen completion were reviewed. Final behavior evidence and deployment gates remain distinct from visual review and from the owner's acceptance of UAT.

The one Impeccable detector pass is preserved in `impeccable-findings.json`. Graph paper is an explicit Portfolio requirement. Checkpoint expansion retains the selected 400ms grid/padding transition. The diagram's reported width transition is `stroke-width`, not layout width. No shared Portfolio styles were changed.
