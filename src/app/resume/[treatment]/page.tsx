import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import type { ResumeTreatment } from "@/lib/resume-motion";

export const metadata: Metadata = {
  title: "Resume | Rico Garcia",
  robots: { index: false, follow: false },
};

const treatments: ResumeTreatment[] = ["construction-1", "construction-2", "lines-1", "lines-2"];

export function generateStaticParams() {
  return treatments.map((treatment) => ({ treatment }));
}

export default async function ResumeVariation({ params, searchParams }: {
  params: Promise<{ treatment: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { treatment } = await params;
  if (!treatments.includes(treatment as ResumeTreatment)) notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (Array.isArray(value)) value.forEach((entry) => query.append(key, entry));
    else if (value !== undefined) query.set(key, value);
  }
  redirect(`/resume${query.size ? `?${query}` : ""}`);
}
