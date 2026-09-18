# Production route and search candidate

The candidate reuses the accepted portfolio pages at `/theboard`, `/resume`, and `/theboard/{magpie,gcm,marketplace,ccp,portal,lti,pmf}`. Canonical URLs use `https://ricardougarcia.com`. It does not assign domains, create the proposed production alias, or change remote environment variables.

Search launch is deliberately disabled by default. `PORTFOLIO_PUBLIC_LAUNCH=true` is honored only with `VERCEL_ENV=production`, a production (or absent) `VERCEL_TARGET_ENV`, and the actual `Host: ricardougarcia.com`. Forwarded host headers cannot activate indexing. The nine intended routes receive index/follow metadata and headers only when all conditions pass. Every other route/host remains noindex/nofollow, including the existing Magpie Vercel root, UAT, generic Preview, editor/API paths, unknown paths and resume treatment URLs. Direct public media and PDF responses also receive noindex headers. Preview/UAT sitemaps are empty and their robots file advertises no sitemap. Production exposes only the nine canonical page URLs in its sitemap.

On every environment, robots excludes editor/API paths and permits public crawling so crawlers can read redirects and noindex directives. A blanket robots disallow would prevent a crawler from reading noindex and can leave a known URL indexed without page content. This crawl policy does not disable deployment protection or application authorization; both remain independent access boundaries.

The candidate implements these explicit Wix links for review on every environment:

| Source | Destination |
| --- | --- |
| `/work`, `/copy-of-work` | `/theboard` |
| `/work/dashboards`, `/work/copy-of-marketplace` | `/theboard/magpie` |

At the enabled custom-domain launch, `/drawer` redirects to `/theboard` and each known `/work/{magpie,gcm,marketplace,ccp,portal,lti,pmf}` redirects to the corresponding `/theboard/` route. UAT/preview retains those existing page routes. Redirects use 308, retain query strings and supply no fragment, allowing browsers to inherit the incoming fragment. `www.ricardougarcia.com` redirects to HTTPS apex only under the production launch gate. Write methods are not redirected by this policy; existing authentication remains responsible for editor/API access.

Recommended but **pending owner review**: custom-domain `/` redirects to `/theboard`. This requires a separate `PORTFOLIO_ROOT_REDIRECT=theboard` setting in addition to the launch gate; it is OFF in the candidate. The existing `magpie-dashboards-work.vercel.app/` continues to display Magpie and remains noindex, regardless of that setting.

## Wix retirement decisions still required

The archival `portfolio-migration-research-2026-09-06/route-map.csv` and September 18 launch plan identify `/about`, `/contact`, `/volunteer`, `/news`, `/blog`, and `/single-post/2019/10/03/marbles-and-moments` without accepted new equivalents. Other individual Wix posts may also exist. These paths receive no blanket redirect and will return 404 on the candidate. Preserve the Wix archive and decide individually whether to retain, replace, redirect to an actual equivalent, or explicitly retire them before cutover. The live `/work/dashboards` route is included in addition to the archival Magpie path.

## Verification boundary

The hosted candidate can verify the four non-colliding Wix routes and the default noindex behavior. Production-only redirects, apex indexing and the optional root redirect are exercised with local production-environment/host tests; they are not evidence that production domains or launch settings have been activated. Candidate approval must include the root and Wix retirement decisions. Activating the launch flag or assigning domains remains a separately approved release action.
