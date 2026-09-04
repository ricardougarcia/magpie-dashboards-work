import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isEditorAuthenticated } from "@/lib/auth";
import { hasBlobStorage } from "@/lib/timeline-storage";

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
]);

export async function POST(request: Request) {
  if (!(await isEditorAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasBlobStorage()) {
    return NextResponse.json(
      { error: "Vercel Blob is not connected. Set BLOB_READ_WRITE_TOKEN before uploading media." },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose an image, GIF, or video." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Unsupported media type." }, { status: 415 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Media must be 25 MB or smaller." }, { status: 413 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").toLowerCase();
  const blob = await put(`magpie/media/${safeName}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
  });

  return NextResponse.json({
    url: blob.url,
    type: file.type.startsWith("video/") ? "video" : file.type === "image/gif" ? "gif" : "image",
  });
}
