# Marketplace Research: Shift the lens

## Approval and scope

The owner approved the Research “Shift the lens” study on September 14, 2026, with an explicit exclusion: no additional Research artifacts or disclosure. The local approved reference is `research-shift-the-lens.html` in the Codex visualization folder for thread `01a09678-22e5-7910-b499-12316e657b2b`. This document records the approved implementation contract. The release PR records the actual checks and deployment result; approval of the study remains separate from review of the hosted implementation.

The approval covers this Research composition and interaction. It is not blanket acceptance of Marketplace aesthetics and does not establish Marketplace as an approved global Portfolio reference. The existing [Catalog Confluence and word handoff](marketplace-confluence.md), Delivery, Impact, factual qualifications, and Board return remain in place.

## Narrative and evidence boundaries

The existing Research section keeps `#investigation`, its heading “Start with the people / on both sides,” and its arrival geometry. The supporting paragraph is:

> Educators needed confidence in what they found. Providers needed ownership of what others found about them.

The lens preserves `#people` and presents one conceptual ed-tech listing. Its three areas connect audience and purpose, product information and trust signals, and provider contact. The perspective changes; the listing remains the same point of reference.

| Listing area | Educator need | Provider need |
| --- | --- | --- |
| Identity and audience | Discovery: “Is this right for my needs?” | Visibility: “Will the right educators find us?” |
| Product overview | Evaluation: “What helps me evaluate it?” | Ownership: “Can we represent our product clearly?” |
| Contact | Connection: “How do I learn more?” | Inquiries: “Can interest become a conversation?” |

These statements are research framing and are not presented as participant quotations. The listing is illustrative: it names no specific product or certification, and its contact area is an interaction region rather than a live contact form. Interoperability, privacy, and efficacy are generic information areas, not certification claims. The visible caption “Conceptual listing · no specific product or certification” remains with the composition.

The conclusion is “Different needs. The same point of connection.” Its supporting sentence is “What an educator needs to understand is also what a provider needs to represent.” This expresses the relationship between the needs; it does not introduce a new measured research result or delivery claim.

Research no longer renders the original discovery flow (A039) or provider persona (A040), including in a disclosure. Both PNG files and their asset records remain in the repository. The page retains the six catalog and planning originals elsewhere. Provenance and hashes remain in the [case-study record](edco-marketplace.md).

## Scroll and interaction contract

Research uses a separate native scroll hold beneath the masthead and section navigation. Enhancement is enabled only when the complete lens stage fits the available viewport and its field is at least 640px wide. The heading stays in normal document flow; the listing, active annotations, and conclusion form the stable held composition. Scrolling changes attention within the lens before normal page travel resumes. The existing Catalogs-to-Research handoff arrives at this same Research DOM, not a duplicated preview.

The Research timeline uses these phases:

| Progress | Focus |
| --- | --- |
| 0–11% | Educator discovery |
| 11–27% | Educator evaluation |
| 27–45% | Educator connection |
| 45–64% | Provider visibility |
| 64–78% | Provider ownership |
| 78–91% | Provider inquiries |
| 91–100% | Shared conclusion emerges |

The perspective shift is blended over 44–56%, so it overlaps the change from connection to visibility. The shared conclusion blends in over 91–100%. The selection stops are 0, 16, 32, 57, 70, 83, and 100%; the first six represent the six needs and the last represents the conclusion.

The study's motion remains restrained and tied to meaning:

- Annotation travel is 12px. Surrounding structure stays quiet while the active need changes.
- Arrowless hairline connectors join the active annotation to its listing area. They express a relationship without directional arrow decoration.
- The focus frame follows the selected listing area over 650ms with the study's `cubic-bezier(.16, 1, .3, 1)` easing.
- Direct perspective or listing selections settle over 850ms with cubic ease-out. Native scrolling remains controlled by the reader and reversible.
- The perspective indicator moves from educator to provider and opens into a shared state at the conclusion.

Native buttons expose Educator and Provider choices. The three listing regions respond to activation and keyboard focus; pointer hover offers the same focus discovery without becoming the only way to use the composition. Controls retain visible focus and touch targets of at least 44px. Manual interaction must remain coherent with subsequent native scrolling and reverse scrolling.

Hover waits for a 120ms dwell within one listing region so moving across it toward another control does not immediately change the scroll position. Leaving the region or starting native scrolling cancels that pending hover. Click and focus do not wait for the dwell.

## Responsive and static behavior

The available height is measured below the current masthead and section navigation, with 16px of separation above and below the held stage. Enhanced fields of 640–780px use a compact listing-and-annotation layout. A field narrower than 640px uses normal flow, including on tall phones. A width threshold alone does not enable the hold: the full measured stage must also fit. Phone layouts place the listing above the paired needs and omit connectors.

No JavaScript, reduced motion, short screens, narrow fields, or any measured failure to fit use normal document flow with all six needs and the conclusion available. Content is not clipped or hidden to force enhancement. The fallback retains the listing's illustrative caption and unquoted research framing. Native section hashes and keyboard access remain usable.

The live page has no study playback button, progress slider, desktop/phone selector, Tweak panel, or Research artifact disclosure. Those controls belong to the preview environment, not the case-study narrative.

## Verification required before release

The release PR must record focused and full application checks, direct and continuous native-scroll checks, comparison with the approved study, fit and short-screen fallback behavior, reduced motion, keyboard/touch access, hashes/history, runtime errors, route protections, and exact-preview then merged-UAT verification. Distinguish controller tests, browser viewport checks, and physical-device acceptance. A passing functional test does not establish visual fidelity or owner acceptance. Production remains outside this revision's release scope.
