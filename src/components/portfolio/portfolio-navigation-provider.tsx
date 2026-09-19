"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PortfolioRouteFamily } from "@/lib/portfolio-navigation";

const PortfolioNavigationContext = createContext<PortfolioRouteFamily>("legacy");

export function PortfolioNavigationProvider({ family, children }: { family: PortfolioRouteFamily; children: ReactNode }) {
  return <PortfolioNavigationContext.Provider value={family}>{children}</PortfolioNavigationContext.Provider>;
}

export function usePortfolioRouteFamily() {
  return useContext(PortfolioNavigationContext);
}
