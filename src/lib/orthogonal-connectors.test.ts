import { describe, expect, it } from "vitest";
import { timelineItemSchema } from "@/lib/timeline-schema";
import type { ConnectorTerminal } from "@/lib/timeline-types";
import {
  connectorPath,
  createDefaultConnector,
  injectElbow,
  moveElbow,
  moveTerminal,
  normalizeStoredConnectorRoute,
  orthogonalizeConnectorPoints,
  resolveConnectorPoints,
  routeFromPixelPoints,
  slideSegment,
  straightenConnector,
  TERMINAL_ALIGNMENT_SNAP_THRESHOLD,
  terminalPoint,
  type ConnectorPixelPoint,
  type ConnectorRect,
} from "@/lib/orthogonal-connectors";

const source: ConnectorRect = { left: 20, top: 30, width: 150, height: 30 };
const target: ConnectorRect = { left: 360, top: 190, width: 180, height: 30 };

function expectOrthogonal(points: ConnectorPixelPoint[]) {
  points.slice(1).forEach((point, index) => {
    const previous = points[index];
    expect(previous.x === point.x || previous.y === point.y).toBe(true);
  });
}

function expectBorderStop(point: ConnectorPixelPoint, rect: ConnectorRect, terminal: ConnectorTerminal) {
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  if (terminal.side === "top") expect(point.y).toBe(rect.top);
  if (terminal.side === "right") expect(point.x).toBe(right);
  if (terminal.side === "bottom") expect(point.y).toBe(bottom);
  if (terminal.side === "left") expect(point.x).toBe(rect.left);
  expect(point.x).toBeGreaterThanOrEqual(rect.left);
  expect(point.x).toBeLessThanOrEqual(right);
  expect(point.y).toBeGreaterThanOrEqual(rect.top);
  expect(point.y).toBeLessThanOrEqual(bottom);
}

function routeLength(points: ConnectorPixelPoint[]) {
  return points.slice(1).reduce((total, point, index) => (
    total + Math.abs(point.x - points[index].x) + Math.abs(point.y - points[index].y)
  ), 0);
}

function expectNoInteriorPenetration(points: ConnectorPixelPoint[], rect: ConnectorRect) {
  const epsilon = 0.001;
  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;
  points.slice(1).forEach((point, index) => {
    const previous = points[index];
    if (previous.y === point.y && previous.y > rect.top + epsilon && previous.y < bottom - epsilon) {
      expect(Math.max(previous.x, point.x) <= rect.left + epsilon || Math.min(previous.x, point.x) >= right - epsilon).toBe(true);
    }
    if (previous.x === point.x && previous.x > rect.left + epsilon && previous.x < right - epsilon) {
      expect(Math.max(previous.y, point.y) <= rect.top + epsilon || Math.min(previous.y, point.y) >= bottom - epsilon).toBe(true);
    }
  });
}

function expectOutwardApproach(endpoint: ConnectorPixelPoint, adjacent: ConnectorPixelPoint, side: ConnectorTerminal["side"]) {
  if (side === "top") {
    expect(adjacent.x).toBe(endpoint.x);
    expect(adjacent.y).toBeLessThan(endpoint.y);
  } else if (side === "right") {
    expect(adjacent.y).toBe(endpoint.y);
    expect(adjacent.x).toBeGreaterThan(endpoint.x);
  } else if (side === "bottom") {
    expect(adjacent.x).toBe(endpoint.x);
    expect(adjacent.y).toBeGreaterThan(endpoint.y);
  } else {
    expect(adjacent.y).toBe(endpoint.y);
    expect(adjacent.x).toBeLessThan(endpoint.x);
  }
}

describe("owner-defined orthogonal connector geometry", () => {
  it("creates an orthogonal default route attached to item borders", () => {
    const route = createDefaultConnector(source, target);
    const points = resolveConnectorPoints(route, source, target);

    expect(points[0]).toEqual(terminalPoint(source, route.source));
    expect(points.at(-1)).toEqual(terminalPoint(target, route.target));
    expectOrthogonal(points);
  });

  it("repairs diagonal legacy points before rendering and emits only horizontal or vertical SVG commands", () => {
    const diagonal = [{ x: 20, y: 30 }, { x: 240, y: 120 }, { x: 540, y: 190 }];
    const repaired = orthogonalizeConnectorPoints(diagonal, "right", "left");

    expectOrthogonal(repaired);
    expect(connectorPath(diagonal)).not.toContain(" L ");
    expect(connectorPath(diagonal)).toMatch(/^M [\d.-]+ [\d.-]+(?: [HV] [\d.-]+)+$/);
  });

  it("normalizes diagonal persisted control points into schema-safe right angles", () => {
    const route = normalizeStoredConnectorRoute({
      source: { side: "right", offset: 0.5 },
      target: { side: "left", offset: 0.5 },
      points: [{ x: 0.08, y: 0.2 }, { x: 0.52, y: 0.68 }, { x: 0.92, y: 0.8 }],
    });

    expectOrthogonal(route.points);
    expect(route.points.length).toBeGreaterThan(3);
  });

  it("repairs a two-point saved route after independent item movement", () => {
    const route = {
      source: { side: "right", offset: 0.5 } as const,
      target: { side: "left", offset: 0.5 } as const,
      points: [{ x: 0.08, y: 0.2 }, { x: 0.92, y: 0.8 }],
    };
    const movedSource = { ...source, left: 84, top: 122 };
    const movedTarget = { ...target, left: 612, top: 64 };
    const points = resolveConnectorPoints(route, movedSource, movedTarget);

    expectOrthogonal(points);
    expect(points[0]).toEqual(terminalPoint(movedSource, route.source));
    expect(points.at(-1)).toEqual(terminalPoint(movedTarget, route.target));
  });

  it("straightens a manipulated route to the shortest border-safe path with no more than one elbow", () => {
    let route = createDefaultConnector(source, target);
    route = injectElbow(route, 1, { x: 0, y: 80 }, source, target);
    route = injectElbow(route, 2, { x: 64, y: 0 }, source, target);
    const before = resolveConnectorPoints(route, source, target);
    const straightened = straightenConnector(route, source, target);
    const after = resolveConnectorPoints(straightened, source, target);
    const start = terminalPoint(source, straightened.source);
    const end = terminalPoint(target, straightened.target);

    expect(after.length).toBeLessThan(before.length);
    expect(after.length).toBeLessThanOrEqual(3);
    const pathCommands = connectorPath(after).split(/\s+/).filter((token) => token === "H" || token === "V");
    expect(pathCommands.length).toBeLessThanOrEqual(2);
    expect(routeLength(after)).toBe(Math.abs(end.x - start.x) + Math.abs(end.y - start.y));
    expectOrthogonal(after);
    expectBorderStop(after[0], source, straightened.source);
    expectBorderStop(after.at(-1)!, target, straightened.target);
    expectOutwardApproach(after[0], after[1], straightened.source.side);
    expectOutwardApproach(after.at(-1)!, after.at(-2)!, straightened.target.side);
    expectNoInteriorPenetration(after, source);
    expectNoInteriorPenetration(after, target);
  });

  it("reselects incompatible terminals as needed while keeping every straightened route to one elbow", () => {
    const sides = ["top", "right", "bottom", "left"] as const;
    sides.forEach((sourceSide, sourceIndex) => {
      sides.forEach((targetSide, targetIndex) => {
        let route = createDefaultConnector(source, target);
        const sourceTerminal = { side: sourceSide, offset: 0.2 + sourceIndex * 0.17 };
        const targetTerminal = { side: targetSide, offset: 0.23 + targetIndex * 0.16 };
        route = moveTerminal(route, "source", sourceTerminal, source, target);
        route = moveTerminal(route, "target", targetTerminal, source, target);
        route = injectElbow(route, 1, { x: 44, y: 56 }, source, target);
        const straightened = straightenConnector(route, source, target);
        const points = resolveConnectorPoints(straightened, source, target);

        expect(points.length).toBeLessThanOrEqual(3);
        expectOrthogonal(points);
        expectBorderStop(points[0], source, straightened.source);
        expectBorderStop(points.at(-1)!, target, straightened.target);
        expectOutwardApproach(points[0], points[1], straightened.source.side);
        expectOutwardApproach(points.at(-1)!, points.at(-2)!, straightened.target.side);
        expectNoInteriorPenetration(points, source);
        expectNoInteriorPenetration(points, target);
      });
    });
  });

  it("keeps one-elbow straightening border-safe in every relative item quadrant", () => {
    const centeredSource: ConnectorRect = { left: 300, top: 200, width: 150, height: 30 };
    const targets: ConnectorRect[] = [
      { left: 600, top: 360, width: 180, height: 30 },
      { left: 20, top: 360, width: 180, height: 30 },
      { left: 600, top: 20, width: 180, height: 30 },
      { left: 20, top: 20, width: 180, height: 30 },
    ];

    targets.forEach((quadrantTarget) => {
      const straightened = straightenConnector(
        createDefaultConnector(centeredSource, quadrantTarget),
        centeredSource,
        quadrantTarget,
      );
      const points = resolveConnectorPoints(straightened, centeredSource, quadrantTarget);

      expect(points.length).toBeLessThanOrEqual(3);
      expectOrthogonal(points);
      expectBorderStop(points[0], centeredSource, straightened.source);
      expectBorderStop(points.at(-1)!, quadrantTarget, straightened.target);
      expectOutwardApproach(points[0], points[1], straightened.source.side);
      expectOutwardApproach(points.at(-1)!, points.at(-2)!, straightened.target.side);
      expectNoInteriorPenetration(points, centeredSource);
      expectNoInteriorPenetration(points, quadrantTarget);
    });
  });

  it("keeps shared fractional terminal coordinates exact instead of expanding them into micro-doglegs", () => {
    const wideSource: ConnectorRect = { left: 195, top: 119, width: 266, height: 27 };
    const shiftedTarget: ConnectorRect = { left: 379, top: 271, width: 266, height: 27 };
    let route = createDefaultConnector(wideSource, shiftedTarget);
    route = injectElbow(route, 1, { x: 72, y: 64 }, wideSource, shiftedTarget);

    const straightened = straightenConnector(route, wideSource, shiftedTarget);
    const points = resolveConnectorPoints(straightened, wideSource, shiftedTarget);

    expect(straightened.points.length).toBeLessThanOrEqual(4);
    expect(points.length).toBeLessThanOrEqual(4);
    expect(points[0].x).toBe(points.at(-1)!.x);
    expectOrthogonal(points);
    expectNoInteriorPenetration(points, wideSource);
    expectNoInteriorPenetration(points, shiftedTarget);
  });

  it("preserves a saved zero-elbow route across connector workspace, editor preview, and public rectangles", () => {
    const saved = {
      source: { side: "bottom", offset: 0.7855172413793103 } as const,
      target: { side: "top", offset: 0.1679699248120301 } as const,
      points: [
        { x: 0.3978, y: 0.2792 },
        { x: 0.3978, y: 0.7208 },
      ],
    };
    const viewRects = [
      {
        source: { left: 195, top: 380.53125, width: 174, height: 27 },
        target: { left: 287, top: 494.53125, width: 266, height: 27 },
      },
      {
        source: { left: 284, top: 387.1875, width: 163.109375, height: 31 },
        target: { left: 369.546875, top: 483.1875, width: 248.65625, height: 31 },
      },
      {
        source: { left: 195, top: 933.53125, width: 220.390625, height: 23 },
        target: { left: 310.1875, top: 1019.53125, width: 335.59375, height: 23 },
      },
    ];

    viewRects.forEach((view) => {
      const points = resolveConnectorPoints(saved, view.source, view.target);
      expect(points).toHaveLength(2);
      expect(points[0].x).toBe(points[1].x);
      expectOrthogonal(points);
      expectNoInteriorPenetration(points, view.source);
      expectNoInteriorPenetration(points, view.target);
    });
  });

  it("uses a zero-elbow direct route when item borders can be aligned", () => {
    const alignedTarget: ConnectorRect = { left: 360, top: 30, width: 180, height: 30 };
    const straightened = straightenConnector(createDefaultConnector(source, alignedTarget), source, alignedTarget);
    const points = resolveConnectorPoints(straightened, source, alignedTarget);

    expect(points).toHaveLength(2);
    expectOrthogonal(points);
    expectBorderStop(points[0], source, straightened.source);
    expectBorderStop(points[1], alignedTarget, straightened.target);
    expectNoInteriorPenetration(points, source);
    expectNoInteriorPenetration(points, alignedTarget);
  });

  it("snaps a near-collinear vertical terminal and removes the redundant dogleg", () => {
    const upper: ConnectorRect = { left: 0, top: 0, width: 100, height: 40 };
    const lower: ConnectorRect = { left: 20, top: 120, width: 100, height: 40 };
    const route = routeFromPixelPoints({
      source: { side: "bottom", offset: 0.5 },
      target: { side: "top", offset: 0.36 },
      points: [
        { x: 50, y: 40 },
        { x: 50, y: 80 },
        { x: 56, y: 80 },
        { x: 56, y: 120 },
      ],
    }, upper, lower);

    const moved = moveTerminal(route, "source", { side: "bottom", offset: 0.51 }, upper, lower);
    const points = resolveConnectorPoints(moved, upper, lower);

    expect(TERMINAL_ALIGNMENT_SNAP_THRESHOLD).toBe(6);
    expect(points).toEqual([{ x: 56, y: 40 }, { x: 56, y: 120 }]);
    expect(moved.source.offset).toBe(0.56);
    expectOrthogonal(points);
    expectBorderStop(points[0], upper, moved.source);
    expectBorderStop(points[1], lower, moved.target);
    expectOutwardApproach(points[0], points[1], moved.source.side);
    expectOutwardApproach(points[1], points[0], moved.target.side);
    expectNoInteriorPenetration(points, upper);
    expectNoInteriorPenetration(points, lower);
  });

  it("snaps a near-collinear horizontal terminal and removes the redundant dogleg", () => {
    const left: ConnectorRect = { left: 0, top: 0, width: 40, height: 100 };
    const right: ConnectorRect = { left: 120, top: 20, width: 40, height: 100 };
    const route = routeFromPixelPoints({
      source: { side: "right", offset: 0.5 },
      target: { side: "left", offset: 0.36 },
      points: [
        { x: 40, y: 50 },
        { x: 80, y: 50 },
        { x: 80, y: 56 },
        { x: 120, y: 56 },
      ],
    }, left, right);

    const moved = moveTerminal(route, "source", { side: "right", offset: 0.51 }, left, right);
    const points = resolveConnectorPoints(moved, left, right);

    expect(points).toEqual([{ x: 40, y: 56 }, { x: 120, y: 56 }]);
    expect(moved.source.offset).toBe(0.56);
    expectOrthogonal(points);
    expectNoInteriorPenetration(points, left);
    expectNoInteriorPenetration(points, right);
  });

  it("does not snap a terminal just outside the narrow alignment threshold", () => {
    const upper: ConnectorRect = { left: 0, top: 0, width: 100, height: 40 };
    const lower: ConnectorRect = { left: 20, top: 120, width: 100, height: 40 };
    const route = routeFromPixelPoints({
      source: { side: "bottom", offset: 0.5 },
      target: { side: "top", offset: 0.36 },
      points: [
        { x: 50, y: 40 },
        { x: 50, y: 80 },
        { x: 56, y: 80 },
        { x: 56, y: 120 },
      ],
    }, upper, lower);

    const moved = moveTerminal(route, "source", { side: "bottom", offset: 0.49 }, upper, lower);
    const points = resolveConnectorPoints(moved, upper, lower);

    expect(moved.source.offset).toBe(0.49);
    expect(points.length).toBeGreaterThan(2);
    expectOrthogonal(points);
  });

  it("applies the same near-collinear snap from the target endpoint", () => {
    const upper: ConnectorRect = { left: 0, top: 0, width: 100, height: 40 };
    const lower: ConnectorRect = { left: 20, top: 120, width: 100, height: 40 };
    const route = routeFromPixelPoints({
      source: { side: "bottom", offset: 0.5 },
      target: { side: "top", offset: 0.36 },
      points: [
        { x: 50, y: 40 },
        { x: 50, y: 80 },
        { x: 56, y: 80 },
        { x: 56, y: 120 },
      ],
    }, upper, lower);

    const moved = moveTerminal(route, "target", { side: "top", offset: 0.35 }, upper, lower);
    const points = resolveConnectorPoints(moved, upper, lower);

    expect(points).toEqual([{ x: 50, y: 40 }, { x: 50, y: 120 }]);
    expect(moved.target.offset).toBe(0.3);
    expectOrthogonal(points);
    expectNoInteriorPenetration(points, upper);
    expectNoInteriorPenetration(points, lower);
  });

  it("moves either terminal to a new border while preserving a right-angle path", () => {
    const initial = createDefaultConnector(source, target);
    const moved = moveTerminal(initial, "source", { side: "top", offset: 0.25 }, source, target);
    const points = resolveConnectorPoints(moved, source, target);

    expect(moved.source).toEqual({ side: "top", offset: 0.25 });
    expect(points[0]).toEqual(terminalPoint(source, moved.source));
    expectOrthogonal(points);
  });

  it("slides a connector segment only in its perpendicular direction", () => {
    const initial = createDefaultConnector(source, target);
    const before = resolveConnectorPoints(initial, source, target);
    const moved = slideSegment(initial, 1, { x: 48, y: 80 }, source, target);
    const after = resolveConnectorPoints(moved, source, target);

    expect(after[1].x).toBe(before[1].x + 48);
    expect(after[1].y).toBe(before[1].y);
    expectOrthogonal(after);
  });

  it("injects a draggable dogleg from a segment midpoint", () => {
    const initial = createDefaultConnector(source, target);
    const before = resolveConnectorPoints(initial, source, target);
    const injected = injectElbow(initial, 0, { x: 0, y: 52 }, source, target);
    const after = resolveConnectorPoints(injected, source, target);

    expect(after.length).toBeGreaterThan(before.length);
    expectOrthogonal(after);
  });

  it("moves an existing elbow while retaining orthogonal neighboring segments", () => {
    const initial = createDefaultConnector(source, target);
    const moved = moveElbow(initial, 1, { x: 36, y: 28 }, source, target);
    const points = resolveConnectorPoints(moved, source, target);

    expectOrthogonal(points);
    expect(points[0]).toEqual(terminalPoint(source, moved.source));
    expect(points.at(-1)).toEqual(terminalPoint(target, moved.target));
  });

  it("keeps every source and target side on exact fractional borders with outward approaches", () => {
    const fractionalSource: ConnectorRect = { left: 21.25, top: 31.5, width: 151.75, height: 31.25 };
    const fractionalTarget: ConnectorRect = { left: 361.75, top: 189.25, width: 181.5, height: 32.75 };
    const sides = ["top", "right", "bottom", "left"] as const;
    sides.forEach((sourceSide) => {
      sides.forEach((targetSide) => {
        let route = createDefaultConnector(fractionalSource, fractionalTarget);
        route = moveTerminal(route, "source", { side: sourceSide, offset: 0.13 }, fractionalSource, fractionalTarget);
        route = moveTerminal(route, "target", { side: targetSide, offset: 0.87 }, fractionalSource, fractionalTarget);
        const points = resolveConnectorPoints(route, fractionalSource, fractionalTarget);
        const first = points[0];
        const second = points[1];
        const beforeLast = points.at(-2)!;
        const last = points.at(-1)!;

        expectOrthogonal(points);
        expectBorderStop(first, fractionalSource, route.source);
        expectBorderStop(last, fractionalTarget, route.target);
        expectOutwardApproach(first, second, route.source.side);
        expectOutwardApproach(last, beforeLast, route.target.side);
      });
    });
  });

  it("repairs inward terminal segments before they can bleed into either item", () => {
    const inward = orthogonalizeConnectorPoints([
      { x: source.left + source.width, y: source.top + 12 },
      { x: source.left + source.width - 40, y: source.top + 12 },
      { x: target.left + 40, y: target.top + 12 },
      { x: target.left, y: target.top + 12 },
    ], "right", "left");

    expectOutwardApproach(inward[0], inward[1], "right");
    expectOutwardApproach(inward.at(-1)!, inward.at(-2)!, "left");
    expectOrthogonal(inward);
  });

  it("keeps every draggable segment orthogonal after parallel sliding", () => {
    const initial = createDefaultConnector(source, target);
    const points = resolveConnectorPoints(initial, source, target);
    points.slice(1).forEach((_point, segmentIndex) => {
      const moved = slideSegment(initial, segmentIndex, { x: 36, y: 44 }, source, target);
      expectOrthogonal(resolveConnectorPoints(moved, source, target));
    });
  });

  it("tracks item movement by recomputing endpoints from persisted terminals", () => {
    const route = createDefaultConnector(source, target);
    const movedSource = { ...source, left: 90, top: 110 };
    const movedTarget = { ...target, left: 520, top: 80 };
    const points = resolveConnectorPoints(route, movedSource, movedTarget);

    expect(points[0]).toEqual(terminalPoint(movedSource, route.source));
    expect(points.at(-1)).toEqual(terminalPoint(movedTarget, route.target));
    expectOrthogonal(points);
  });

  it("keeps legacy relations valid and rejects diagonal persisted connector points", () => {
    const item = {
      id: "source",
      name: "Source",
      lane: "Eng Build",
      description: "Context",
      placement: "Jan - Feb",
      value: "Value",
      relations: [{ targetId: "target", targetName: "Target", description: "Connection" }],
      guidingLights: ["Learn"],
      start: 0,
      end: 1,
      planned: false,
      ongoing: false,
      colorToken: "graphite",
      media: null,
    };
    expect(timelineItemSchema.safeParse(item).success).toBe(true);
    expect(timelineItemSchema.safeParse({
      ...item,
      relations: [{
        ...item.relations[0],
        connector: {
          source: { side: "right", offset: 0.5 },
          target: { side: "left", offset: 0.5 },
          points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        },
      }],
    }).success).toBe(false);
  });
});
