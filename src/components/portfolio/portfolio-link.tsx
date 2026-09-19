"use client";

import type { ComponentProps } from "react";

import { BOARD_POSITION, isBoardDestination, isBoardPath, portfolioHref } from "@/lib/portfolio-navigation";
import { usePortfolioRouteFamily } from "./portfolio-navigation-provider";

// Document navigation allows native shared-element transitions and history restoration.
// Modified clicks and direct Project links retain ordinary anchor behavior.
export function PortfolioLink({ href, onClick, ...props }: ComponentProps<"a">) {
  const destination = portfolioHref(href, usePortfolioRouteFamily());
  return <a {...props} href={destination} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
    try {
      if (!destination) return;
      const url = new URL(destination, location.href);
      if (url.origin !== location.origin) return;
      if (isBoardPath(location.pathname) && isBoardDestination(location.pathname, url.pathname)) {
        sessionStorage.setItem(BOARD_POSITION, JSON.stringify({ y: window.scrollY, project: url.pathname, board: location.pathname }));
      } else if (!isBoardPath(location.pathname)) {
        const saved = JSON.parse(sessionStorage.getItem(BOARD_POSITION) ?? "null");
        if (saved?.project === location.pathname && saved.board && isBoardDestination(saved.board, url.pathname)) {
          // Keep the originating Board position when following related samples.
          sessionStorage.setItem(BOARD_POSITION, JSON.stringify({ ...saved, project: url.pathname }));
        }
      }
      if (isBoardPath(url.pathname) && url.pathname !== location.pathname) sessionStorage.setItem("portfolio-return", location.pathname);
    } catch { /* Storage can be unavailable; navigation still works. */ }
  }} />;
}
