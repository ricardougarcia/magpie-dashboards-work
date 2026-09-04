export const TELEMETRY_TETHER_DURATION = 1.7;

export type ViewportRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ViewportPoint = {
  x: number;
  y: number;
};

export type TelemetryTetherGeometry = {
  start: ViewportPoint;
  end: ViewportPoint;
  path: string;
};

function centerOf(rect: ViewportRect): ViewportPoint {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

export function pointOnRectEdgeToward(rect: ViewportRect, target: ViewportPoint): ViewportPoint {
  const center = centerOf(rect);
  const deltaX = target.x - center.x;
  const deltaY = target.y - center.y;
  const halfWidth = Math.max(rect.width / 2, 0.5);
  const halfHeight = Math.max(rect.height / 2, 0.5);
  const scale = 1 / Math.max(Math.abs(deltaX) / halfWidth, Math.abs(deltaY) / halfHeight, 1e-6);

  return {
    x: center.x + deltaX * scale,
    y: center.y + deltaY * scale,
  };
}

export function telemetryTetherGeometry(
  sourceRect: ViewportRect,
  modalRect: ViewportRect,
): TelemetryTetherGeometry {
  const sourceCenter = centerOf(sourceRect);
  const modalCenter = centerOf(modalRect);
  const start = pointOnRectEdgeToward(sourceRect, modalCenter);
  const end = pointOnRectEdgeToward(modalRect, sourceCenter);
  const horizontalDistance = Math.abs(end.x - start.x);
  const verticalDistance = Math.abs(end.y - start.y);

  const path = horizontalDistance >= verticalDistance
    ? `M ${start.x} ${start.y} H ${(start.x + end.x) / 2} V ${end.y} H ${end.x}`
    : `M ${start.x} ${start.y} V ${(start.y + end.y) / 2} H ${end.x} V ${end.y}`;

  return { start, end, path };
}
