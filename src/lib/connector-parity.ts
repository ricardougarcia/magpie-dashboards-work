import type {
  OrthogonalConnectorRoute,
  TimelineData,
  TimelineRelation,
} from "@/lib/timeline-types";

export function reverseConnectorRoute(route: OrthogonalConnectorRoute): OrthogonalConnectorRoute {
  return {
    source: { ...route.target },
    target: { ...route.source },
    points: [...route.points].reverse().map((point) => ({ ...point })),
  };
}

export function connectorForRelation(
  data: TimelineData,
  sourceId: string,
  relation: TimelineRelation,
): OrthogonalConnectorRoute | undefined {
  const sourceIndex = data.items.findIndex((item) => item.id === sourceId);
  const targetIndex = data.items.findIndex((item) => item.id === relation.targetId);
  if (sourceIndex < 0 || targetIndex < 0) return relation.connector;

  const source = data.items[sourceIndex];
  const target = data.items[targetIndex];
  const sourceFirst = sourceIndex < targetIndex;
  const canonicalSource = sourceFirst ? source : target;
  const canonicalTarget = sourceFirst ? target : source;
  const canonicalRelation = canonicalSource.relations.find((entry) => entry.targetId === canonicalTarget.id);
  const reverseRelation = canonicalTarget.relations.find((entry) => entry.targetId === canonicalSource.id);
  const canonical = canonicalRelation?.connector
    ?? (reverseRelation?.connector ? reverseConnectorRoute(reverseRelation.connector) : undefined);

  if (!canonical) return relation.connector;
  return sourceFirst ? canonical : reverseConnectorRoute(canonical);
}

export function setReciprocalConnector(
  data: TimelineData,
  sourceId: string,
  targetId: string,
  route: OrthogonalConnectorRoute,
) {
  const sourceIndex = data.items.findIndex((item) => item.id === sourceId);
  const targetIndex = data.items.findIndex((item) => item.id === targetId);
  if (sourceIndex < 0 || targetIndex < 0) return;

  const source = data.items[sourceIndex];
  const target = data.items[targetIndex];
  const sourceRelation = source.relations.find((relation) => relation.targetId === targetId);
  if (sourceRelation) sourceRelation.connector = cloneConnector(route);

  const reverseRelation = target.relations.find((relation) => relation.targetId === sourceId);
  if (reverseRelation) reverseRelation.connector = reverseConnectorRoute(route);
}

export function synchronizeReciprocalConnectors(data: TimelineData) {
  const visited = new Set<string>();
  data.items.forEach((source, sourceIndex) => {
    source.relations.forEach((relation) => {
      const targetIndex = data.items.findIndex((item) => item.id === relation.targetId);
      if (targetIndex < 0) return;
      const target = data.items[targetIndex];
      const reverseRelation = target.relations.find((entry) => entry.targetId === source.id);
      if (!reverseRelation) return;

      const key = sourceIndex < targetIndex
        ? `${source.id}\u0000${target.id}`
        : `${target.id}\u0000${source.id}`;
      if (visited.has(key)) return;
      visited.add(key);

      const canonicalSource = sourceIndex < targetIndex ? source : target;
      const canonicalTarget = sourceIndex < targetIndex ? target : source;
      const canonicalRelation = canonicalSource.relations.find((entry) => entry.targetId === canonicalTarget.id);
      const oppositeRelation = canonicalTarget.relations.find((entry) => entry.targetId === canonicalSource.id);
      const canonical = canonicalRelation?.connector
        ?? (oppositeRelation?.connector ? reverseConnectorRoute(oppositeRelation.connector) : undefined);
      if (!canonical || !canonicalRelation || !oppositeRelation) return;

      canonicalRelation.connector = cloneConnector(canonical);
      oppositeRelation.connector = reverseConnectorRoute(canonical);
    });
  });
  return data;
}

function cloneConnector(route: OrthogonalConnectorRoute): OrthogonalConnectorRoute {
  return {
    source: { ...route.source },
    target: { ...route.target },
    points: route.points.map((point) => ({ ...point })),
  };
}
