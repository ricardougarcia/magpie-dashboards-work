import { redirect } from "next/navigation";
import { EditorLogin } from "@/components/editor-login";
import { isEditorAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  if (await isEditorAuthenticated()) redirect("/edit");
  return <EditorLogin />;
}
