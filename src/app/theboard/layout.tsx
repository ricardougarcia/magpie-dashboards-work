import type { ReactNode } from "react";
import { PortfolioNavigationProvider } from "@/components/portfolio/portfolio-navigation-provider";

export default function BoardLayout({ children }: { children: ReactNode }) {
  return <PortfolioNavigationProvider family="public">{children}</PortfolioNavigationProvider>;
}
