"use client";

import type { ComponentProps } from "react";

import { BOARD_POSITION } from "@/lib/portfolio-navigation";

// Document navigation allows native shared-element transitions and history restoration.
// Modified clicks and direct Project links retain ordinary anchor behavior.
export function PortfolioLink({ href, onClick, ...props }: ComponentProps<"a">) {
  return <a {...props} href={href} onClick={(event) => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || props.target === "_blank") return;
    try {
      if (location.pathname === "/drawer" && href?.startsWith("/work/")) {
        sessionStorage.setItem(BOARD_POSITION, JSON.stringify({ y: window.scrollY, project: href.split("#")[0] }));
      }
      if (href === "/drawer") sessionStorage.setItem("portfolio-return", location.pathname);
    } catch { /* Storage can be unavailable; navigation still works. */ }
  }} />;
}

