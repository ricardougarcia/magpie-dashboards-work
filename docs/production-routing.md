# Interim production route and search candidate

The candidate reuses the accepted portfolio pages at `/theboard`, `/resume`, and `/theboard/{magpie,gcm,marketplace,ccp,portal,lti,pmf}`. Canonical URLs use the proposed interim production origin, `https://ricardo-garcia-portfolio.vercel.app`. It does not assign domains, create that production alias, or change remote environment variables.

The interim plan keeps `ricardougarcia.com` on Wix. After separate review and publication approval, a Wix landing page will link to the new production site. Existing Wix pages keep their published URLs; hiding a page from navigation must not delete or unpublish it. These are links between two sites, not a DNS handover or an automatic homepage redirect. The Wix draft and its publication are outside this code change. A later custom-domain migration requires a separately reviewed origin/host change, link mapping, DNS/HTTPS verification, and approval.

Search launch is deliberately disabled by default. `PORTFOLIO_PUBLIC_LAUNCH=true` is honored only with `VERCEL_ENV=production`, a production (or absent) `VERCEL_TARGET_ENV`, and the actual `Host: ricardo-garcia-portfolio.vercel.app`. Forwarded host headers cannot activate indexing. The nine intended routes receive index/follow metadata and headers only when all conditions pass. Every other route/host remains noindex/nofollow, including the existing Magpie Vercel root, UAT, generic Preview, editor/API paths, unknown paths and resume treatment URLs. Neither the Wix apex nor its `www` hostname activates this interim release policy. Direct public media and PDF responses also receive noindex headers. Preview/UAT sitemaps are empty and their robots file advertises no sitemap. Production exposes only the nine canonical page URLs in its sitemap.

On every environment, robots excludes editor/API paths and permits public crawling so crawlers can read redirects and noindex directives. A blanket robots disallow would prevent a crawler from reading noindex and can leave a known URL indexed without page content. This crawl policy does not disable deployment protection or application authorization; both remain independent access boundaries.

The candidate implements these explicit Wix links for review on every environment:

| Source | Destination |
| --- | --- |
| `/work`, `/copy-of-work` | `/theboard` |
| `/work/dashboards`, `/work/copy-of-marketplace` | `/theboard/magpie` |

At the enabled interim production launch, `/drawer` redirects to `/theboard` and each known `/work/{magpie,gcm,marketplace,ccp,portal,lti,pmf}` redirects to the corresponding `/theboard/` route on the exact approved production host. UAT/preview retains those existing page routes. Redirects use 308, retain query strings and supply no fragment, allowing browsers to inherit the incoming fragment. There is no `www` canonical-host redirect in this interim version. Write methods are not redirected by this policy; existing authentication remains responsible for editor/API access. These rules do not change URLs served by Wix.

Recommended but **pending owner review**: interim production `/` redirects to `/theboard`. This requires a separate `PORTFOLIO_ROOT_REDIRECT=theboard` setting in addition to the launch gate; it is OFF in the candidate. The existing `magpie-dashboards-work.vercel.app/` continues to display Magpie and remains noindex, regardless of that setting.

## Wix pages retained during the interim arrangement

The archival `portfolio-migration-research-2026-09-06/route-map.csv` and September 18 launch plan identify `/about`, `/contact`, `/volunteer`, `/news`, `/blog`, and `/single-post/2019/10/03/marbles-and-moments` without accepted new equivalents. Other individual Wix posts may also exist. These paths receive no blanket redirect and will return 404 on the candidate. Their existing Wix destinations remain in place during the interim arrangement. Before a later domain cutover, preserve the Wix archive and decide individually whether to retain, replace, redirect to an actual equivalent, or explicitly retire them. The live `/work/dashboards` route is included in addition to the archival Magpie path.

## Verification boundary

The hosted candidate can verify the four non-colliding Wix routes and the default noindex behavior. Production-only redirects, exact-host indexing and the optional root redirect are exercised with local production-environment/host tests; they are not evidence that production domains or launch settings have been activated. The owner has confirmed that the reviewed candidate looks good; that visual acceptance is not authorization to publish Wix, merge a production release, or change DNS. Activating the launch flag, choosing root behavior, and assigning the production alias remain separately approved release actions.

The review deployment remains a frozen snapshot with editing disabled and blank branch-only Blob credentials. A real production release must be rebuilt with the existing live production content and editor configuration through the repository's UAT-to-main release workflow. Do not promote the snapshot preview or treat a production-looking alias as proof of a production deployment. Keep UAT's separate storage and existing public behavior intact. Neither a new Blob store nor a copy of production credentials into UAT is part of this plan.
