import { GcmPage } from "@/components/portfolio/gcm-page";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

export function generateMetadata() {
  return portfolioMetadata("/theboard/gcm", "GCM | Rico Garcia", "Sole product lead for SaferData’s Generative Consumer Model MVP: relevant data, model integration, and structured evaluation.", "article");
}

export default function GcmWorkPage() { return <GcmPage />; }
