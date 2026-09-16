import type { Metadata } from "next";
import { GcmPage } from "@/components/portfolio/gcm-page";

const title = "GCM | Rico Garcia";
const description = "Sole product lead for SaferData’s Generative Consumer Model MVP: relevant data, model integration, and structured evaluation.";

export const metadata: Metadata = {
  title, description,
  openGraph: { title, description, type: "article" },
  robots: { index: false, follow: false },
};

export default function GcmWorkPage() { return <GcmPage />; }
