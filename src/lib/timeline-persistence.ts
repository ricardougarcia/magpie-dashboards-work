import { materializeMissingConnectors, synchronizeReciprocalConnectors } from "@/lib/connector-parity";
import { normalizeStoredConnectorRoute } from "@/lib/orthogonal-connectors";
import { timelineDataSchema } from "@/lib/timeline-schema";
import { colorTokenForLane, type TimelineData } from "@/lib/timeline-types";

export function prepareTimelineSave(input: TimelineData, updatedAt = new Date().toISOString()): TimelineData {
  const next: TimelineData = {
    ...input,
    version: input.version + 1,
    updatedAt,
    items: input.items.map((item) => ({
      ...item,
      colorToken: colorTokenForLane(item.lane),
      relations: item.relations.map((relation) => ({
        ...relation,
        ...(relation.connector ? { connector: normalizeStoredConnectorRoute(relation.connector) } : {}),
      })),
    })),
  };
  materializeMissingConnectors(next);
  return timelineDataSchema.parse(synchronizeReciprocalConnectors(next)) as TimelineData;
}
