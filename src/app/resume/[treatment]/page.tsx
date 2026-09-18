import { notFound, redirect } from "next/navigation";
import type { ResumeTreatment } from "@/lib/resume-motion";
export { metadata } from "../page";

const treatments: ResumeTreatment[] = ["construction-1", "construction-2", "lines-1", "lines-2"];

export function generateStaticParams() {
  return treatments.map((treatment) => ({ treatment }));
}

export default async function ResumeVariation({ params }: { params: Promise<{ treatment: string }> }) {
  const { treatment } = await params;
  if (!treatments.includes(treatment as ResumeTreatment)) notFound();
  redirect("/resume");
}
