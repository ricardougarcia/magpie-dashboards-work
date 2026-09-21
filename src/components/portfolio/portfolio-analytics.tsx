"use client";

import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  ANALYTICS_EXCLUSION_EVENT,
  filterPortfolioAnalyticsEvent,
  isBrowserExcluded,
  isTrackedPortfolioUrl,
} from "@/lib/portfolio-analytics";
import { PORTFOLIO_ORIGIN } from "@/lib/portfolio-release";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("pageshow", callback);
  window.addEventListener(ANALYTICS_EXCLUSION_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("pageshow", callback);
    window.removeEventListener(ANALYTICS_EXCLUSION_EVENT, callback);
  };
}

// Next can render a new pathname before history updates window.location.
// Subscribe only to browser eligibility; let usePathname govern route eligibility.
const browserCanCollect = () => !isBrowserExcluded() && window.location.origin === PORTFOLIO_ORIGIN;
const serverCanCollect = () => false;

export function PortfolioAnalytics({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const canCollect = useSyncExternalStore(subscribe, browserCanCollect, serverCanCollect);

  if (!enabled || !canCollect || !pathname
    || !isTrackedPortfolioUrl(`${window.location.origin}${pathname}`)) return null;

  return <Analytics mode="production" beforeSend={filterPortfolioAnalyticsEvent} />;
}
