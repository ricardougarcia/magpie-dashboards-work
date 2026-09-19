import { LtiPage } from "@/components/portfolio/lti-page";
import { portfolioMetadata } from "@/lib/portfolio-metadata";

export function generateMetadata() {
  return portfolioMetadata("/theboard/lti", "LTI | Rico Garcia", "Coordinating LTI integration, provider tools, and Marketplace discovery at LearnPlatform.", "article");
}

export default function LtiWorkPage() { return <LtiPage />; }
