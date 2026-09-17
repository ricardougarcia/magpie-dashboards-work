import type { Metadata } from "next";
import { PartnerPortalPage } from "@/components/portfolio/portal-page";

const title = "Partner Portal | Rico Garcia";
const description = "Product leadership connecting provider publishing, integrations, evidence, and partner services across the Instructure ecosystem.";
export const metadata: Metadata = {
  title, description,
  openGraph: { title, description, type: "article" },
  robots: { index: false, follow: false },
};
export default function PortalWorkPage() { return <PartnerPortalPage />; }
