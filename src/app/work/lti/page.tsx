import type { Metadata } from "next";
import { LtiPage } from "@/components/portfolio/lti-page";

const title = "LTI | Rico Garcia";
const description = "Coordinating LTI integration, provider tools, and Marketplace discovery at LearnPlatform.";

export const metadata: Metadata = {
  title, description,
  openGraph: { title, description, type: "article" },
  robots: { index: false, follow: false },
};

export default function LtiWorkPage() { return <LtiPage />; }
