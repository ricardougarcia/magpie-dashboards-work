# Build handoff: Magpie Dashboards portfolio Gantt application

## 1. Purpose

Build a single page web application that presents Rico Garcia's Magpie Dashboards work (January-September 2026) as an interactive Gantt-style timeline. The application is a portfolio presentation piece for recruiters and hiring managers, not a planning tool. It must be scannable, fluid, and visually distinctive.

A companion data document, `magpie-dashboards-timeline-item-details.md`, contains the complete item inventory with every field value (description, placement, value, lane, relations, guiding light). A second document, `magpie-dashboards-timeline-handover.md`, contains project context, terminology, and interpretation rules. Treat both as the content source of truth. Do not invent, rename, merge, or omit items.

## 2. Deployment constraints (hard requirements)

- Source code lives in the owner's personal GitHub repository: `https://github.com/ricardougarcia/magpie-dashboards-work`.
- Hosted on the owner's Vercel account, connected to that repository.
- Never host or deploy this application anywhere else. No alternate hosts, mirrors, or third-party deployments.

## 3. Core concept

A Gantt view with horizontal lanes and a month axis reading left (January) to right (September). Items render as bars within their lane, positioned by their start and end months. Selecting an item opens a card (modal) with details and media. Items relate to one another; those relations are interactive and drawn visually.

### Lanes

Lanes represent ownership categories of work. Source lanes from the data document:

- Eng Build
- Product Build
- Product Discovery
- Processes
- Challenges Planned / Unplanned (referred to as "Curve balls" in presentation contexts; the editor may rename display labels)
- In-Flight / Future (planned Q4 items; render distinctly, for example as a right-edge column or ghosted bars past September, since they are planned rather than placed)

### Time axis

- Months January through September 2026, abbreviated labels (Jan, Feb, ... Sep).
- Item placement resolution is whole month or mid month only. No finer dating. Placement displays as abbreviated month labels (for example, "Mar - May").
- Two items are intentional duplicates across lanes (ROAR Phoneme Rework; the Data Deletion pair). Render both instances; their cards cross-reference each other.

## 4. Item card (modal)

Opens on selection. Must not obstruct the Gantt view: position it in available space (for example, a side panel or docked card) and reflow responsively so views never crunch or overlap. Fields:

- **Media**: one artifact per card; accepts images, GIFs, or videos. Clicking the media enters "preview mode": a larger, focused view of the media in the UI. Clicking anywhere outside the media exits preview mode and restores the exact prior state (selected card open, Gantt view as it was).
- **Description**: very brief description of the work. Values in the data document.
- **Placement**: start and end as abbreviated month labels. Values in the data document.
- **Value**: the impact and value of the work. Values in the data document.
- **Lane**: the item's lane.
- **Relates to**: a list of labels, each exactly matching another card's name, color matched to those cards. On hover or click of a relation label: apply a visual highlight treatment to the related card(s) in the Gantt view and draw a connecting line from the current item to each related card. Below the labels, the modal shows a very brief description of how the items are connected. Relation pairs and their connection descriptions are in the data document under each item's "Relates to" field.
- **Guiding Light** (visible only in edit view, never in the public view): a theme tag used for UI treatments. Allowed values only: Learn, Fix, Stabilize, Govern, Grow. Some items carry two tags.

## 5. Interaction states

- **Hover**: subtly elevates the Gantt item visually and activates (shows) its modal. The elevation treatment is very subtle.
- **Click (select)**: the item appears subtly depressed, like a pushed button, and its modal stays visible without obstructing the Gantt view.
- **Deselect**: clicking anywhere in the Gantt view area (not on an item) deselects the current item.
- **Preview mode**: see Media above. Entering and exiting must be smooth and fully reversible.

## 6. Edit mode

- A separate URL with the same view plus edit functionality.
- Password protected so only the owner can access it. Recommended implementation: a single shared secret stored as a Vercel environment variable, checked server-side (middleware or API route). Never commit the password to the repository. Do not rely on client-side-only checks.
- Editor capabilities:
  - Move items (change placement) on the Gantt.
  - Create new items.
  - Update any modal field, including media, relations, and Guiding Light tags.
  - Change item colors, constrained to the design schema's palette so edits cannot break visual consistency.
- Edits must persist across sessions and deployments. Recommended: store item data as JSON, with writes going to a persistent store the Vercel app can reach (for example Vercel Blob or KV, or commits back to the repository via API). Flag the chosen approach to the owner before building; a purely static bundle cannot persist edits.
- Media uploads from the editor need a storage target (repository `public/` folder committed via API, or Vercel Blob). Flag the chosen approach to the owner.

## 7. UI and design direction

Style reference: `https://heronaiapp.com/`. Follow its schema and principles, not its content. Extracted principles:

- **Monochrome-first palette**: black, white, and grays carry the interface. One accent color reserved for emphasis (Heron uses red for alerts). For this app, accent usage should serve relation highlighting and the Guiding Light treatments.
- **Technical annotation aesthetic**: bracketed index labels ([01], [02]), small uppercase metadata rows (TYPE, FOCUS, LOCATION), coordinate readouts, and code-tag chips (Heron's "IBC 1015.3" chips are a good model for lane or theme tags).
- **Bold editorial typography**: large uppercase display headings, tight and confident; small mono or grotesque type for metadata and labels.
- **Sketch and blueprint texture**: line-drawn imagery and diagrammatic visuals rather than glossy illustration. Fits the Gantt subject naturally.
- **Fluid, scroll- and cursor-reactive motion**: subtle, physical-feeling transitions. Motion should clarify state (hover, selection, relation lines), never decorate for its own sake. Respect `prefers-reduced-motion`.
- **Generous whitespace and grid discipline**: dense information presented calmly.

The app is single page. No additional navigation. Fluid, dynamic, and responsive across desktop, tablet, and mobile; the Gantt and modal must reflow without crunching or obstructing each other at any viewport size.

## 8. Content seeding

Seed the application with the full inventory from `magpie-dashboards-timeline-item-details.md`: every item, its fields, its relations with connection descriptions, and its Guiding Light tags. Media artifacts are not yet provided; render a tasteful placeholder state per card until the owner uploads media through the editor.

Data hygiene rules carried over from the handover doc:

1. Item names are verbatim and act as stable identifiers for relations. A relation label must always match its target card's name exactly.
2. Placements in the data document are owner-validated month ranges; do not re-derive them.
3. Do not deduplicate the intentional cross-lane duplicates.
4. Copy style for any generated text: plain, direct, active voice, sentence case, no em-dashes.

## 9. Open decisions for the owner

Confirm these before or during build:

1. Persistence mechanism for edits (Vercel Blob, KV, or repo-commit) and media storage target.
2. Edit URL path (for example `/edit`) and the password delivery method.
3. Display label for the Challenges lane ("Curve balls" vs. the source name).
4. Rendering treatment for In-Flight / Future items (right-edge column vs. ghosted bars).
5. Accent color and how Guiding Light tags map to UI treatments in the public view, given the tag itself is hidden there.
