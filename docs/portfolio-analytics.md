# Portfolio visitor analytics

Vercel Web Analytics collects page views only when the deployment is production, the browser origin is `https://ricardo-garcia-portfolio.vercel.app`, and the path is one of the nine public portfolio pages in `PUBLIC_PORTFOLIO_PATHS`. UAT, localhost, other aliases, editor/API routes, unknown pages, and the exclusion settings page are not tracked. No custom or server-side events are emitted.

The client checks the exclusion before mounting the analytics component and again before every event. It drops events when the owner marker is present, WebDriver is detected, or browser storage cannot be read. The event URL contains the origin and path only; query strings and fragments are removed. These controls supplement Vercel's bot filtering.

## Exclude a browser

1. Open `https://ricardo-garcia-portfolio.vercel.app/analytics/exclude` before visiting portfolio pages.
2. Select **Exclude this browser**.
3. Confirm the page says that visits are excluded on `ricardo-garcia-portfolio.vercel.app`.

Repeat for every browser, profile, and device, and after clearing site data or starting a private session. The setting is specific to the origin. A UAT confirmation does not exclude production visits. Already collected visits cannot be retroactively removed by this setting. If saving fails, the page reports failure rather than claiming the browser is excluded.

For Codex and browser automation, apply the same sequence to every new context. Test harnesses can set localStorage `portfolio:analytics:excluded:v1` to `1` in an initialization script before the first portfolio page executes. Never rely only on the browser user agent or WebDriver flag.

## Dashboard and measurement limits

The dashboard is https://vercel.com/rico-g-projects/magpie-dashboards-work/analytics. It provides aggregate visitor estimates, page views, referrers, country, device, operating system, and browser breakdowns. It does not identify people by name or email. Vercel's anonymous visitor identification expires after 24 hours, so totals are not an exact count of distinct people across days. Blocking analytics can reduce counts.

Collection requires Web Analytics enabled for this Vercel project and a deployed script. Check the dashboard setting before production release; do not claim collection is active based only on the SDK or project ID.

## Verification and release

- Run `PORTFOLIO_CONTENT_MODE=snapshot pnpm check` and the focused analytics tests.
- Verify zero analytics script requests/events on preview and stable UAT, on the exclusion route, in marked owner contexts, and in WebDriver contexts.
- In a production-configured build, intercept analytics collection requests. Verify one canonical pageview on initial load and another on client navigation; do not send those test events to Vercel.
- Verify saving the owner exclusion, reload persistence, cross-tab suppression, storage failure, and keyboard/mobile operation of the settings page.
- The feature branch disables automatic Git previews because normal preview credentials can include production Blob access. Create the review preview explicitly with snapshot mode and blank Blob token/store overrides for both build and runtime.
- Complete the repository's UAT review gate before production release. After release, set exclusions in the owner's available browsers and every Codex context before further browsing. Provide the exclusion URL for devices that cannot be configured remotely.

References: [Vercel Analytics](https://vercel.com/docs/analytics), [beforeSend](https://vercel.com/docs/analytics/package#beforesend), [privacy](https://vercel.com/docs/analytics/privacy-policy).
