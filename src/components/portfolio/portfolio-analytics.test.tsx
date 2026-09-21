// @vitest-environment-options {"url":"https://ricardo-garcia-portfolio.vercel.app/theboard"}
import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AnalyticsProps } from "@vercel/analytics";
import {
  ANALYTICS_EXCLUSION_KEY,
  excludeBrowserFromAnalytics,
} from "@/lib/portfolio-analytics";
import { PORTFOLIO_ORIGIN } from "@/lib/portfolio-release";
import { PortfolioAnalytics } from "./portfolio-analytics";

const originalWebdriver = Object.getOwnPropertyDescriptor(window.navigator, "webdriver");

const { analyticsMock, navigation } = vi.hoisted(() => ({
  analyticsMock: vi.fn(),
  navigation: { pathname: "/theboard" },
}));

vi.mock("@vercel/analytics/next", () => ({ Analytics: analyticsMock }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState({}, "", "/theboard");
  navigation.pathname = "/theboard";
  analyticsMock.mockReset();
  analyticsMock.mockImplementation(() => <span data-testid="analytics-mounted" />);
  Object.defineProperty(window.navigator, "webdriver", { configurable: true, get: () => false });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (originalWebdriver) Object.defineProperty(window.navigator, "webdriver", originalWebdriver);
  else Reflect.deleteProperty(window.navigator, "webdriver");
  localStorage.clear();
});

describe("PortfolioAnalytics", () => {
  it("does not render the analytics integration on the server", () => {
    expect(renderToString(<PortfolioAnalytics enabled />)).toBe("");
    expect(analyticsMock).not.toHaveBeenCalled();
  });

  it("mounts for an eligible visitor with a callback that redacts the event URL", () => {
    render(<PortfolioAnalytics enabled />);
    expect(screen.queryByTestId("analytics-mounted")).not.toBeNull();
    const props = analyticsMock.mock.calls.at(-1)?.[0] as AnalyticsProps;
    expect(props.beforeSend?.({ type: "pageview", url: `${PORTFOLIO_ORIGIN}/theboard?token=private#work` }))
      .toEqual({ type: "pageview", url: `${PORTFOLIO_ORIGIN}/theboard` });
  });

  it("does not mount in UAT or another disabled environment", () => {
    render(<PortfolioAnalytics enabled={false} />);
    expect(analyticsMock).not.toHaveBeenCalled();
  });

  it("does not mount when an owner marker already exists", () => {
    localStorage.setItem(ANALYTICS_EXCLUSION_KEY, "1");
    render(<PortfolioAnalytics enabled />);
    expect(analyticsMock).not.toHaveBeenCalled();
  });

  it("does not mount for automation or when storage cannot be checked", () => {
    vi.spyOn(window.navigator, "webdriver", "get").mockReturnValue(true);
    const view = render(<PortfolioAnalytics enabled />);
    expect(analyticsMock).not.toHaveBeenCalled();
    vi.spyOn(window.navigator, "webdriver", "get").mockReturnValue(false);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Storage blocked"); });
    view.rerender(<PortfolioAnalytics enabled />);
    expect(analyticsMock).not.toHaveBeenCalled();
  });

  it("never mounts on the exclusion route before its marker has been written", () => {
    navigation.pathname = "/analytics/exclude";
    window.history.replaceState({}, "", navigation.pathname);
    render(<PortfolioAnalytics enabled />);
    expect(localStorage.getItem(ANALYTICS_EXCLUSION_KEY)).toBeNull();
    expect(analyticsMock).not.toHaveBeenCalled();
  });

  it("stops collection immediately when the owner excludes this tab", () => {
    render(<PortfolioAnalytics enabled />);
    const props = analyticsMock.mock.calls.at(-1)?.[0] as AnalyticsProps;
    act(() => { expect(excludeBrowserFromAnalytics()).toBe(true); });
    expect(screen.queryByTestId("analytics-mounted")).toBeNull();
    // The already-injected SDK can retain its callback after React unmounts it.
    expect(props.beforeSend?.({ type: "pageview", url: `${PORTFOLIO_ORIGIN}/resume` })).toBeNull();
  });

  it("reacts to an owner exclusion made in another tab", () => {
    render(<PortfolioAnalytics enabled />);
    expect(screen.queryByTestId("analytics-mounted")).not.toBeNull();
    act(() => {
      localStorage.setItem(ANALYTICS_EXCLUSION_KEY, "1");
      window.dispatchEvent(new StorageEvent("storage", {
        key: ANALYTICS_EXCLUSION_KEY,
        newValue: "1",
        storageArea: localStorage,
      }));
    });
    expect(screen.queryByTestId("analytics-mounted")).toBeNull();
  });

  it("rejects excluded route navigation through both the wrapper and an existing SDK callback", () => {
    const view = render(<PortfolioAnalytics enabled />);
    const props = analyticsMock.mock.calls.at(-1)?.[0] as AnalyticsProps;
    navigation.pathname = "/edit";
    window.history.replaceState({}, "", navigation.pathname);
    view.rerender(<PortfolioAnalytics enabled />);
    expect(screen.queryByTestId("analytics-mounted")).toBeNull();
    expect(props.beforeSend?.({ type: "pageview", url: `${PORTFOLIO_ORIGIN}/theboard` })).toBeNull();
    navigation.pathname = "/theboard/lti";
    window.history.replaceState({}, "", navigation.pathname);
    view.rerender(<PortfolioAnalytics enabled />);
    expect(screen.queryByTestId("analytics-mounted")).not.toBeNull();
  });
});
