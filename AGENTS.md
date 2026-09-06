<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Review and merge authority

Rico approved this standing policy on 2026-09-06 for `ricardougarcia/magpie-dashboards-work`. It supersedes older handoff instructions requiring a separate merge confirmation for each routine assigned change.

## Scope

For routine code and documentation changes Rico assigns to Codex, Codex may implement, review, and squash-merge the task's pull request after the gates below pass, without asking again at merge time. This includes the lane-padding change in PR #1.

This does not authorize merging unrelated work by Manus or other collaborators. Production data writes, data migrations, authentication or access-control changes, secrets, Vercel environment changes, repository administration, destructive operations, and production rollback require task-specific authorization unless Rico has already explicitly authorized them.

## Review and merge gates

1. Start with the latest `main` in an isolated checkout and focused `codex/` branch. Inspect open pull requests for overlapping changes. Preserve other contributors' work; never force-push shared branches.
2. Review the complete diff and affected behavior after implementation. Prioritize behavior, data preservation, security, connector parity, responsive layout, and accessibility. Resolve actionable P0–P2 findings before merging.
3. Run `pnpm check` for application changes, and validate the Vercel preview built from the exact head SHA. For documentation-only changes, verify the diff and relevant links; do not claim application tests ran when they did not. An empty GitHub check list is not passing evidence.
4. Record the review and verification evidence on the pull request. When using the same GitHub identity as the PR author, do not submit an approving review or describe a self-review as independent review. Any required independent approval must come from another eligible reviewer.
5. Recheck the PR head, `main`, outstanding reviews, required checks, and mergeability immediately before merging. If either commit changed since validation, reassess the diff and rerun affected checks. Squash-merge using the reviewed head SHA as the API precondition, and respect repository protections.
6. Verify the exact merged SHA reaches READY in Vercel. Check the canonical production URL, relevant desktop/mobile behavior, owner access boundaries, and runtime errors. Do not write Blob data as part of deployment verification. Leave the task checkout clean and synchronized.

## Failure handling

If a gate fails, fix issues within the assigned scope or report the blocker. Do not bypass protections, treat missing checks as success, or deploy an unverified revision. No background monitoring or automatic processing of unrelated PRs is enabled by this policy.
