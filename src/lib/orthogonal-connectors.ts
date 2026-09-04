import type {
  ConnectorPoint,
  ConnectorTerminal,
  ConnectorTerminalSide,
  OrthogonalConnectorRoute,
} from "@/lib/timeline-types";

export type ConnectorRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ConnectorPixelPoint = {
  x: number;
  y: number;
};

type RouteFrame = ConnectorRect;

const FRAME_PADDING = 28;
const GRID = 4;

export function createDefaultConnector(sourceRect: ConnectorRect, targetRect: ConnectorRect): OrthogonalConnectorRoute {
  const sourceCenter = rectCenter(sourceRect);
  const targetCenter = rectCenter(targetRect);
  const horizontal = Math.abs(targetCenter.x - sourceCenter.x) >= Math.abs(targetCenter.y - sourceCenter.y);
  const source: ConnectorTerminal = horizontal
    ? { side: targetCenter.x >= sourceCenter.x ? "right" : "left", offset: 0.5 }
    : { side: targetCenter.y >= sourceCenter.y ? "bottom" : "top", offset: 0.5 };
  const target: ConnectorTerminal = { side: oppositeSide(source.side), offset: 0.5 };
  const start = terminalPoint(sourceRect, source);
  const end = terminalPoint(targetRect, target);
  const points = horizontal
    ? [start, { x: midpoint(start.x, end.x), y: start.y }, { x: midpoint(start.x, end.x), y: end.y }, end]
    : [start, { x: start.x, y: midpoint(start.y, end.y) }, { x: end.x, y: midpoint(start.y, end.y) }, end];
  return routeFromPixelPoints({ source, target, points }, sourceRect, targetRect);
}

export function resolveConnectorPoints(
  route: OrthogonalConnectorRoute,
  sourceRect: ConnectorRect,
  targetRect: ConnectorRect,
): ConnectorPixelPoint[] {
  const frame = routeFrame(sourceRect, targetRect);
  const points = route.points.map((point) => fromNormalized(point, frame));
  if (points.length < 2) return [];

  points[0] = terminalPoint(sourceRect, route.source);
  points[points.length - 1] = terminalPoint(targetRect, route.target);
  if (points.length >= 3) {
    alignTerminalApproach(points, route.source.side, "source");
    alignTerminalApproach(points, route.target.side, "target");
  }
  return simplifyOrthogonalPoints(points);
}

export function routeFromPixelPoints(
  route: Pick<OrthogonalConnectorRoute, "source" | "target"> & { points: ConnectorPixelPoint[] },
  sourceRect: ConnectorRect,
  targetRect: ConnectorRect,
): OrthogonalConnectorRoute {
  const frame = routeFrame(sourceRect, targetRect);
  const points = simplifyOrthogonalPoints(route.points).map((point) => toNormalized(point, frame));
  return { source: route.source, target: route.target, points };
}

export function connectorPath(points: ConnectorPixelPoint[]) {
  if (points.length === 0) return "";
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    if (previous.x === point.x) return `${path} V ${round(point.y)}`;
    if (previous.y === point.y) return `${path} H ${round(point.x)}`;
    return `${path} L ${round(point.x)} ${round(point.y)}`;
  }, `M ${round(points[0].x)} ${round(points[0].y)}`);
}

export function nearestTerminal(rect: ConnectorRect, point: ConnectorPixelPoint): ConnectorTerminal {
  const distances: Array<{ side: ConnectorTerminalSide; distance: number }> = [
    { side: "top", distance: Math.abs(point.y - rect.top) },
    { side: "right", distance: Math.abs(point.x - (rect.left + rect.width)) },
    { side: "bottom", distance: Math.abs(point.y - (rect.top + rect.height)) },
    { side: "left", distance: Math.abs(point.x - rect.left) },
  ];
  const side = distances.sort((a, b) => a.distance - b.distance)[0].side;
  const offset = side === "top" || side === "bottom"
    ? clamp((point.x - rect.left) / rect.width, 0.08, 0.92)
    : clamp((point.y - rect.top) / rect.height, 0.08, 0.92);
  return { side, offset: round(offset) };
}

export function moveTerminal(
  route: OrthogonalConnectorRoute,
  terminal: "source" | "target",
  nextTerminal: ConnectorTerminal,
  sourceRect: ConnectorRect,
  targetRect: ConnectorRect,
) {
  const next = structuredClone(route);
  next[terminal] = nextTerminal;
  const points = resolveConnectorPoints(next, sourceRect, targetRect);
  const endpointIndex = terminal === "source" ? 0 : points.length - 1;
  points[endpointIndex] = terminalPoint(terminal === "source" ? sourceRect : targetRect, nextTerminal);
  alignTerminalApproach(points, nextTerminal.side, terminal);
  return routeFromPixelPoints({ ...next, points }, sourceRect, targetRect);
}

export function slideSegment(
  route: OrthogonalConnectorRoute,
  segmentIndex: number,
  delta: ConnectorPixelPoint,
  sourceRect: ConnectorRect,
  targetRect: ConnectorRect,
) {
  const points = resolveConnectorPoints(route, sourceRect, targetRect);
  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];
  if (!start || !end) return route;

  if (start.y === end.y) {
    const nextY = snap(start.y + delta.y);
    start.y = nextY;
    end.y = nextY;
  } else {
    const nextX = snap(start.x + delta.x);
    start.x = nextX;
    end.x = nextX;
  }
  points[0] = terminalPoint(sourceRect, route.source);
  points[points.length - 1] = terminalPoint(targetRect, route.target);
  return routeFromPixelPoints({ ...route, points }, sourceRect, targetRect);
}

export function moveElbow(
  route: OrthogonalConnectorRoute,
  pointIndex: number,
  delta: ConnectorPixelPoint,
  sourceRect: ConnectorRect,
  targetRect: ConnectorRect,
) {
  const points = resolveConnectorPoints(route, sourceRect, targetRect);
  const point = points[pointIndex];
  const previous = points[pointIndex - 1];
  const next = points[pointIndex + 1];
  if (!point || !previous || !next) return route;

  const nextX = snap(point.x + delta.x);
  const nextY = snap(point.y + delta.y);
  if (previous.x === point.x) previous.x = nextX;
  else previous.y = nextY;
  if (next.x === point.x) next.x = nextX;
  else next.y = nextY;
  point.x = nextX;
  point.y = nextY;
  points[0] = terminalPoint(sourceRect, route.source);
  points[points.length - 1] = terminalPoint(targetRect, route.target);
  return routeFromPixelPoints({ ...route, points }, sourceRect, targetRect);
}

export function injectElbow(
  route: OrthogonalConnectorRoute,
  segmentIndex: number,
  delta: ConnectorPixelPoint,
  sourceRect: ConnectorRect,
  targetRect: ConnectorRect,
) {
  const points = resolveConnectorPoints(route, sourceRect, targetRect);
  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];
  if (!start || !end || points.length + 3 > 24) return route;

  const nextPoints = [...points];
  if (start.y === end.y) {
    const centerX = snap(midpoint(start.x, end.x));
    const nextY = snap(start.y + (Math.abs(delta.y) < GRID ? GRID * 4 : delta.y));
    nextPoints.splice(segmentIndex + 1, 0,
      { x: centerX, y: start.y },
      { x: centerX, y: nextY },
      { x: end.x, y: nextY },
    );
  } else {
    const centerY = snap(midpoint(start.y, end.y));
    const nextX = snap(start.x + (Math.abs(delta.x) < GRID ? GRID * 4 : delta.x));
    nextPoints.splice(segmentIndex + 1, 0,
      { x: start.x, y: centerY },
      { x: nextX, y: centerY },
      { x: nextX, y: end.y },
    );
  }
  return routeFromPixelPoints({ ...route, points: nextPoints }, sourceRect, targetRect);
}

export function terminalPoint(rect: ConnectorRect, terminal: ConnectorTerminal): ConnectorPixelPoint {
  if (terminal.side === "top" || terminal.side === "bottom") {
    return {
      x: snap(rect.left + rect.width * terminal.offset),
      y: snap(terminal.side === "top" ? rect.top : rect.top + rect.height),
    };
  }
  return {
    x: snap(terminal.side === "left" ? rect.left : rect.left + rect.width),
    y: snap(rect.top + rect.height * terminal.offset),
  };
}

export function borderTerminalOptions(): ConnectorTerminal[] {
  return ["top", "right", "bottom", "left"].flatMap((side) => [0.25, 0.5, 0.75].map((offset) => ({
    side: side as ConnectorTerminalSide,
    offset,
  })));
}

function routeFrame(sourceRect: ConnectorRect, targetRect: ConnectorRect): RouteFrame {
  const left = Math.min(sourceRect.left, targetRect.left) - FRAME_PADDING;
  const top = Math.min(sourceRect.top, targetRect.top) - FRAME_PADDING;
  const right = Math.max(sourceRect.left + sourceRect.width, targetRect.left + targetRect.width) + FRAME_PADDING;
  const bottom = Math.max(sourceRect.top + sourceRect.height, targetRect.top + targetRect.height) + FRAME_PADDING;
  return { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

function toNormalized(point: ConnectorPixelPoint, frame: RouteFrame): ConnectorPoint {
  return {
    x: round((point.x - frame.left) / frame.width),
    y: round((point.y - frame.top) / frame.height),
  };
}

function fromNormalized(point: ConnectorPoint, frame: RouteFrame): ConnectorPixelPoint {
  return {
    x: snap(frame.left + point.x * frame.width),
    y: snap(frame.top + point.y * frame.height),
  };
}

function alignTerminalApproach(
  points: ConnectorPixelPoint[],
  side: ConnectorTerminalSide,
  terminal: "source" | "target",
) {
  const endpointIndex = terminal === "source" ? 0 : points.length - 1;
  const adjacentIndex = terminal === "source" ? 1 : points.length - 2;
  const nextIndex = terminal === "source" ? 2 : points.length - 3;
  const endpoint = points[endpointIndex];
  const adjacent = points[adjacentIndex];
  const next = points[nextIndex];
  if (!endpoint || !adjacent) return;
  if (side === "top" || side === "bottom") {
    adjacent.x = endpoint.x;
    if (next) adjacent.y = next.y;
  } else {
    adjacent.y = endpoint.y;
    if (next) adjacent.x = next.x;
  }
}

function simplifyOrthogonalPoints(points: ConnectorPixelPoint[]) {
  const deduplicated = points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || previous.x !== point.x || previous.y !== point.y;
  });
  return deduplicated.filter((point, index) => {
    if (index === 0 || index === deduplicated.length - 1) return true;
    const previous = deduplicated[index - 1];
    const next = deduplicated[index + 1];
    return !((previous.x === point.x && point.x === next.x) || (previous.y === point.y && point.y === next.y));
  });
}

function rectCenter(rect: ConnectorRect): ConnectorPixelPoint {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function oppositeSide(side: ConnectorTerminalSide): ConnectorTerminalSide {
  if (side === "top") return "bottom";
  if (side === "right") return "left";
  if (side === "bottom") return "top";
  return "right";
}

function midpoint(a: number, b: number) {
  return (a + b) / 2;
}

function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round(value: number) {
  return Math.round(value * 10000) / 10000;
}
