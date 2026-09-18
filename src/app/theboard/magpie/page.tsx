import { PublicTimeline } from "@/components/public-timeline";
import { portfolioMetadata } from "@/lib/portfolio-metadata";
import { getTimelineData } from "@/lib/timeline-storage";

export const dynamic = "force-dynamic";

export function generateMetadata() {
  return portfolioMetadata("/theboard/magpie", "Magpie Dashboards | Rico Garcia", "An interactive portfolio timeline of Rico Garcia’s product leadership across Magpie Dashboards, January through September 2026.", "article");
}

export default async function MagpiePage() {
  const data = await getTimelineData();
  return <PublicTimeline data={data} />;
}
