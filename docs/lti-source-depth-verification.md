# LTI source inspection verification

Date: 2026-09-18

Application revision: `2550ae26eefdc8cb7103513c200c5a2fb421c29d`

Tested tree: `71e40e2a47ccdbe4d35edaa8386e1627ba3a747b`

UAT baseline: `0c3793fd8bcde625cfe9279d4c50a783e7734822`

## Automated checks

`pnpm check` passed: timeline integrity (45 items, six lanes), 57 test files / 592 tests, ESLint, TypeScript, and the production build. The source tests cover local ownership, original file hashes and dimensions, bounded crops, source switching, complete-original destinations, zoom/error/scroll reset, reopening, and A076 replacement. `git diff --check` passed.

The Documents checkout encountered cloud-placeholder/dependency-read failures. The same source files were copied to an isolated temporary checkout and validated there. The published Git tree was compared with the tested local tree and matched exactly.

## Local browser checks

The real browser rendered the existing composition with A080 replacing A076. All 16 inspection views were selected at 1280px; each displayed an image and linked to its correct application-owned original. Escape closed each inspector and restored focus to its trigger. Switching sources and reopening reset Actual size and scrolling.

Responsive checks at 820, 390, and 320px found no document horizontal overflow. The 320 × 568px configuration inspector kept its controls and source explanation accessible. Actual size exposed the original source pixels within an internally scrollable viewport; keyboard ArrowRight moved that viewport, and the source explanation accepted keyboard focus. Transparent Planning & Schema content rendered against white. The 820px A079 Services detail and desktop provider journey were visually inspected. Browser warning/error logs were empty.

These are desktop browser viewport checks, not physical-device testing. Reduced-motion behavior is covered by the existing component tests and preserved styles; an operating-system reduced-motion setting was not toggled during this browser pass. The small source text remains limited by the resolution of the original exports.

## Review and release evidence

A separate read-only agent reviewed the final source diff, asset metadata, crop boundaries, source ownership, evidence wording, and preservation of the existing primary artifacts. The only actionable finding was keyboard access to a potentially scrolling caption; the footer is now focusable. No P0–P2 findings remain from that review.

Hosted preview, exact deployment SHA, checks/reviews at merge, and stable UAT validation are recorded on PR #75. This file records local checks only and does not claim owner acceptance or a production release.
