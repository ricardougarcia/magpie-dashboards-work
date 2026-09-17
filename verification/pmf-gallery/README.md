# PMF prototype gallery verification

The harness checks the four prototype views at 1440×1000, 820×1180, 390×844 with touch, and 320×700 with touch. It covers mouse, touch, and keyboard selection; keyboard access to the selected image; all four modal images and disclosures; Escape, focus, and scroll restoration; stable image/caption heights; the 320 ms opacity transition, rapid selection, and reduced motion; horizontal overflow; rail reversal and completed convergence; and the existing protected interview viewer.

Run against a local server or an exact hosted deployment:

```sh
PMF_BASE_URL=http://127.0.0.1:3086 PMF_OUTPUT_DIR=/absolute/output node verification/pmf-gallery/browser.cjs
```

`PMF_BASE_URL` defaults to port 3086. `PMF_OUTPUT_DIR` defaults to this directory's `local` folder. Set `PMF_STORAGE_STATE` to an existing Playwright authentication-state file for a protected preview. Set `PMF_VIEWPORTS=1440,390` to run only those supported widths. Browser contexts are isolated and the harness does not write portfolio data.

The final production-build run on `http://127.0.0.1:3087` passed **200 checks with zero failures** across all four sizes. No browser runtime or console errors occurred. The gallery unit suite passes all six tests, and the full application check passed 435 tests, lint, TypeScript, and the production build.

Selection persists after pointer exit and modal dismissal. Keyboard users can select Ask, move directly back to the image button with Shift+Tab, and open that selected image with Enter. Image panes and captions remain stable, the transition settles after rapid switching, reduced motion removes the transition, all labels fit, and the convergence finishes on desktop and mobile. Visual inspection found no gallery changes needed.

Initial checks exposed a harness timing race: native dialog dismissal removes the open state before its queued close event restores application scroll state. The harness now waits for that lifecycle. A subsequent dev-server batch encountered server-side JSON parse errors while generated build files changed. The final result above comes from a clean production build and a complete four-size rerun; failed dev-server loads are excluded from that result.

The completed run writes `results.json` and gallery, modal, and convergence screenshots for each requested viewport. [The retained local report](local/results.json) contains all 200 checks. Six representative captures remain: [desktop gallery](local/1440x1000-gallery.png), [desktop modal](local/1440x1000-modal.png), [desktop convergence](local/1440x1000-convergence.png), [mobile gallery](local/390x844-gallery.png), [mobile modal](local/390x844-modal.png), and [mobile convergence](local/390x844-convergence.png). The harness uses the bundled Playwright runtime and installed Google Chrome.
