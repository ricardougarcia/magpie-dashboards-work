import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isSnapshotContentMode } from "@/lib/content-mode";

export const EDITOR_COOKIE = "magpie_editor_session";
const SESSION_VALUE = "magpie-editor-authorized-v1";

function getSecret() {
  return process.env.SESSION_SECRET || process.env.EDIT_PASSWORD || "";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isValidPassword(candidate: string) {
  if (isSnapshotContentMode()) return false;
  const expected = process.env.EDIT_PASSWORD;
  if (!expected || !candidate) return false;
  return safeEqual(candidate, expected);
}

export function createSessionToken() {
  if (isSnapshotContentMode()) return "";
  const secret = getSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(SESSION_VALUE).digest("hex");
}

export async function isEditorAuthenticated() {
  if (isSnapshotContentMode()) return false;
  const secret = getSecret();
  if (!secret) return false;
  const cookieStore = await cookies();
  const supplied = cookieStore.get(EDITOR_COOKIE)?.value;
  if (!supplied) return false;
  return safeEqual(supplied, createSessionToken());
}
