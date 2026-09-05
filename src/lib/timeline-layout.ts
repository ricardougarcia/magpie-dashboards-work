import { placementSpan, type TimelineData, type TimelineItem } from "@/lib/timeline-types";
import type { ConnectorRect } from "@/lib/orthogonal-connectors";

export type TimelineRowAssignment = {
  rows: Map<string, number>;
  count: number;
};

export type TimelineLayoutOptions = {
  labelWidth: number;
  monthWidth: number;
  monthCount: number;
  laneHeaderHeight: number;
  rowHeight: number;
  barHeight: number;
  laneGap: number;
  barInset: number;
  topInset: number;
  canvasPadding: number;
  includePlanned?: boolean;
};

export type PositionedTimelineItem = TimelineItem & {
  row: number;
  rect: ConnectorRect;
};

export const CONNECTOR_LAYOUT_OPTIONS: TimelineLayoutOptions = {
  labelWidth: 190,
  monthWidth: 92,
  monthCount: 12,
  laneHeaderHeight: 34,
  rowHeight: 38,
  barHeight: 27,
  laneGap: 8,
  barInset: 5,
  topInset: 42,
  canvasPadding: 18,
  includePlanned: true,
};

export type PositionedTimelineLane = {
  name: string;
  displayName: string;
  top: number;
  height: number;
  rowCount: number;
};

export function assignTimelineRows(items: TimelineItem[]): TimelineRowAssignment {
  const rows = new Map<string, number>();
  const rowEnds: number[] = [];
  [...items]
    .sort((first, second) => first.start - second.start || first.end - second.end)
    .forEach((item) => {
      let row = rowEnds.findIndex((end) => end < item.start);
      if (row === -1) row = rowEnds.length;
      rowEnds[row] = item.end;
      rows.set(item.id, row);
    });
  return { rows, count: rowEnds.length };
}

export function createConnectorTimelineLayout(data: TimelineData) {
  return createTimelineLayout(data, CONNECTOR_LAYOUT_OPTIONS);
}

export function createTimelineLayout(data: TimelineData, options: TimelineLayoutOptions) {
  const lanes: PositionedTimelineLane[] = [];
  const items: PositionedTimelineItem[] = [];
  let top = options.topInset;

  data.lanes.forEach((lane) => {
    const laneItems = data.items.filter((item) => (
      item.lane === lane.name
      && (options.includePlanned || !item.planned)
      && item.start < options.monthCount
    ));
    const assignment = assignTimelineRows(laneItems);
    const rowCount = Math.max(1, assignment.count);
    const height = options.laneHeaderHeight + rowCount * options.rowHeight + options.laneGap;
    lanes.push({
      name: lane.name,
      displayName: lane.displayName,
      top,
      height,
      rowCount,
    });
    laneItems.forEach((item) => {
      const row = assignment.rows.get(item.id) ?? 0;
      items.push({
        ...item,
        row,
        rect: {
          left: options.labelWidth + item.start * options.monthWidth + options.barInset,
          top: top + options.laneHeaderHeight + row * options.rowHeight + options.barInset,
          width: Math.max(
            options.rowHeight - options.barInset * 2,
            placementSpan(item.start, item.end) * options.monthWidth - options.barInset * 2,
          ),
          height: options.barHeight,
        },
      });
    });
    top += height;
  });

  return {
    lanes,
    items,
    width: options.labelWidth + options.monthWidth * options.monthCount + options.canvasPadding,
    height: top + options.canvasPadding,
  };
}
