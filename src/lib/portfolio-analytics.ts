import type { BeforeSendEvent } from "@vercel/analytics/next";
import { PORTFOLIO_ORIGIN, PUBLIC_PORTFOLIO_PATHS } from "@/lib/portfolio-release";

export const ANALYTICS_EXCLUSION_KEY = "portfolio:analytics:excluded:v1";
export const ANALYTICS_EXCLUSION_EVENT = "portfolio-analytics-exclusion";

export function analyticsEnvironmentEnabled(env: { VERCEL_ENV?: string; VERCEL_TARGET_ENV?: string }) {
  return env.VERCEL_ENV === "production"
    && (!env.VERCEL_TARGET_ENV || env.VERCEL_TARGET_ENV === "production");
}

export function isTrackedPortfolioUrl(value: string) {
  try {
    const url = new URL(value);
    return url.origin === PORTFOLIO_ORIGIN
      && PUBLIC_PORTFOLIO_PATHS.some((path) => path === url.pathname);
  } catch {
    return false;
  }
}

export function isBrowserExcluded() {
  if (typeof window === "undefined") return true;
  try {
    return window.navigator.webdriver === true
      || window.localStorage.getItem(ANALYTICS_EXCLUSION_KEY) === "1";
  } catch {
    // If the preference cannot be read, do not risk counting an excluded owner.
    return true;
  }
}

export function excludeBrowserFromAnalytics() {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(ANALYTICS_EXCLUSION_KEY, "1");
    const saved = window.localStorage.getItem(ANALYTICS_EXCLUSION_KEY) === "1";
    window.dispatchEvent(new Event(ANALYTICS_EXCLUSION_EVENT));
    return saved;
  } catch {
    return false;
  }
}

export function filterPortfolioAnalyticsEvent(event: BeforeSendEvent): BeforeSendEvent | null {
  // Check live browser state on every event, including queued/client navigation events.
  if (typeof window === "undefined" || isBrowserExcluded()
    || !isTrackedPortfolioUrl(window.location.href)
    || event.type !== "pageview" || !isTrackedPortfolioUrl(event.url)) return null;

  const url = new URL(event.url);
  return { ...event, url: `${url.origin}${url.pathname}` };
}
