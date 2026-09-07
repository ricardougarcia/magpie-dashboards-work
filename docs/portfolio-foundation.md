# Portfolio foundation

## Shared shorthand and intent

- **Board**: the space containing all portfolio Projects. The first surface is `/drawer`.
- **Project**: an independently addressable case study, initially `/work/ccp`.
- **Artifact**: a real supporting image, map, video, or document.

Use these terms consistently. Rico wants shared shorthand maintained as features evolve.

The agreed Project sections are **Context → Problem → Approach and decisions → Solution → Impact → Reflection**. Discovery/investigation is critical and belongs prominently in Approach and decisions. Sections can vary in depth or be omitted when irrelevant. Do not require a pivot, a shipped product, or measured impact for every future case.

The experience is visual first: large real Artifacts, compact annotations, workflow diagrams, and outcomes, with native expandable details for longer explanations. The desktop section rail becomes a compact mobile index. Scroll stays native; the existing hidden-scrollbar and overscroll treatment is inherited without changing the Magpie page.

## Implementation

`src/data/portfolio.ts` contains authored Project records using `src/lib/portfolio-types.ts`. Stable Project, section, block, decision, and Artifact IDs are independent of Board placement. Blocks support Artifacts, metrics, simplified flows, decisions, text, and details. The six section titles are the defaults, not six required database fields. Routes and the Board read the same collection. No timeline schema, Blob data, editor, authentication, environment, or existing `/` changes are needed.

`src/components/portfolio/` renders the shared presentation using scoped CSS and Server Components. Native links, anchor navigation, and details work without bespoke client state. Full-size Artifacts open locally hosted originals in a new tab so the reading position is preserved. `next/image` generates responsive delivery sizes. No external Wix runtime or asset dependency remains on these two pages.

New portfolio routes remain `noindex, nofollow` during UAT development, matching the previous drawer policy. Review metadata, canonical domain, and indexing when the expanded portfolio is approved for launch. The current Magpie route does not link to the Board yet.

## CCP source and editorial decisions

Content comes from the local research archive captured September 6–7, 2026, principally the public `/work/ccp` case and `/work` index at ricardougarcia.com. Research was discontinued at Rico's request; this implementation uses the existing archive and does not resume Wix inspection. **Never publish in Wix under any circumstances.**

- The work index supplies role, six-month duration, and team composition: four engineers, two designers, three contractors, and Rico as product manager.
- The case supplies the interview groups, 2.5 years of data, duplicate analysis, copy testing, prototyping, local-creation and matching releases, and reported outcomes.
- The two stated delivery stages are described without asserting a total project phase count: the work index says three phases while the detailed case describes two rollout phases.
- Contractor hours are withheld: the case says approximately 660 annual hours while the résumé says 330. Reconcile before reuse.
- The claim that duplicates were entirely eliminated is omitted as an absolute. The duplicate-reduction goal and approximately 25% baseline remain.
- Immediate time to value, −95% product-request support cases, and +130% administrator session duration are the case's self-reported outcomes, not independently validated analytics. The expanded measurement explanation notes that a measurement window is unavailable.
- Reflection copy and concise headlines are editorial synthesis of the source, not verbatim quotations or a newly claimed research event. Rico can refine these in UAT.
- Flow diagrams are simplified explanations of the published workflow. Provider matching can occur when a matching global product is available; the diagram does not implement the original product's behavior.

## Artifact provenance

Both files are unchanged copies from the recovered public portfolio, hosted under `public/portfolio/ccp/`:

| File | Archive ID / Wix media ID | Size |
|---|---|---|
| `workflow.png` | A109 / `7eca65_b251d050c73f46dd8f3f6292563e578f~mv2.png` | 5780 × 5060 |
| `request-experience.png` | A114 / `7eca65_f4590e2fdc7441f49e423111a838136a~mv2.png` | 2388 × 1572 |

The request screenshot is labeled as the existing experience, not the newly shipped creation wizard. The full workflow map is the actual planning Artifact. Unrelated platform screenshots and decorative stock-style images from the old case are not presented as CCP-specific evidence.

## Future direction, in phases

First complete Board → Project → Board for CCP, then validate the same template with Magpie and populate the remaining Projects. The eventual concepts are a Board that reorganizes around a question, an underdrawing revealing original thinking, and a visitor journey composed into a saved editorial drawing. The stable content and Artifact IDs support those relationships later; no speculative interaction engine or fabricated cross-project connections are included now.

## Release boundary

Use an isolated `codex/` branch from fresh `uat`, run `pnpm check`, verify responsive behavior and the exact Vercel preview, and record review evidence in a PR targeting UAT. Production release requires Rico's later explicit approval. Other contributors may push asynchronously; recheck both branch heads and the PR immediately before merge. Do not modify production data to verify a deployment.
