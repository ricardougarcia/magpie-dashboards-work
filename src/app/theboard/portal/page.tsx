import { PartnerPortalPage } from "@/components/portfolio/portal-page";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

export function generateMetadata() {
  return portfolioMetadata("/theboard/portal", "Partner Portal | Rico Garcia", "Product leadership connecting provider publishing, integrations, evidence, and partner services across the Instructure ecosystem.", "article");
}

export default function PortalWorkPage() { return <PartnerPortalPage />; }
