import { redirect } from "next/navigation";
import { TimelineEditor } from "@/components/timeline-editor";
import { isEditorAuthenticated } from "@/lib/auth";
import { getTimelineData } from "@/lib/timeline-storage";

export const dynamic = "force-dynamic";

export default async function EditPage() {
  if (!(await isEditorAuthenticated())) redirect("/edit/login");
  const data = await getTimelineData();
  return <TimelineEditor initialData={data} />;
}
