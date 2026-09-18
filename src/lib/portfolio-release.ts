export const PORTFOLIO_ORIGIN = "https://ricardougarcia.com";
export const PORTFOLIO_HOST = "ricardougarcia.com";

export const PUBLIC_PORTFOLIO_PATHS = [
  "/theboard",
  "/resume",
  "/theboard/magpie",
  "/theboard/gcm",
  "/theboard/marketplace",
  "/theboard/ccp",
  "/theboard/portal",
  "/theboard/lti",
  "/theboard/pmf",
] as const;

export type PortfolioReleaseEnvironment = {
  VERCEL_ENV?: string;
  VERCEL_TARGET_ENV?: string;
  PORTFOLIO_PUBLIC_LAUNCH?: string;
  PORTFOLIO_ROOT_REDIRECT?: string;
};

// Deliberately explicit: these routes have no page in the accepted UAT site.
// They are available on the candidate so Wix link migration can be reviewed.
export const WIX_ONLY_REDIRECTS: Readonly<Record<string, string>> = {
  "/work": "/theboard",
  "/copy-of-work": "/theboard",
  "/work/dashboards": "/theboard/magpie",
  "/work/copy-of-marketplace": "/theboard/magpie",
};

// Existing UAT routes keep rendering until the approved custom-domain launch.
export const PRODUCTION_LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  "/drawer": "/theboard",
  "/work/magpie": "/theboard/magpie",
  "/work/gcm": "/theboard/gcm",
  "/work/marketplace": "/theboard/marketplace",
  "/work/ccp": "/theboard/ccp",
  "/work/portal": "/theboard/portal",
  "/work/lti": "/theboard/lti",
  "/work/pmf": "/theboard/pmf",
};

function releaseEnvironment(): PortfolioReleaseEnvironment {
  return {
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_TARGET_ENV: process.env.VERCEL_TARGET_ENV,
    PORTFOLIO_PUBLIC_LAUNCH: process.env.PORTFOLIO_PUBLIC_LAUNCH,
    PORTFOLIO_ROOT_REDIRECT: process.env.PORTFOLIO_ROOT_REDIRECT,
  };
}

export function publicLaunchEnabled(env: PortfolioReleaseEnvironment = releaseEnvironment()) {
  return env.VERCEL_ENV === "production"
    && (!env.VERCEL_TARGET_ENV || env.VERCEL_TARGET_ENV === "production")
    && env.PORTFOLIO_PUBLIC_LAUNCH === "true";
}

export function isPublicPortfolioHost(host: string | null, env: PortfolioReleaseEnvironment = releaseEnvironment()) {
  // Do not consult X-Forwarded-Host or accept arbitrary *.vercel.app aliases.
  return publicLaunchEnabled(env) && host?.toLowerCase() === PORTFOLIO_HOST;
}

export function isIndexablePortfolioPage(host: string | null, pathname: string, env: PortfolioReleaseEnvironment = releaseEnvironment()) {
  return isPublicPortfolioHost(host, env)
    && PUBLIC_PORTFOLIO_PATHS.some((path) => path === pathname);
}

export function portfolioRedirect(host: string | null, pathname: string, env: PortfolioReleaseEnvironment = releaseEnvironment()) {
  const normalizedHost = host?.toLowerCase();
  const customDomain = publicLaunchEnabled(env)
    && (normalizedHost === PORTFOLIO_HOST || normalizedHost === `www.${PORTFOLIO_HOST}`);
  const explicitDestination = WIX_ONLY_REDIRECTS[pathname]
    ?? (customDomain ? PRODUCTION_LEGACY_REDIRECTS[pathname] : undefined);
  // This decision is intentionally separate from search launch and defaults OFF.
  const rootDestination = customDomain && pathname === "/" && env.PORTFOLIO_ROOT_REDIRECT === "theboard"
    ? "/theboard"
    : undefined;
  const canonicalHostRedirect = customDomain && normalizedHost === `www.${PORTFOLIO_HOST}`;
  if (!explicitDestination && !rootDestination && !canonicalHostRedirect) return null;
  return {
    pathname: explicitDestination ?? rootDestination ?? pathname,
    canonicalOrigin: customDomain ? PORTFOLIO_ORIGIN : null,
  };
}
