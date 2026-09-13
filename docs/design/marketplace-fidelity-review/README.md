# Marketplace motion fidelity review

Compare the approved **Play sequence** study with the actual Marketplace page at the same viewport and scroll progress. This is a local review surface; it does not publish changes or establish owner acceptance.

## Run locally

From the repository root, build and start Next in one terminal. Stop any existing server on port 3019 first.

```sh
pnpm build
pnpm start --hostname 127.0.0.1 --port 3019
```

In a second terminal:

```sh
node docs/design/marketplace-fidelity-review/server.mjs
```

Open [the comparison at `/__review/`](http://127.0.0.1:3033/__review/). The server binds to localhost on port 3033 and proxies the actual Next page unchanged from port 3019.

Select a viewport, use **Play forward** or **Play reverse**, and inspect the fixed progress stops. Play calls the actual page's `window.scrollTo`; it exercises the page's scroll controller but does not simulate native wheel or touch gestures. Test those inputs and keyboard navigation separately on [the standalone page](http://127.0.0.1:3019/work/marketplace). At fallback sizes, read and scroll that page normally.

## Reference copy

`reference.html` preserves the approved `catalogs-to-research.html` study's scene, text, styles, and choreography. The review copy adds an HTML/viewport wrapper, removes body margins, hides the study's own controls/status, and replaces the pinned CDN image URLs with the repository's `/portfolio/marketplace/` files. The comparison supplies the progress controls. The original Google Fonts import remains; let Geist finish loading before comparing typography.

The study contains an abbreviated Research preview. The actual page retains the complete case study and original inspection behavior.

## Required behavior

| Viewport | Required presentation |
| --- | --- |
| 1280×720, 1366×778, 1440×825, 1440×900 | Animated opening and handoff |
| 390×844, 393×852 | Compact animated opening and handoff |
| 390×700 | Normal-flow reading fallback |

These dimensions are CSS pixels. Reduced motion or content that cannot fit the usable viewport must keep all four originals accessible in reading flow.

| Sequence progress | Required behavior |
| --- | --- |
| 0–76% | Hold the opening while Emerging AI Marketplace, Edu App Center, LearnCommunity Library, and shared Marketplace advance in order. Images, selection, and captions stay synchronized. |
| 76–96% | Move “catalogs” into its navigation position while interpolating actual font size, line height, weight, and tracking in `em`. |
| 76–88% | Fade the remaining opening content. |
| 83–94% | Introduce the navigation without a top rule. |
| 84–96% | Introduce Research as the active section. |
| 92–96% | Blend the traveling word into the native Catalogs label. |
| 96–100% | Hold the completed Research view, then continue ordinary document scrolling. |

Reverse scrolling must reverse the same sequence. Keyboard readers can continue to Research, return from Catalogs navigation to the first source, and inspect originals without losing focused content. Mobile, reduced-motion, and short-screen fallbacks must preserve the narrative and original links.

## Recorded verification

On September 13, 2026, the local correction passed the viewport matrix. Native-wheel checks held the stage at 72px through the catalog sequence, released it while the navigation stayed at 72px, and restored the held stage on reverse scrolling. The final full `pnpm check`, including the final CSS changes, passed with **223 tests**. The focused typography and sequence run passed **45 tests** plus ESLint.

Continuous comparison captures include 236 timestamped desktop frames, 249 reverse desktop frames, and 234 phone frames, each over approximately 18.3 seconds. A standalone 390×844 keyboard check verified Continue to Research, the Catalogs return link, original-image inspection, Escape, and restored focus. The 390×700 fallback exposed all four originals without horizontal overflow. Reduced-motion behavior is covered by component tests; physical-device touch acceptance remains pending. Use the interactive comparison for full-speed review. These are engineering results; owner visual acceptance remains pending.

## Guidance for Impeccable

Treat the approved Play demonstration as a behavioral contract. Preserve its sequence, timing relationships, typography transformation, and direction of attention when implementing the real page.

Before claiming fidelity, capture all three forms of evidence:

- Matching screenshots at 0%, 18%, 30%, 52%, 70%, 80%, 86%, 94%, and 100% progress.
- A continuous recording of the actual page moving forward and backward. Identify programmatic Play separately from native input.
- The viewport matrix, including keyboard navigation, reduced motion, and the reading fallback.

Compare the evidence with the approved study and identify any remaining differences explicitly. This guidance belongs to the Marketplace review asset; it does not modify global skills or approve Marketplace details as shared Portfolio conventions.
