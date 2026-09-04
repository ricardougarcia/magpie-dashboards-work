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

**Guiding Light tags remain private.** The public page receives a server-filtered payload that omits the field, and the raw timeline API requires an authenticated editor session.

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

The owner workspace supports horizontal drag-to-move placement, start and end month controls, lane changes, new item creation, deletion, every detail-card field, one or two Guiding Light tags, constrained color tokens, relation targets and descriptions, and image, GIF, or video uploads up to 25 MB. Saving increments the persisted timeline version and updates its timestamp.

## Data source and integrity

The supplied handoff documents are preserved in `docs/source/`. The seed dataset in `src/data/timeline.seed.json` is generated from `magpie-dashboards-timeline-item-details.md` with `scripts/parse_timeline.py`.

Run the complete verification suite before pushing:

```bash
pnpm check
```

This command validates all 45 source records and relation targets, runs ESLint, and produces a full production build.

## Deployment

The production project is linked to [`ricardougarcia/magpie-dashboards-work`](https://github.com/ricardougarcia/magpie-dashboards-work). The main branch is the production source. Connect a Vercel Blob store to the project, set `EDIT_PASSWORD` and `SESSION_SECRET`, then deploy the latest main-branch commit.

No alternate deployment target is supported by this repository.
