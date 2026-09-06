# Magpie Dashboards work timeline

An interactive portfolio timeline presenting Rico Garcia’s Magpie Dashboards product leadership from January through September 2026. The public experience uses a responsive Gantt-style canvas with docked work-item details, relation tracing, media previews, and a distinct planned-Q4 rail. A protected owner workspace at `/edit` supports durable content and media updates.

## Application structure

| Area | Implementation |
| --- | --- |
| Public timeline | Server-rendered Next.js page with an interactive React Gantt canvas |
| Owner editor | Password-protected `/edit` route with draggable placements and complete record editing |
| Authentication | Server-side shared-secret verification and an HTTP-only signed session cookie |
| Persistence | Timeline JSON and media artifacts stored in Vercel Blob |
| Source data | Forty-five validated items generated from the source handoff document |
| Hosting | GitHub-connected Vercel project only |

**Guiding Light tags power the public focus row.** Its decorative pointer treatment uses one high-DPI canvas across the Learn-to-Grow span. A frame-driven nib interpolates coalesced pointer input into a densely overlapping, morphing dark stroke with a persistent forward wet head, sparse advancing leak blots, a trailing gray dry-out stain, and partial text inversion. The labels use a muted resting opacity, strengthen on hover or focus, and return to full contrast when selected while preserving difference-based inversion over the ink. The canvas is non-interactive, stops emitting outside the row, ignores touch input, and is removed when reduced motion is preferred. The raw timeline API and all editor write operations still require an authenticated editor session.

The five work lanes use a restrained, perceptually separated accent set: technical blue for Eng Build, botanical green for Product Build, archival violet for Product Discovery, drafting umber for Processes, and dark coral for Challenges. These lane-only accents are applied through the existing color-token classes so public bars, editor bars, relation chips, and telemetry notches remain synchronized. The global signal red continues to own focus, selection, connector, cursor, and warning interactions and must not be replaced by the lane coral.

## Local development

Install dependencies and create a local environment file:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The public timeline is available at `http://localhost:3000`. The editor is available at `http://localhost:3000/edit`.

Without a `BLOB_READ_WRITE_TOKEN`, the public experience reads the committed seed data. Editor saves and media uploads intentionally fail with a clear storage-configuration message until a Blob store is connected.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `EDIT_PASSWORD` | Shared secret for owner access to `/edit` |
| `SESSION_SECRET` | Independent high-entropy key used to sign the editor session cookie |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token, supplied when the store is connected |

Never commit real values. Configure all three variables for Production, Preview, and Development in Vercel.

## Editor capabilities

The owner workspace supports horizontal drag-to-move placement, start and end month controls, lane changes, new item creation, deletion, every detail-card field, one or two Guiding Light tags, constrained color tokens, Connected Work targets and descriptions, and image, GIF, or video uploads up to 25 MB. Media uploads use a short-lived authenticated token and travel directly from the browser to Vercel Blob, avoiding the Vercel Function request-body limit while retaining editor-only authorization, progress feedback, and server-enforced file policies. Intrinsic dimensions are stored when available; low-resolution GIFs receive editor guidance and are never enlarged in public or editor previews. Saving increments the persisted timeline version and updates its timestamp.

Selecting an item in the editor automatically shows every line in that item’s Connected Work network. One item-level **Edit orthogonal lines** button opens the complete network workspace, where all eligible routes remain visible and only the active line exposes terminals, segments, midpoint injection handles, and elbows. Each route remains a strict source-item-to-related-item connection; the line editor cannot create links between Connected Work targets or add relationships outside the item’s Connected Work fields. The public timeline, normal editor, and dedicated workspace all use the same overlap-aware lane-row assignment and the same default-route generator, so a route’s terminals, H/V signature, and elbow count do not change between views. Opening the workspace materializes any previously generated fallback into reciprocal local state, and save preparation performs the same repair as a final safeguard; every displayed route therefore becomes explicit persisted data rather than a view-only approximation. Reciprocal relationships share one canonical saved edge, reversed for the opposite endpoint, so editing either direction updates both records. Compact zero- and one-elbow route topology is preserved across the connector workspace, normal editor preview, and responsive public timeline rather than being reinterpreted into view-specific doglegs. When a dragged square terminal comes within six pixels of making its first and third segments collinear, it snaps to the shared axis and removes the redundant bridge and elbows; positions beyond that narrow threshold remain manual. Connector strokes paint below Gantt item surfaces in every view, while the dedicated editor keeps terminal and elbow controls in a separate upper layer.

Production editor data lives in Vercel Blob rather than the code repository, so normal GitHub pushes and Vercel deployments do not replace owner edits. Every successful save writes and verifies a new immutable, randomly suffixed version snapshot; public and editor reads select the highest stored version directly, avoiding the cache delay associated with overwriting a public Blob pathname. The older mutable canonical record remains a migration fallback only when no version snapshot exists. Future schema changes must pass the save-preservation regression before deployment.

## Data source and integrity

The supplied handoff documents are preserved in `docs/source/`. The seed dataset in `src/data/timeline.seed.json` is generated from `magpie-dashboards-timeline-item-details.md` with `scripts/parse_timeline.py`.

Run the complete verification suite before pushing:

```bash
pnpm check
```

This command validates all 45 source records and relation targets, runs the connector geometry, editor persistence, selected-modal, presentation, and interaction regression suites, runs ESLint, and produces a full production build.

## Deployment

The production project is linked to [`ricardougarcia/magpie-dashboards-work`](https://github.com/ricardougarcia/magpie-dashboards-work). The main branch is the production source. Connect a Vercel Blob store to the project, set `EDIT_PASSWORD` and `SESSION_SECRET`, then deploy the latest main-branch commit.

No alternate deployment target is supported by this repository.
