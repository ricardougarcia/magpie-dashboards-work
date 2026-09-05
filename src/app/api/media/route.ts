import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { isEditorAuthenticated } from "@/lib/auth";
import {
  MEDIA_ALLOWED_CONTENT_TYPES,
  MEDIA_MAX_SIZE_BYTES,
  safeMediaPath,
} from "@/lib/media-upload";
import { hasBlobStorage } from "@/lib/timeline-storage";

class MediaUploadAuthenticationError extends Error {}

function parseClientPayload(value: string | null): { itemId: string; filename: string } {
  if (!value) throw new Error("Missing upload context.");
  const parsed = JSON.parse(value) as { itemId?: unknown; filename?: unknown };
  if (typeof parsed.itemId !== "string" || typeof parsed.filename !== "string") {
    throw new Error("Invalid upload context.");
  }
  return { itemId: parsed.itemId, filename: parsed.filename };
}

export async function POST(request: Request) {
  if (!hasBlobStorage()) {
    return NextResponse.json(
      { error: "Vercel Blob is not connected. Set BLOB_READ_WRITE_TOKEN before uploading media." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!(await isEditorAuthenticated())) {
          throw new MediaUploadAuthenticationError("Not authenticated.");
        }

        const { itemId, filename } = parseClientPayload(clientPayload);
        const expectedPath = safeMediaPath(itemId, filename);
        if (pathname !== expectedPath) {
          throw new Error("Upload path does not match the selected item.");
        }

        return {
          allowedContentTypes: [...MEDIA_ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: MEDIA_MAX_SIZE_BYTES,
          addRandomSuffix: true,
          cacheControlMaxAge: 31_536_000,
          tokenPayload: JSON.stringify({ itemId }),
        };
      },
      onUploadCompleted: async () => undefined,
    });

    return NextResponse.json(response);
  } catch (error) {
    const status = error instanceof MediaUploadAuthenticationError ? 401 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Media upload could not start." },
      { status },
    );
  }
}
