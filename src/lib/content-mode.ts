import "server-only";

/** Snapshot candidates must never use environment-inherited storage or editor secrets. */
export function isSnapshotContentMode(): boolean {
  const mode = process.env.PORTFOLIO_CONTENT_MODE;
  if (mode === "snapshot") return true;
  if (!mode || mode === "live") return false;
  throw new Error(`Unsupported PORTFOLIO_CONTENT_MODE: ${mode}. No content access is allowed.`);
}

export const SNAPSHOT_READ_ONLY_MESSAGE = "This review candidate uses a read-only content snapshot. Editing and uploads are disabled.";

export function assertContentWritable(): void {
  if (isSnapshotContentMode()) throw new Error(SNAPSHOT_READ_ONLY_MESSAGE);
}
