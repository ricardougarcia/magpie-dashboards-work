import type { Metadata } from "next";
import { MarketplacePage } from "@/components/portfolio/marketplace-page";

const description = "Two audiences, three repositories, and a coordinated transition to the EdTech Collective Marketplace. Product work by Rico Garcia at Instructure.";

export const metadata: Metadata = {
  title: "EdCo Marketplace | Rico Garcia",
  description,
  openGraph: { title: "EdCo Marketplace | Rico Garcia", description, type: "article" },
  robots: { index: false, follow: false },
};

export default function MarketplaceWorkPage() {
  return <MarketplacePage />;
}
