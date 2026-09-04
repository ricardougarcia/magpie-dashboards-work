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
  return orthogonalizeConnectorPoints(points, route.source.side, route.target.side);
}

export function routeFromPixelPoints(
  route: Pick<OrthogonalConnectorRoute, "source" | "target"> & { points: ConnectorPixelPoint[] },
  sourceRect: ConnectorRect,
  targetRect: ConnectorRect,
): OrthogonalConnectorRoute {
  const frame = routeFrame(sourceRect, targetRect);
  const points = orthogonalizeConnectorPoints(route.points, route.source.side, route.target.side)
    .map((point) => toNormalized(point, frame));
  return { source: route.source, target: route.target, points };
}

export function connectorPath(points: ConnectorPixelPoint[]) {
  const orthogonal = orthogonalizeConnectorPoints(points);
  if (orthogonal.length === 0) return "";
  return orthogonal.slice(1).reduce((path, point, index) => {
    const previous = orthogonal[index];
    if (previous.x === point.x) return `${path} V ${round(point.y)}`;
    return `${path} H ${round(point.x)}`;
  }, `M ${round(orthogonal[0].x)} ${round(orthogonal[0].y)}`);
}

export function normalizeStoredConnectorRoute(route: OrthogonalConnectorRoute): OrthogonalConnectorRoute {
  if (route.points.length < 2) return route;
  const orthogonal: ConnectorPoint[] = [{ x: round(route.points[0].x), y: round(route.points[0].y) }];
  route.points.slice(1).forEach((rawPoint) => {
    const point = { x: round(rawPoint.x), y: round(rawPoint.y) };
    const previous = orthogonal.at(-1)!;
    if (previous.x === point.x || previous.y === point.y) {
      orthogonal.push(point);
      return;
    }
    const beforePrevious = orthogonal.at(-2);
    const previousWasHorizontal = beforePrevious ? beforePrevious.y === previous.y : false;
    const beginVertically = beforePrevious
      ? previousWasHorizontal
      : route.source.side === "top" || route.source.side === "bottom";
    orthogonal.push(
      beginVertically
        ? { x: previous.x, y: point.y }
        : { x: point.x, y: previous.y },
      point,
    );
  });
  return { ...route, points: simplifyOrthogonalPoints(orthogonal) };
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
      x: round(rect.left + rect.width * terminal.offset),
      y: round(terminal.side === "top" ? rect.top : rect.top + rect.height),
    };
  }
  return {
    x: round(terminal.side === "left" ? rect.left : rect.left + rect.width),
    y: round(rect.top + rect.height * terminal.offset),
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

export function orthogonalizeConnectorPoints(
  points: ConnectorPixelPoint[],
  sourceSide?: ConnectorTerminalSide,
  targetSide?: ConnectorTerminalSide,
) {
  if (points.length === 0) return [];
  const candidates = points.map((point, index) => {
    const endpoint = index === 0 || index === points.length - 1;
    return endpoint
      ? { x: round(point.x), y: round(point.y) }
      : { x: snap(point.x), y: snap(point.y) };
  });
  const orthogonal: ConnectorPixelPoint[] = [candidates[0]];

  candidates.slice(1).forEach((candidate) => {
    const previous = orthogonal.at(-1)!;
    if (previous.x === candidate.x || previous.y === candidate.y) {
      orthogonal.push(candidate);
      return;
    }
    const beforePrevious = orthogonal.at(-2);
    const previousWasHorizontal = beforePrevious ? beforePrevious.y === previous.y : false;
    const beginVertically = beforePrevious ? previousWasHorizontal : sourceSide === "top" || sourceSide === "bottom";
    orthogonal.push(
      beginVertically
        ? { x: previous.x, y: candidate.y }
        : { x: candidate.x, y: previous.y },
      candidate,
    );
  });

  let result = simplifyOrthogonalPoints(orthogonal);
  if (sourceSide && result.length >= 2) {
    const start = result[0];
    const adjacent = result[1];
    if (!terminalApproachIsOutward(start, adjacent, sourceSide)) {
      const [outward, detour, bridge] = exteriorTerminalDogleg(start, adjacent, sourceSide);
      result = [start, outward, detour, bridge, ...result.slice(1)];
    }
  }

  if (targetSide && result.length >= 2) {
    const end = result.at(-1)!;
    const adjacent = result.at(-2)!;
    if (!terminalApproachIsOutward(end, adjacent, targetSide)) {
      const [outward, detour, bridge] = exteriorTerminalDogleg(end, adjacent, targetSide);
      result = [...result.slice(0, -1), bridge, detour, outward, end];
    }
  }

  return simplifyOrthogonalPoints(result);
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

function exteriorTerminalDogleg(
  endpoint: ConnectorPixelPoint,
  adjacent: ConnectorPixelPoint,
  side: ConnectorTerminalSide,
): [ConnectorPixelPoint, ConnectorPixelPoint, ConnectorPixelPoint] {
  const distance = GRID * 4;
  const vertical = side === "top" || side === "bottom";
  const outward = vertical
    ? { x: endpoint.x, y: endpoint.y + (side === "top" ? -distance : distance) }
    : { x: endpoint.x + (side === "left" ? -distance : distance), y: endpoint.y };
  const perpendicular = vertical
    ? (adjacent.x >= endpoint.x ? distance : -distance)
    : (adjacent.y >= endpoint.y ? distance : -distance);
  const detour = vertical
    ? { x: outward.x + perpendicular, y: outward.y }
    : { x: outward.x, y: outward.y + perpendicular };
  const bridge = vertical
    ? { x: detour.x, y: adjacent.y }
    : { x: adjacent.x, y: detour.y };
  return [outward, detour, bridge];
}

function terminalApproachIsOutward(
  endpoint: ConnectorPixelPoint,
  adjacent: ConnectorPixelPoint,
  side: ConnectorTerminalSide,
) {
  if (side === "top") return adjacent.x === endpoint.x && adjacent.y <= endpoint.y;
  if (side === "right") return adjacent.y === endpoint.y && adjacent.x >= endpoint.x;
  if (side === "bottom") return adjacent.x === endpoint.x && adjacent.y >= endpoint.y;
  return adjacent.y === endpoint.y && adjacent.x <= endpoint.x;
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
