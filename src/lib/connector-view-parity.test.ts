import { describe, expect, it } from "vitest";
import { connectorForRelation, reverseConnectorRoute } from "@/lib/connector-parity";
import { connectorPath, resolveConnectorPoints, type ConnectorRect } from "@/lib/orthogonal-connectors";
import { createConnectorTimelineLayout } from "@/lib/timeline-layout";
import { prepareTimelineSave } from "@/lib/timeline-persistence";
import type { OrthogonalConnectorRoute, TimelineData, TimelineItem, TimelineRelation } from "@/lib/timeline-types";

const SOURCE_ID = "completion";

function item(
  id: string,
  name: string,
  lane: string,
  start: number,
  end: number,
  relations: TimelineRelation[] = [],
): TimelineItem {
  return {
    id,
    name,
    lane,
    description: name,
    placement: name,
    value: name,
    relations,
    guidingLights: ["Stabilize"],
    start,
    end,
    planned: false,
    ongoing: false,
    colorToken: lane === "Eng Build" ? "steel" : "signal",
    media: null,
  };
}

const routes: Record<string, OrthogonalConnectorRoute | undefined> = {
  infra: {
    source: { side: "left", offset: 0.399 },
    target: { side: "bottom", offset: 0.3451 },
    points: [{ x: 0.419, y: 0.8118 }, { x: 0.2368, y: 0.8118 }, { x: 0.2368, y: 0.234 }],
  },
  usage: {
    source: { side: "top", offset: 0.8458646616541353 },
    target: { side: "bottom", offset: 0.15413533834586465 },
    points: [{ x: 0.5, y: 0.7208 }, { x: 0.5, y: 0.2792 }],
  },
  roar: undefined,
  bugs: {
    source: { side: "bottom", offset: 0.5 },
    target: { side: "top", offset: 0.6655 },
    points: [
      { x: 0.6818, y: 0.0852 },
      { x: 0.6818, y: 0.426 },
      { x: 0.4051, y: 0.426 },
      { x: 0.4051, y: 0.9163 },
    ],
  },
  k2: {
    source: { side: "bottom", offset: 0.6590977443609024 },
    target: { side: "top", offset: 0.478850574712644 },
    points: [{ x: 0.6314, y: 0.0872 }, { x: 0.6314, y: 0.9128 }],
  },
};

function fixture(): TimelineData {
  const targets = [
    item("infra", "Infra", "Eng Build", 0, 2),
    item("usage", "Usage", "Eng Build", 4, 6),
    item("roar", "ROAR", "Eng Build", 6, 8),
    item("bugs", "Bugs", "Challenges Planned / Unplanned", 0, 2),
    item("k2", "K-2", "Challenges Planned / Unplanned", 3, 4),
  ];
  const sourceRelations = targets.map((target) => ({
    targetId: target.id,
    targetName: target.name,
    description: `${target.name} relation`,
    connector: routes[target.id] ? structuredClone(routes[target.id]) : undefined,
  }));
  const source = item(SOURCE_ID, "V2 (1/3) Completion Dashboard", "Eng Build", 2, 4, sourceRelations);
  targets.forEach((target) => {
    const forward = sourceRelations.find((relation) => relation.targetId === target.id)?.connector;
    target.relations = [{
      targetId: source.id,
      targetName: source.name,
      description: `${source.name} relation`,
      connector: forward ? reverseConnectorRoute(forward) : undefined,
    }];
  });
  return {
    version: 121,
    updatedAt: "2026-09-05T21:35:52.756Z",
    meta: { title: "Timeline", subtitle: "Subtitle", owner: "Owner", period: "Jan–Sep" },
    lanes: [
      { id: "eng", name: "Eng Build", displayName: "Eng Build", index: 1 },
      { id: "challenges", name: "Challenges Planned / Unplanned", displayName: "Curve balls", index: 2 },
    ],
    items: [targets[0], source, targets[1], targets[2], targets[3], targets[4]],
  };
}

function mapRects(layout: { items: Array<{ id: string; rect: ConnectorRect }> }) {
  return new Map(layout.items.map((entry) => [entry.id, entry.rect]));
}

function transformRects(
  rects: Map<string, ConnectorRect>,
  transform: (rect: ConnectorRect) => ConnectorRect,
) {
  return new Map([...rects].map(([id, rect]) => [id, transform(rect)]));
}

function signature(route: OrthogonalConnectorRoute, source: ConnectorRect, target: ConnectorRect) {
  const path = connectorPath(resolveConnectorPoints(route, source, target));
  return [...path.matchAll(/[HV]/g)].map((match) => match[0]).join("");
}

describe("five-edge V2 connector parity", () => {
  it("keeps one canonical saved topology across workspace, public, packed editor, and reciprocal reload", () => {
    const saved = prepareTimelineSave(fixture(), "2026-09-05T22:00:00.000Z");
    const source = saved.items.find((entry) => entry.id === SOURCE_ID)!;
    const workspace = mapRects(createConnectorTimelineLayout(saved));
    const publicView = new Map<string, ConnectorRect>([
      [SOURCE_ID, { left: 434.984375, top: 439.171875, width: 349.984375, height: 23 }],
      ["infra", { left: 195, top: 322.171875, width: 349.984375, height: 23 }],
      ["usage", { left: 674.984375, top: 351.171875, width: 349.984375, height: 23 }],
      ["roar", { left: 914.984375, top: 438.171875, width: 349.984375, height: 23 }],
      ["bugs", { left: 195, top: 809.171875, width: 349.984375, height: 23 }],
      ["k2", { left: 554.984375, top: 780.171875, width: 229.984375, height: 23 }],
    ]);
    const normalEditor = transformRects(workspace, (rect) => ({
      left: 280 + (rect.left - 190) * (100 / 92),
      top: 38 + (rect.top - 42) * (48 / 38),
      width: rect.width * (100 / 92),
      height: 31,
    }));
    const expected = new Map([
      ["infra", "HV"],
      ["usage", "V"],
      ["roar", "H"],
      ["bugs", "VHV"],
      ["k2", "V"],
    ]);

    source.relations.forEach((relation) => {
      const target = saved.items.find((entry) => entry.id === relation.targetId)!;
      const route = connectorForRelation(saved, source.id, relation)!;
      const reverseRelation = target.relations.find((entry) => entry.targetId === source.id)!;
      const reverse = connectorForRelation(saved, target.id, reverseRelation)!;
      const viewSignatures = [workspace, publicView, normalEditor].map((rects) => signature(
        route,
        rects.get(source.id)!,
        rects.get(target.id)!,
      ));

      expect(relation.connector).toBeDefined();
      expect(reverse).toEqual(reverseConnectorRoute(route));
      expect(new Set(viewSignatures)).toEqual(new Set([expected.get(target.id)]));
      expect(signature(
        reverse,
        workspace.get(target.id)!,
        workspace.get(source.id)!,
      )).toBe([...expected.get(target.id)!].reverse().join(""));
    });
  });
});
