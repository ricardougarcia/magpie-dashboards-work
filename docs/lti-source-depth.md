# LTI source inspection

The owner requested three additional sources within the LTI project and the replacement of the A076 Canvas configuration dialog. The page keeps its Editorial Relay composition. Its source viewer now connects the displayed artifact to related original designs and selected regions of the planning boards.

## Sources and application ownership

All source images are repository-owned files under `public/portfolio/lti/`. Application URLs use `/portfolio/lti/...` and are served by the application's own deployment. The added assets have no Wix URL, image proxy, redirect, or runtime download dependency. Deprecating Wix does not affect their availability.

The archive paths below record provenance only. They are not runtime dependencies. Source bytes were copied without redrawing, enhancement, conversion, or embedded-image replacement.

| Source | Original local file | Application file | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | --- | ---: | --- |
| A080 | `portfolio-migration-research-2026-09-06/assets/A080__7eca65_924d40ebd69a4ecb82a54bc0f91ab813~mv2.png` in the parent GANT workspace | `public/portfolio/lti/configuration-paths.png` | 2612 × 1484 | 307277 | `b21f37cae04088ba237e0bd2b438f54eef67083abe91ec60865fb4a34f90c652` |
| A079 | `portfolio-migration-research-2026-09-06/assets/A079__7eca65_9d786c6462c34f538d4a04dd058b97e6~mv2.png` in the parent GANT workspace | `public/portfolio/lti/integration-details.png` | 2770 × 502 | 292915 | `bb5679ca7109b87e9f7708dc15b4e86bbad8708123378abe3b7e6e2d8bcb5329` |
| Planning | `/Users/ricardogarcia/Downloads/LTI + LC  - Planning & Schema.png` | `public/portfolio/lti/planning-schema.png` | 4448 × 2308 | 472850 | `5e87f7a7da45ffb0c653bae9f1a8057fbfac4d8b6a2986df6638e854ec026c6b` |

The Planning source has no archive asset identifier; `Planning` is its display label. It is not assigned a fabricated `A` or `W` number.

## Inspection content

`src/data/lti.ts` holds the asset metadata, descriptions, notes, and source-pixel regions. Each inspection begins with the complete artifact displayed on the page.

| Page location | Related source views | What the source establishes |
| --- | --- | --- |
| Planning | Complete Planning & Schema board; library, provider, and administrator journeys | Distinct actor journeys, a Save/Publish branch, integration-version questions, and draft planning dependencies |
| Discoverable | A079 Placements, Services, and Description; complete A079 source | The integration details behind a product listing |
| Controllable | Provider journey from Planning & Schema | Separate viewing and creation paths, data entry, and a Save/Publish decision |
| Configurable | A080 complete board and URL, manual, and JSON paths | Setup states, error handling, configuration categories, and review variants |

A080 replaces A076 in the page's `configure` asset. The implementation does not retain A076 as an alternative inspection view. W002, A078, and A081 remain the existing primary assets in their respective locations.

All selected regions are presentation crops measured from the top-left corner of the original image. The full local source remains available. The viewer must show the transparent Planning & Schema PNG against a light background so that the original dark text remains legible.

## Evidence and resolution limits

These sources document planning and interface design. They do not establish shipped behavior, the final release date, or measured product outcomes. Provider table records are sample data. The draft timeline and working comments remain identified as planning evidence.

A080's individual screens are small within a 2612 × 1484 export. Its path labels and sequence are visible; its smallest field text cannot be made fully legible by enlargement. The implementation must preserve this source limitation rather than invent or regenerate interface text. The Planning & Schema source similarly contains small embedded screenshots; its actor journeys and decision annotations carry the primary evidence.

The three originals were visually inspected at their original resolution. No credentials, access tokens, passwords, or private keys were observed. The Planning & Schema board includes demo application URLs, product/company IDs, author names, and working comments. These remain part of the original design record; embedded URL text is not a linked runtime dependency.

## Verification

The three copied files match their original bytes, dimensions, and SHA-256 digests. Every new image URL is local to the application. Inspection regions are bounded by their source dimensions, and each inspection retains a complete source view.

Application checks, visual checks, interaction checks, and deployment verification are recorded with the implementation review. This provenance note does not claim that those checks have passed.
