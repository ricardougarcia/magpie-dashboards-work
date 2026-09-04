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
  slideSegment,
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
