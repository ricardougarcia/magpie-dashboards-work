// @vitest-environment-options {"url":"https://ricardo-garcia-portfolio.vercel.app/theboard"}
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BeforeSendEvent } from "@vercel/analytics";
import {
  ANALYTICS_EXCLUSION_EVENT,
  ANALYTICS_EXCLUSION_KEY,
  analyticsEnvironmentEnabled,
  excludeBrowserFromAnalytics,
  filterPortfolioAnalyticsEvent,
  isBrowserExcluded,
  isTrackedPortfolioUrl,
} from "@/lib/portfolio-analytics";
import { PORTFOLIO_ORIGIN, PUBLIC_PORTFOLIO_PATHS } from "@/lib/portfolio-release";

const originalWebdriver = Object.getOwnPropertyDescriptor(window.navigator, "webdriver");

const pageview = (path = "/theboard"): BeforeSendEvent => ({
  type: "pageview",
  url: `${PORTFOLIO_ORIGIN}${path}`,
});

beforeEach(() => {
  window.localStorage.clear();
  window.history.replaceState({}, "", "/theboard");
  Object.defineProperty(window.navigator, "webdriver", { configurable: true, get: () => false });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (originalWebdriver) Object.defineProperty(window.navigator, "webdriver", originalWebdriver);
  else Reflect.deleteProperty(window.navigator, "webdriver");
  window.localStorage.clear();
});

describe("portfolio analytics collection boundary", () => {
  it("enables only the production environment, including deployments without a target name", () => {
    expect(analyticsEnvironmentEnabled({ VERCEL_ENV: "production" })).toBe(true);
    expect(analyticsEnvironmentEnabled({ VERCEL_ENV: "production", VERCEL_TARGET_ENV: "production" })).toBe(true);
    for (const env of [
      {},
      { VERCEL_ENV: "development" },
      { VERCEL_ENV: "preview" },
      { VERCEL_TARGET_ENV: "production" },
      { VERCEL_ENV: "preview", VERCEL_TARGET_ENV: "production" },
      { VERCEL_ENV: "production", VERCEL_TARGET_ENV: "uat" },
    ]) expect(analyticsEnvironmentEnabled(env)).toBe(false);
  });

  it("collects only published portfolio paths on the exact HTTPS production host", () => {
    for (const path of PUBLIC_PORTFOLIO_PATHS) {
      expect(isTrackedPortfolioUrl(`${PORTFOLIO_ORIGIN}${path}`)).toBe(true);
      expect(isTrackedPortfolioUrl(`${PORTFOLIO_ORIGIN}${path}?token=private#evidence`)).toBe(true);
    }
    for (const url of [
      "http://ricardo-garcia-portfolio.vercel.app/theboard",
      "https://www.ricardo-garcia-portfolio.vercel.app/theboard",
      "https://ricardo-garcia-portfolio.vercel.app.evil.example/theboard",
      "https://ricardo-garcia-portfolio-preview.vercel.app/theboard",
      "https://magpie-dashboards-work-uat.vercel.app/theboard",
      "https://magpie-dashboards-work.vercel.app/theboard",
      "https://ricardougarcia.com/theboard",
      "http://localhost:3000/theboard",
      "/theboard",
      "not a URL",
    ]) expect(isTrackedPortfolioUrl(url)).toBe(false);
    for (const path of ["/", "/work/gcm", "/drawer", "/edit", "/api/timeline", "/analytics/exclude", "/theboard/unknown", "/theboard/gcm/source"]) {
      expect(isTrackedPortfolioUrl(`${PORTFOLIO_ORIGIN}${path}`)).toBe(false);
    }
  });

  it("removes query strings and fragments without mutating the SDK event", () => {
    const event = pageview("/theboard/gcm?token=private&utm_source=owner#impact");
    expect(filterPortfolioAnalyticsEvent(event)).toEqual(pageview("/theboard/gcm"));
    expect(event.url).toContain("?token=private");
  });

  it("drops custom events and events for untracked routes or hosts", () => {
    expect(filterPortfolioAnalyticsEvent({ ...pageview(), type: "event" })).toBeNull();
    expect(filterPortfolioAnalyticsEvent(pageview("/edit"))).toBeNull();
    expect(filterPortfolioAnalyticsEvent({ type: "pageview", url: "https://example.com/theboard" })).toBeNull();
  });

  it("rechecks the current page so an allowed event cannot bypass an excluded location", () => {
    window.history.replaceState({}, "", "/analytics/exclude");
    expect(filterPortfolioAnalyticsEvent(pageview())).toBeNull();
    const browser = window;
    vi.stubGlobal("window", {
      location: new URL("https://magpie-dashboards-work-uat.vercel.app/theboard"),
      localStorage: browser.localStorage,
      navigator: browser.navigator,
    });
    expect(filterPortfolioAnalyticsEvent(pageview())).toBeNull();
  });
});

describe("persistent owner and automation exclusion", () => {
  it("accepts an unmarked browser and immediately rejects events after exclusion", () => {
    expect(isBrowserExcluded()).toBe(false);
    expect(filterPortfolioAnalyticsEvent(pageview())).toEqual(pageview());
    localStorage.setItem(ANALYTICS_EXCLUSION_KEY, "1");
    expect(isBrowserExcluded()).toBe(true);
    expect(filterPortfolioAnalyticsEvent(pageview())).toBeNull();
    window.history.replaceState({}, "", "/theboard/lti");
    expect(filterPortfolioAnalyticsEvent(pageview("/theboard/lti"))).toBeNull();
  });

  it("persists the exclusion before notifying other components", () => {
    const markerOnNotification = vi.fn(() => localStorage.getItem(ANALYTICS_EXCLUSION_KEY));
    window.addEventListener(ANALYTICS_EXCLUSION_EVENT, markerOnNotification);
    try {
      expect(excludeBrowserFromAnalytics()).toBe(true);
      expect(localStorage.getItem(ANALYTICS_EXCLUSION_KEY)).toBe("1");
      expect(markerOnNotification).toHaveReturnedWith("1");
      expect(filterPortfolioAnalyticsEvent(pageview())).toBeNull();
    } finally {
      window.removeEventListener(ANALYTICS_EXCLUSION_EVENT, markerOnNotification);
    }
  });

  it("also excludes browsers identified as automation", () => {
    vi.spyOn(window.navigator, "webdriver", "get").mockReturnValue(true);
    expect(isBrowserExcluded()).toBe(true);
    expect(filterPortfolioAnalyticsEvent(pageview())).toBeNull();
  });

  it("fails closed when browser storage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    expect(isBrowserExcluded()).toBe(true);
    expect(filterPortfolioAnalyticsEvent(pageview())).toBeNull();
  });

  it("reports failure when it cannot persist an exclusion", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    expect(excludeBrowserFromAnalytics()).toBe(false);
    expect(localStorage.getItem(ANALYTICS_EXCLUSION_KEY)).toBeNull();
  });

  it("does not collect or claim persistence during server rendering", () => {
    vi.stubGlobal("window", undefined);
    expect(isBrowserExcluded()).toBe(true);
    expect(excludeBrowserFromAnalytics()).toBe(false);
    expect(filterPortfolioAnalyticsEvent(pageview())).toBeNull();
  });
});
