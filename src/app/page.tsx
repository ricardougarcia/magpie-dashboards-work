import { PublicTimeline } from "@/components/public-timeline";
import { getTimelineData } from "@/lib/timeline-storage";

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getTimelineData();
  return <PublicTimeline data={data} />;
}
