# Board PMF rendering verification

The focused harness checks the new PMF rendering without repeating the PMF page's full interaction suite. It verifies the two approved images, card placement among the existing six regions, hover and keyboard focus, reduced motion, the existing GCM relationship, navigation to PMF, browser Back restoration, overflow, and browser errors at 1440×1000, 820×1180, 390×844 with touch, and 320×700 with touch.

```sh
BOARD_BASE_URL=http://127.0.0.1:3087 BOARD_OUTPUT_DIR=/absolute/output node verification/pmf-board-rendering/browser.cjs
```

`BOARD_BASE_URL` defaults to port 3087. `BOARD_OUTPUT_DIR` defaults to `evidence` beside the harness. For a protected deployment, set `BOARD_STORAGE_STATE` to an existing Playwright authentication-state file. Set `BOARD_VIEWPORTS=1440,390` to run selected supported widths. The harness uses isolated Chrome contexts and does not write portfolio data.

The clean production-build run on `http://127.0.0.1:3087` passed **98 checks with zero failures**: 27 each at 1440 and 820 pixels, and 22 each at 390 and 320 pixels. All application-error, console-error, and native-transition-interruption arrays are empty. The full application check also passed 435 tests, lint, TypeScript, and the production build.

The approved images load, the six authored regions and PMF's 03.B placement remain intact, both inquiry paths meet the direction marker, hover and keyboard focus animate the sheets and paths, reduced motion keeps them visible and static, the existing GCM relationship still pins and dismisses, and browser Back restores the card framing. Desktop and mobile visual inspection found no rendering changes needed.

Retained evidence includes the [full four-size report](evidence/results.json), [desktop card](evidence/1440x1000-pmf-card.png), [desktop context](evidence/1440x1000-board-context.png), [mobile card](evidence/390x844-pmf-card.png), and [mobile context](evidence/390x844-board-context.png). These final captures show the reduced-motion state, with both inquiry paths visible. The [pre-change desktop card](evidence/baseline-1440x1000-pmf.png) documents the original text-only PMF preview; the baseline had six regions and no PMF rendering.

Image checks compare URL pathnames, so deployment query parameters do not change the approved-source check. Native cross-document view-transition interruptions, if any, are reported separately from application errors. A complete run generates `results.json`, four card captures, and desktop/mobile context captures; this evidence set retains the bounded desktop/mobile selection above.
