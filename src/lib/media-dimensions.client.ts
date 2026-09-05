import type { MediaDimensions } from "@/lib/media-upload";

export async function readMediaDimensions(file: File): Promise<MediaDimensions | null> {
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) return null;

  const objectUrl = URL.createObjectURL(file);
  try {
    if (file.type.startsWith("video/")) {
      return await new Promise<MediaDimensions>((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => resolve({ width: video.videoWidth, height: video.videoHeight });
        video.onerror = () => reject(new Error("The video metadata could not be read."));
        video.src = objectUrl;
      });
    }

    return await new Promise<MediaDimensions>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("The image dimensions could not be read."));
      image.src = objectUrl;
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
