# LTI Editorial Relay

The owner selected **Editorial Relay** from the three merged LTI studies. The implementation preserves the selected composition, wording, archived source assets, and native-scroll motion while using the Portfolio's shared work-sample header.

## Narrative and evidence boundaries

The opening, **“An integration is also a release.”**, introduces the dependencies across provider tools, institutional workflows, and the public marketplace. Three connected boxes describe **Integration**, **Provider experience**, and **Marketplace**. They are a reading map of delivery workstreams, not a system architecture or a verified chronological record.

The planning decision, **“Wait for LTI 1.3. Include it in the provider launch.”**, is documented in W002. The source records a decision and dependencies; it does not establish the final shipped date.

Three editorial spreads then explain the experience principles: **Discoverable**, **Controllable**, and **Configurable**. These are distinct from the opening workstreams, with no implied one-to-one mapping. Their evidence is the product detail, provider product table, and Canvas configuration dialog. Task lists from the opening are not repeated in the body.

The closing, **“Different methods. One coordinated effort.”**, retains the reported use of Agile with engineering, Kanban with contractors, and critical-path planning. The reported scope of more than 900 tools describes onboarding, validation, and data hygiene work. It is not an adoption or impact measure. Counts and records in the provider table are sample data; no résumé metric is reassigned to this case.

## Sources

The recovered archive is `portfolio-migration-research-2026-09-06` in the parent GANT workspace. The portfolio case record is `source-pages/work--lti.txt`, particularly lines 10–54. The recorded release decision is in `authenticated-wix/text/W002.txt`, lines 144–154, and the original process-map PDF, `authenticated-wix/assets/W002__LTI + LC  - Process & Timeline (1).pdf`.

The selected rendering is `artifacts/lti-merged-studies/relay.html`, combined with `connected-hero.html`, `shared.css`, and the transforms in `assemble.py`. The completed interactive review is `lti-merged-directions.html` in the session's visualization directory. The application uses the archived original PNGs rather than the compressed previews embedded in that review.

| Source | Archived file | Application file | Original dimensions |
| --- | --- | --- | --- |
| W002 | `authenticated-wix/review/W002-1.png` | `public/portfolio/lti/planning-process.png` | 6000 × 1638 |
| A078 | `assets/A078__7eca65_3b85659a3dd44fbcb3dc177c3fb19aed~mv2.png` | `public/portfolio/lti/product-detail.png` | 1034 × 1178 |
| A081 | `assets/A081__7eca65_f7d4d1f71ca54b7393cd99f408d1461a~mv2.png` | `public/portfolio/lti/provider-products.png` | 1724 × 574 |
| A076 | `assets/A076__7eca65_0d68f140b5754f4285a369933d0f9ac5~mv2.png` | `public/portfolio/lti/canvas-configuration.png` | 810 × 1006 |

No source interface is redrawn. Image metadata, accessible descriptions, and evidence-bound captions live in `src/data/lti.ts`.

## Motion brief

- The opening's three boxes close their 36 px horizontal gaps as reading progresses. At phone widths, the boxes stack and close their 22 px vertical gaps. Scrolling back reverses the connection.
- The three body spreads approach by up to 20 px as each enters. Short vertical contacts grow between neighboring spreads. Large words and horizontal rules respond to local reading progress.
- Original source brackets draw over 420 ms. The source-image hover scales to 1.015 over 600 ms. Notes settle with a short opacity and position transition, and source inspection resolves over 320 ms.
- Workstream-note emphasis supports pointer, keyboard, and touch. Source inspection supports keyboard access, Escape dismissal, focus return, and the original source pixels.
- Reduced motion presents the settled, readable composition without scroll travel or transitions. Page scrolling remains native.

The study's proposal selector, simulated phone mode, automatic playback, and scrubber belong to the review tool and are not portfolio navigation.

## Verification

Asset provenance and implementation behavior are separate checks. Each copied PNG's byte length, dimensions, and SHA-256 digest were checked against the recovered archive. All four copied files match their source bytes:

| Source | Bytes | SHA-256 |
| --- | ---: | --- |
| W002 | 514597 | `14d72df8b363692ca68da696e9bb261509ddca6be6a493e2edf165813f6d62b4` |
| A078 | 536400 | `38408b85d5c68bcc52d137754f4e4efc8d01e8d98eab7bfa94795790b472dd82` |
| A081 | 133422 | `9449ee823fdd8d60369e1481394df742c2341712410206165744d52af8e6d067` |
| A076 | 132809 | `b8dc07410dec5cd24e4479c3f90cb997cee82e0ee993943536feb34c9e85f06d` |

Application checks, browser behavior, and deployment verification are recorded with the implementation review; this source note does not claim those checks have passed.
