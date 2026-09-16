export type GcmBoardRect = { left: number; top: number; right: number; width: number; height: number };
export type GcmBoardOrigin = "gcm" | "pmf";

/** Sheet-relative coordinates keep the relationship attached during native scrolling. */
export function gcmBoardGeometry(sheet: GcmBoardRect, gcm: GcmBoardRect, pmf: GcmBoardRect, narrow: boolean, origin: GcmBoardOrigin) {
  const a = { x: (narrow ? gcm.left : gcm.right) - sheet.left, y: gcm.top - sheet.top + Math.min(54, gcm.height / 2) };
  const b = { x: pmf.left - sheet.left, y: pmf.top - sheet.top + Math.min(42, pmf.height / 2) };
  // On a single column, use the existing sheet margin without shifting any content.
  const gutter = narrow ? Math.min(a.x, b.x) - 9 : (gcm.right + pmf.left) / 2 - sheet.left;
  const [start, end] = origin === "gcm" ? [a, b] : [b, a];
  return { start, end, path: `M ${start.x} ${start.y} L ${gutter} ${start.y} L ${gutter} ${end.y} L ${end.x} ${end.y}` };
}
