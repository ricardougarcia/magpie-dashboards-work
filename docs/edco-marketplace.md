# EdCo Marketplace UAT case study

The authored `/work/marketplace` route uses [Catalog Confluence](marketplace-confluence.md) for UAT review. On September 13, 2026, the owner approved the interactive prototype for a held four-image catalog sequence and a Catalogs-to-Research word handoff. This is approval of that sequence, not blanket Marketplace aesthetic acceptance or an approved shared design reference. The page preserves the Portfolio's paper, graphite, signal color, typography, hairlines, cursor, and Board navigation. Four reading beats organize the catalog transition, research, delivery, and reported impact.

## Content and evidence

Source: the owner's recovered Marketplace case study and asset archive in `portfolio-migration-research-2026-09-06`, reviewed alongside the owner's explicit requirement to foreground the three-repository transition. Here, repositories means independent product catalogs/data sources, not Git repositories: Emerging AI Marketplace, Edu App Center, and LearnCommunity Library.

The narrative includes legacy data rerouting into a shared backend during the sunset period and the public launch alongside Edu App Center's sunsetting. It does not assert all three sources were retired, an exact cutover sequence, zero downtime, or undocumented migration controls. Planning artifacts retain their planning/concept captions; the in-platform expansion is not presented as fully shipped.

Impact uses the original case's reported 102% partner-listing growth over five months and 20+ hours/week reduction in maintenance. Baseline counts and measurement methods are unavailable. Revenue, sentiment/NPS, superlatives, and attributed causal claims with conflicting sources are omitted.

## Original artifacts

Files under `public/portfolio/marketplace` are unchanged PNG originals. SHA-256 hashes were checked against the recovered asset manifest. Responsive images retain intrinsic dimensions and link to their full-size original. The Board uses the same catalog presentation.

| Archive ID | File | Dimensions | SHA-256 |
| --- | --- | --- | --- |
| A033 | `ai-marketplace.png` | 1972 × 1406 | `120da29b4931f2dc78e9624dac3317a065875e9e2d233c33ef8bd59cb470d668` |
| A034 | `edu-app-center.png` | 1972 × 1406 | `f18a7a72c4eab473f2801ca77300b8bb6be9c4ddd3c70c365eec10720a2fdbe2` |
| A035 | `learncommunity-library.png` | 1972 × 1406 | `2a509bc27d0a8f884a49974e62020a87ef26cdcad53e46b95833ede3c3de62ae` |
| A039 | `discovery-flow.png` | 2718 × 1368 | `26a9644cb05abf3c90179f75a0facaf7c23c0589619d189ee97b6d4a9439011b` |
| A040 | `provider-persona.png` | 2774 × 1368 | `a01e92cadd932ed9d79a5dd2f570419a016b3e1958a7c9999901c55b9928d5a6` |
| A044 | `public-discovery-plan.png` | 2514 × 964 | `523ef422840f53840439029e00fc53d836b78d63cd3ca8442b45fe029d85724e` |
| A051 | `canvas-discovery-plan.png` | 2588 × 1394 | `1b580f7921ffe17f97058eb42c13f750abdd68bc4fb377c338341b005753e0ad` |
| A053 | `catalog.png` | 2842 × 1428 | `b948222c79447456b5abf3808b859b1e90b237d4faf703b7038e37886fd146bb` |

## Interaction and accessibility

When the opening fits, the masthead and entire opening composition remain held while native scrolling advances Emerging AI Marketplace, Edu App Center, LearnCommunity Library, then the shared Marketplace. The image, selected source, and caption follow one reversible timeline. After the final hold, the heading word “catalogs” travels into the section navigation as the opening fades and Research replaces it. The navigation first appears during this handoff, without a top or bottom rule, and marks Research current. The same Research article then continues in normal page movement; there is no duplicate preview article.

Source choices and Continue to Research provide direct alternatives. Image activation opens the original inspection with fit and actual-size views. All four originals, captions, and the primary narrative are server-rendered. Native file links work without JavaScript; optional disclosures retain research and planning qualifications. A measured fit check enables the compact sequence on sufficiently tall phones. Short screens, narrow landscape, content that no longer fits, reduced motion, and catalog-artifact hashes use normal flow with all four images. Keyboard focus, direct hashes, history, resizing, and inspection have explicit continuity safeguards. The route remains noindex/nofollow. Exact progress intervals, geometry, input rules, and reference differences are recorded in the [implementation contract](marketplace-confluence.md).

## Release scope

UAT only. This sequence revision changes no timeline data, original assets, storage, authentication, environment configuration, dependencies, production, or existing CCP behavior. The Marketplace Board entry remains authored. Checks for this revision are pending at document authoring; the final release PR must record application, browser, exact-preview, and merged-UAT results. Implementation acceptance remains separate from the owner-approved prototype.
