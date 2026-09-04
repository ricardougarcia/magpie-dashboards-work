import { PublicTimeline } from "@/components/public-timeline";
import { getTimelineData } from "@/lib/timeline-storage";
import type { PublicTimelineData, TimelineItem } from "@/lib/timeline-types";

function toPublicItem({ guidingLights, ...item }: TimelineItem) {
  void guidingLights;
  return item;
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const data = await getTimelineData();
  const publicData: PublicTimelineData = {
    ...data,
    items: data.items.map(toPublicItem),
  };

  return <PublicTimeline data={publicData} />;
}
