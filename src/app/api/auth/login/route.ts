import { NextResponse } from "next/server";
import { createSessionToken, EDITOR_COOKIE, isValidPassword } from "@/lib/auth";
import { isSnapshotContentMode, SNAPSHOT_READ_ONLY_MESSAGE } from "@/lib/content-mode";

export async function POST(request: Request) {
  if (isSnapshotContentMode()) {
    return NextResponse.json({ error: SNAPSHOT_READ_ONLY_MESSAGE }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { password?: string } | null;
  if (!body?.password || !isValidPassword(body.password)) {
    return NextResponse.json({ error: "That password is not valid." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(EDITOR_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
