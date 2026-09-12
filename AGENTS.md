<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# UAT and production release policy

Rico established this workflow on 2026-09-06 for `ricardougarcia/magpie-dashboards-work`. It supersedes the earlier standing permission to merge routine changes directly to production.

## Environments

| Environment | Branch | URL |
| --- | --- | --- |
| UAT | `uat` | https://magpie-dashboards-work-uat.vercel.app |
| Production | `main` | https://magpie-dashboards-work.vercel.app |

Both use the existing Vercel project `magpie-dashboards-work`. Vercel's custom environment `uat` matches only the `uat` branch. Production remains tied to `main`.

UAT is initially a public-page preview with a separate Blob store (`magpie-dashboards-uat`). Its `BLOB_READ_WRITE_TOKEN` is scoped only to the custom UAT environment. Production credentials must never be copied into UAT. UAT has no editor password or session secret configured; editor access is not part of the initial setup. Existing public media URLs may be read from production storage. The initial timeline snapshot matches production; later production content edits do not automatically update the isolated UAT copy.

## Authority

For assigned routine work, Codex may implement, review, and merge a focused pull request into **UAT** after the gates below pass. Do not add unrelated work by Manus or other contributors.

**Only merge UAT into production after Rico explicitly requests that release, following his preview of the UAT URL.** Earlier blanket permission to merge is not production-release authorization. Do not deploy directly to production, promote a preview, or merge a feature branch straight to `main` to bypass this requirement.

Production data writes, migrations, authentication changes, secrets, environment changes, repository administration, destructive operations, and rollbacks require task-specific authorization unless Rico already authorized them. The initial UAT environment and isolated copy of public portfolio data are authorized setup work.

## Review and UAT gates

1. Fetch fresh `main` and `uat`, inspect open PRs and differences, and start from `uat` in an isolated checkout on a focused `codex/` branch. If production changed independently, reconcile it into UAT before validation. Preserve other contributors' work; never force-push shared branches.
2. Review the complete diff and affected behavior, including data preservation, security, connector parity, responsive layout, and accessibility. Resolve actionable P0-P2 findings.
3. Run `pnpm check` for application changes and validate the Vercel preview at the exact reviewed SHA. Documentation-only changes require diff and link verification, not invented application test claims. Missing checks are not evidence of passing tests.
4. Record review and verification evidence on the PR. A review from the author's GitHub identity must be a COMMENT, not an approving review or a claim of independent review. Respect required external approvals and repository protections.
5. Recheck PR head, UAT base, checks, reviews, and mergeability immediately before merging. Reassess concurrent changes and rerun affected checks. Squash-merge feature PRs into UAT using the reviewed head SHA as the API precondition.
6. Verify the exact merged UAT SHA reaches READY in Vercel and the stable UAT URL serves it. Check relevant desktop/mobile behavior, owner access boundaries, and runtime errors. Do not write portfolio data merely to verify a deployment. Give Rico the stable UAT URL for review.

## Approved production release and synchronization

This is an operator checklist; no background service automatically merges or releases branches.

1. Confirm Rico's explicit release request covers the current UAT revision. Fetch both heads again. If UAT or main changed since his preview, reassess and preview any new behavior before proceeding. Coordinate with asynchronous contributors so new UAT work waits until synchronization finishes.
2. Open or update a release PR from `uat` to `main`. Verify the complete release diff, applicable checks, review evidence, and exact UAT deployment. Reconcile any new production commits into UAT and revalidate before releasing.
3. Merge the release PR with a **merge commit**, using the reviewed UAT SHA as the API precondition. Do not squash or rebase UAT-to-main releases: preserving ancestry permits a safe fast-forward back to UAT.
4. Fetch the resulting `main` SHA. Fast-forward `uat` to that exact SHA with `force: false`. If concurrent UAT commits prevent the fast-forward, stop and reconcile them without discarding work; do not report the release complete while the branches differ.
5. Verify `main` and `uat` point to the **same commit SHA** and both Vercel environments have READY deployments of it. A ref update may require explicitly triggering a UAT deployment; verify instead of assuming the webhook ran. Never point UAT at the production deployment because that would share production credentials.
6. Compare the public timeline data and displayed behavior at both stable URLs. For a code-only release, refresh the isolated UAT snapshot from the current public production data if needed, after checking for UAT-only content that must be preserved. Do not overwrite production content with a UAT snapshot unless Rico separately authorized that content release. Resolve any content difference before declaring the environments matched.
7. Report completion only when code and public content match. Keep environment-specific URLs, storage credentials, and editor access isolated. The favicon is intentionally white in UAT and signal red elsewhere, selected using `VERCEL_TARGET_ENV` from identical application code. Leave the task checkout clean and synchronized.

## Failure handling

Fix failures within the assigned scope or explain the blocker. Do not bypass protections, discard concurrent commits or content, treat absent checks as passing, or release an unverified revision. No automatic processing of unrelated PRs is authorized.

# Portfolio design context

For Portfolio design work, read [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md), and the relevant profile in [Portfolio context v2](docs/portfolio-context.md), then load the target's Impeccable surface brief. These records reconstruct the approved implementation and supersede the older vision as the starting point for design decisions. [Design history](docs/portfolio-design-history.md) records superseded settings; [the evidence manifest](docs/portfolio-context-evidence.json) pins the source revisions.

Rico confirmed Magpie, Board, and CCP as approved during this reconstruction. **Exclude EdCo Marketplace design from shared guidance, extraction, critique baselines, and reusable patterns until Rico reviews it.** Newer UAT code alone does not establish design approval. Preserve each named effect's exact scope, geometry, timing, input behavior, and reduced-motion behavior; do not replace them with generic cursor, pixel, or parallax presets.

For a new Project, propose distinct directions and develop an annotated wireframe after selection. For a refinement, preserve the approved surface and its evidence. Keep pending future concepts and Impeccable's build-path choice explicitly unresolved until answered. Update the affected context profile and source evidence when an approved design changes. Existing UAT and production release rules above continue to apply.
