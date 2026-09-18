import type { Metadata } from "next";
import { PublicTimeline } from "@/components/public-timeline";
import { getTimelineData } from "@/lib/timeline-storage";
import { PORTFOLIO_ORIGIN } from "@/lib/portfolio-release";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: { canonical: `${PORTFOLIO_ORIGIN}/theboard/magpie` },
  robots: { index: false, follow: false },
};

export default async function Home() {
  const data = await getTimelineData();
  return <PublicTimeline data={data} />;
}
