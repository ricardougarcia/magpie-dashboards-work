import { describe, expect, it } from "vitest";
import { timelineItemSchema } from "@/lib/timeline-schema";
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

  it("keeps all source and target border combinations orthogonal", () => {
    const sides = ["top", "right", "bottom", "left"] as const;
    sides.forEach((sourceSide) => {
      sides.forEach((targetSide) => {
        let route = createDefaultConnector(source, target);
        route = moveTerminal(route, "source", { side: sourceSide, offset: 0.5 }, source, target);
        route = moveTerminal(route, "target", { side: targetSide, offset: 0.5 }, source, target);
        expectOrthogonal(route.points);
        expectOrthogonal(resolveConnectorPoints(route, source, target));
      });
    });
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
