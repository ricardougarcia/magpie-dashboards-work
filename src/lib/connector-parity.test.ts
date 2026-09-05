import { describe, expect, it } from "vitest";
import {
  connectorForRelation,
  reverseConnectorRoute,
  setReciprocalConnector,
  synchronizeReciprocalConnectors,
} from "@/lib/connector-parity";
import type { OrthogonalConnectorRoute, TimelineData } from "@/lib/timeline-types";

const canonical: OrthogonalConnectorRoute = {
  source: { side: "bottom", offset: 0.7855172413793103 },
  target: { side: "top", offset: 0.1679699248120301 },
  points: [
    { x: 0.3978, y: 0.2792 },
    { x: 0.3978, y: 0.7208 },
  ],
};

const staleReverse: OrthogonalConnectorRoute = {
  source: { side: "left", offset: 0.5 },
  target: { side: "bottom", offset: 0.4077 },
  points: [
    { x: 0.2923, y: 0.7868 },
    { x: 0.2343, y: 0.7868 },
    { x: 0.2343, y: 0.2792 },
  ],
};

function fixture(): TimelineData {
  return {
    version: 65,
    updatedAt: "2026-09-05T17:20:00.000Z",
    meta: { title: "Timeline", subtitle: "Subtitle", owner: "Owner", period: "Period" },
    lanes: [{ id: "eng-build", name: "Eng Build", displayName: "Eng Build", index: 1 }],
    items: [
      {
        id: "deltas",
        name: "Deltas & Delights",
        lane: "Eng Build",
        description: "Source",
        placement: "Jan - Feb",
        value: "Value",
        relations: [{ targetId: "quality", targetName: "Quality", description: "Pair", connector: structuredClone(canonical) }],
        guidingLights: ["Learn"],
        start: 0,
        end: 1,
        planned: false,
        ongoing: false,
        colorToken: "steel",
        media: null,
      },
      {
        id: "quality",
        name: "Quality",
        lane: "Eng Build",
        description: "Target",
        placement: "Feb - Mar",
        value: "Value",
        relations: [{ targetId: "deltas", targetName: "Deltas & Delights", description: "Reverse pair", connector: structuredClone(staleReverse) }],
        guidingLights: ["Fix"],
        start: 1,
        end: 2,
        planned: false,
        ongoing: false,
        colorToken: "steel",
        media: null,
      },
    ],
  };
}

describe("reciprocal connector parity", () => {
  it("renders both directions from one canonical saved edge", () => {
    const data = fixture();
    const forward = data.items[0].relations[0];
    const reverse = data.items[1].relations[0];

    expect(connectorForRelation(data, "deltas", forward)).toEqual(canonical);
    expect(connectorForRelation(data, "quality", reverse)).toEqual(reverseConnectorRoute(canonical));
  });

  it("updates both directional records when either endpoint edits the edge", () => {
    const data = fixture();
    const editedFromReverse = reverseConnectorRoute({
      ...canonical,
      source: { side: "bottom", offset: 0.6 },
      target: { side: "top", offset: 0.4 },
    });

    setReciprocalConnector(data, "quality", "deltas", editedFromReverse);

    expect(data.items[1].relations[0].connector).toEqual(editedFromReverse);
    expect(data.items[0].relations[0].connector).toEqual(reverseConnectorRoute(editedFromReverse));
  });

  it("repairs conflicting legacy records using stable item-order authority", () => {
    const data = fixture();

    synchronizeReciprocalConnectors(data);

    expect(data.items[0].relations[0].connector).toEqual(canonical);
    expect(data.items[1].relations[0].connector).toEqual(reverseConnectorRoute(canonical));
  });
});
