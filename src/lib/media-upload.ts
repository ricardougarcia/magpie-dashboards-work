import type { TimelineMedia } from "@/lib/timeline-types";

export const MEDIA_MAX_SIZE_BYTES = 25 * 1024 * 1024;
export const MEDIA_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
] as const;

export type AllowedMediaContentType = (typeof MEDIA_ALLOWED_CONTENT_TYPES)[number];

const MEDIA_TYPE_BY_CONTENT_TYPE: Record<AllowedMediaContentType, TimelineMedia["type"]> = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/webp": "image",
  "image/gif": "gif",
  "video/mp4": "video",
  "video/webm": "video",
};

export type MediaDimensions = {
  width: number;
  height: number;
};

export function isAllowedMediaContentType(value: string): value is AllowedMediaContentType {
  return MEDIA_ALLOWED_CONTENT_TYPES.includes(value as AllowedMediaContentType);
}

export function mediaTypeFromContentType(value: string): TimelineMedia["type"] | null {
  return isAllowedMediaContentType(value) ? MEDIA_TYPE_BY_CONTENT_TYPE[value] : null;
}

export function mediaValidationError(file: Pick<File, "size" | "type">): string | null {
  if (!isAllowedMediaContentType(file.type)) {
    return "Use a JPEG, PNG, WEBP, GIF, MP4, or WEBM file.";
  }
  if (file.size > MEDIA_MAX_SIZE_BYTES) {
    return "Media must be 25 MB or smaller.";
  }
  return null;
}

export function safeMediaPath(itemId: string, filename: string): string {
  const safeItemId = itemId.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "item";
  const safeFilename = filename.toLowerCase().replace(/[^a-z0-9._-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "artifact";
  return `magpie/media/${safeItemId}/${safeFilename}`;
}

export function isLowResolutionGif(media: Pick<TimelineMedia, "type" | "width" | "height">): boolean {
  if (media.type !== "gif" || !media.width || !media.height) return false;
  return media.width < 640 && media.height < 360;
}

export function lowResolutionGifMessage(media: Pick<TimelineMedia, "type" | "width" | "height">): string | null {
  if (!isLowResolutionGif(media)) return null;
  return `This animation is ${media.width}×${media.height} and may appear soft when enlarged. For a larger preview, upload a higher-resolution MP4 or WEBM.`;
}
