import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortfolioLink } from "./portfolio-link";
import { PortfolioNavigationProvider } from "./portfolio-navigation-provider";
import { BOARD_POSITION, boardRestorationScript, portfolioHref } from "@/lib/portfolio-navigation";

beforeEach(() => {
  sessionStorage.clear();
  window.history.replaceState({}, "", "/theboard");
});
afterEach(() => { cleanup(); sessionStorage.clear(); vi.restoreAllMocks(); window.history.replaceState({}, "", "/"); });

describe("portfolio route families", () => {
  it("maps portfolio documents without changing fragments, queries, assets, or external links", () => {
    for (const slug of ["magpie", "gcm", "marketplace", "ccp", "portal", "lti", "pmf"]) {
      expect(portfolioHref(`/work/${slug}?view=source#evidence`, "public")).toBe(`/theboard/${slug}?view=source#evidence`);
      expect(portfolioHref(`/work/${slug}#evidence`, "legacy")).toBe(`/work/${slug}#evidence`);
    }
    expect(portfolioHref("/#timeline-heading", "public")).toBe("/theboard/magpie#timeline-heading");
    expect(portfolioHref("/drawer#region-gcm", "public")).toBe("/theboard#region-gcm");
    for (const href of ["#impact", "/portfolio-assets/source.png", "/resume-assets/Rico_Garcia_Resume.pdf", "https://example.com/work/gcm", "//example.com/work/gcm", "/work/unknown"]) {
      expect(portfolioHref(href, "public")).toBe(href);
    }
    expect(portfolioHref("/resume", "public")).toBe("/resume");
    expect(portfolioHref("/resume?view=pdf#page-2", "legacy")).toBe("/resume?view=pdf&board=drawer#page-2");
  });

  it.each([
    ["public", "/theboard", "/work/gcm#product-work", "/theboard/gcm"],
    ["public", "/theboard", "/#timeline-heading", "/theboard/magpie"],
    ["public", "/theboard", "/resume", "/resume"],
    ["legacy", "/drawer", "/work/ccp#approach", "/work/ccp"],
    ["legacy", "/drawer", "/#timeline-heading", "/"],
    ["legacy", "/drawer", "/resume", "/resume"],
  ] as const)("restores the %s Board after opening %s → %s", (family, board, href, project) => {
    window.history.replaceState({}, "", board);
    vi.spyOn(window, "scrollY", "get").mockReturnValue(840);
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
    const view = render(<PortfolioNavigationProvider family={family}><PortfolioLink href={href}>Sample</PortfolioLink></PortfolioNavigationProvider>);
    fireEvent.click(screen.getByRole("link"));
    expect(JSON.parse(sessionStorage.getItem(BOARD_POSITION)!)).toEqual({ y: 840, project, board });
    window.history.replaceState({}, "", project);
    view.rerender(<PortfolioNavigationProvider family={family}><PortfolioLink href="/drawer">Board</PortfolioLink></PortfolioNavigationProvider>);
    expect(screen.getByRole("link").getAttribute("href")).toBe(board);
    fireEvent.click(screen.getByRole("link"));
    window.history.replaceState({}, "", board);
    window.eval(boardRestorationScript);
    expect(scroll).toHaveBeenCalledWith({ top: 840, behavior: "instant" });
    expect(sessionStorage.getItem("portfolio-return")).toBeNull();
  });

  it("keeps the originating Board position through related sample navigation", () => {
    window.history.replaceState({}, "", "/theboard/gcm");
    sessionStorage.setItem(BOARD_POSITION, JSON.stringify({ y: 900, project: "/theboard/gcm", board: "/theboard" }));
    render(<PortfolioNavigationProvider family="public"><PortfolioLink href="/work/pmf">PMF</PortfolioLink></PortfolioNavigationProvider>);
    fireEvent.click(screen.getByRole("link"));
    expect(JSON.parse(sessionStorage.getItem(BOARD_POSITION)!)).toEqual({ y: 900, project: "/theboard/pmf", board: "/theboard" });
  });

  it("does not restore a different Board family or override an explicit fragment", () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
    sessionStorage.setItem(BOARD_POSITION, JSON.stringify({ y: 900, project: "/theboard/gcm", board: "/theboard" }));
    for (const destination of ["/drawer", "/theboard#region-magpie"]) {
      sessionStorage.setItem("portfolio-return", "/theboard/gcm");
      window.history.replaceState({}, "", destination);
      window.eval(boardRestorationScript);
    }
    expect(scroll).not.toHaveBeenCalled();
  });

  it("keeps modified clicks independent and plain anchors usable without browser storage", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    render(<PortfolioNavigationProvider family="public"><PortfolioLink href="/work/gcm">GCM</PortfolioLink></PortfolioNavigationProvider>);
    fireEvent.click(screen.getByRole("link"), { ctrlKey: true });
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockImplementation(() => { throw new Error("Storage unavailable"); });
    expect(() => fireEvent.click(screen.getByRole("link"))).not.toThrow();
    expect(screen.getByRole("link").getAttribute("href")).toBe("/theboard/gcm");
  });
});
