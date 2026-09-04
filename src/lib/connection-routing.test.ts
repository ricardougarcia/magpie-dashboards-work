import { describe, expect, it } from "vitest";
import {
  routeConnections,
  type RoutedConnection,
  type RoutingPoint,
  type RoutingRect,
} from "@/lib/connection-routing";

const source: RoutingRect = { left: 525, top: 94, right: 984, bottom: 140 };
const targets = [
  { id: "source-left", targetId: "left", rect: { left: 44, top: 94, right: 504, bottom: 140 } },
  { id: "source-bottom", targetId: "bottom", rect: { left: 525, top: 292, right: 984, bottom: 338 } },
  { id: "source-upper", targetId: "upper", rect: { left: 283, top: 18, right: 743, bottom: 64 } },
  { id: "source-right", targetId: "right", rect: { left: 1004, top: 166, right: 1094, bottom: 212 } },
];
const unrelated: RoutingRect[] = [
  { left: 283, top: 149, right: 743, bottom: 195 },
  { left: 45, top: 224, right: 504, bottom: 270 },
  { left: 525, top: 224, right: 984, bottom: 270 },
  { left: 45, top: 350, right: 504, bottom: 396 },
];
const obstacles = [source, ...targets.map((target) => target.rect), ...unrelated];

function segments(route: RoutedConnection) {
  return route.points.slice(1).map((point, index) => [route.points[index], point] as const);
}

function segmentIntersectsRectInterior([a, b]: readonly [RoutingPoint, RoutingPoint], rect: RoutingRect) {
  if (a.x === b.x) {
    const top = Math.min(a.y, b.y);
    const bottom = Math.max(a.y, b.y);
    return a.x > rect.left && a.x < rect.right && bottom > rect.top && top < rect.bottom;
  }
  if (a.y === b.y) {
    const left = Math.min(a.x, b.x);
    const right = Math.max(a.x, b.x);
    return a.y > rect.top && a.y < rect.bottom && right > rect.left && left < rect.right;
  }
  return true;
}

function segmentsIntersect(
  [a1, a2]: readonly [RoutingPoint, RoutingPoint],
  [b1, b2]: readonly [RoutingPoint, RoutingPoint],
) {
  const aVertical = a1.x === a2.x;
  const bVertical = b1.x === b2.x;
  if (aVertical && bVertical) {
    if (a1.x !== b1.x) return false;
    const aTop = Math.min(a1.y, a2.y);
    const aBottom = Math.max(a1.y, a2.y);
    const bTop = Math.min(b1.y, b2.y);
    const bBottom = Math.max(b1.y, b2.y);
    return Math.max(aTop, bTop) <= Math.min(aBottom, bBottom);
  }
  if (!aVertical && !bVertical) {
    if (a1.y !== b1.y) return false;
    const aLeft = Math.min(a1.x, a2.x);
    const aRight = Math.max(a1.x, a2.x);
    const bLeft = Math.min(b1.x, b2.x);
    const bRight = Math.max(b1.x, b2.x);
    return Math.max(aLeft, bLeft) <= Math.min(aRight, bRight);
  }
  const vertical = aVertical ? [a1, a2] as const : [b1, b2] as const;
  const horizontal = aVertical ? [b1, b2] as const : [a1, a2] as const;
  const x = vertical[0].x;
  const y = horizontal[0].y;
  return x >= Math.min(horizontal[0].x, horizontal[1].x)
    && x <= Math.max(horizontal[0].x, horizontal[1].x)
    && y >= Math.min(vertical[0].y, vertical[1].y)
    && y <= Math.max(vertical[0].y, vertical[1].y);
}

describe("routeConnections", () => {
  const routes = routeConnections({
    bounds: { left: 0, top: 0, right: 1100, bottom: 410 },
    source,
    targets,
    obstacles,
  });

  it("returns one routed connector for every connected item", () => {
    expect(routes).toHaveLength(targets.length);
    expect(routes.map((route) => route.targetId)).toEqual(targets.map((target) => target.targetId));
  });

  it("uses only orthogonal line segments", () => {
    routes.forEach((route) => {
      segments(route).forEach(([a, b]) => {
        expect(a.x === b.x || a.y === b.y).toBe(true);
      });
    });
  });

  it("never runs through the selected item, connected items, or unrelated Gantt bars", () => {
    routes.forEach((route) => {
      segments(route).forEach((segment) => {
        obstacles.forEach((rect) => {
          expect(segmentIntersectsRectInterior(segment, rect)).toBe(false);
        });
      });
    });
  });

  it("keeps every connector on an independent channel without overlap or crossing", () => {
    routes.forEach((route, routeIndex) => {
      routes.slice(routeIndex + 1).forEach((other) => {
        segments(route).forEach((segment) => {
          segments(other).forEach((otherSegment) => {
            expect(segmentsIntersect(segment, otherSegment)).toBe(false);
          });
        });
      });
    });
  });
});
