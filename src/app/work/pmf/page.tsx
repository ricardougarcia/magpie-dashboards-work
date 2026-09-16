import type { Metadata } from "next";
import { PmfPage } from "@/components/portfolio/pmf-page";

const title = "Product–market fit…with no product | Rico Garcia";
const description = "Sole product lead for SaferData research: user discovery and market analysis informed a direction for the initial MVP.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "article" },
  robots: { index: false, follow: false },
};

export default function PmfWorkPage() { return <PmfPage />; }
