import type { Metadata } from "next";
import { ResumePage } from "@/components/resume/resume-page";

export const metadata: Metadata = {
  title: "Resume | Rico Garcia",
  description: "Rico Garcia — Principal Product Manager. Resume.",
  robots: { index: false, follow: false },
};

export default function Resume() {
  return <ResumePage />;
}
