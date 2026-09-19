import { MarketplacePage } from "@/components/portfolio/marketplace-page";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

export function generateMetadata() {
  return portfolioMetadata("/theboard/marketplace", "EdCo Marketplace | Rico Garcia", "Two audiences, three repositories, and a coordinated transition to the EdTech Collective Marketplace. Product work by Rico Garcia at Instructure.", "article");
}

export default function MarketplaceWorkPage() { return <MarketplacePage />; }
