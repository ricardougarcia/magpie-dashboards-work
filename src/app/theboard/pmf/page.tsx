import { PmfPage } from "@/components/portfolio/pmf-page";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

export function generateMetadata() {
  return portfolioMetadata("/theboard/pmf", "Product–market fit…with no product | Rico Garcia", "Sole product lead for SaferData research: user discovery and market analysis informed a direction for the initial MVP.", "article");
}

export default function PmfWorkPage() { return <PmfPage />; }
