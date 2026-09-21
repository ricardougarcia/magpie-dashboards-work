import type { Metadata } from "next";
import { AnalyticsExclusion } from "@/components/portfolio/analytics-exclusion";

export const metadata: Metadata = {
  title: "Exclude your visits | Rico Garcia",
  robots: { index: false, follow: false },
};

export default function AnalyticsExclusionPage() {
  return <AnalyticsExclusion />;
}
