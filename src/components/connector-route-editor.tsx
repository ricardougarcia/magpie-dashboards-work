"use client";

import { Check, CornerDownRight, RotateCcw, X } from "lucide-react";
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  borderTerminalOptions,
  connectorPath,
  createDefaultConnector,
  injectElbow,
  moveElbow,
  moveTerminal,
  nearestTerminal,
  resolveConnectorPoints,
  slideSegment,
  terminalPoint,
  type ConnectorPixelPoint,
  type ConnectorRect,
} from "@/lib/orthogonal-connectors";
import {
  MONTHS,
  placementSpan,
  type ConnectorTerminal,
  type OrthogonalConnectorRoute,
  type TimelineData,
  type TimelineItem,
  type TimelineRelation,
} from "@/lib/timeline-types";

const LABEL_WIDTH = 190;
const MONTH_WIDTH = 92;
const LANE_HEADER_HEIGHT = 34;
const ROW_HEIGHT = 38;
const BAR_HEIGHT = 27;
const CANVAS_PADDING = 18;

type PositionedItem = TimelineItem & { rect: ConnectorRect };
type DragIntent =
  | { kind: "terminal"; terminal: "source" | "target" }
  | { kind: "segment"; segmentIndex: number }
  | { kind: "inject"; segmentIndex: number }
  | { kind: "elbow"; pointIndex: number };

type DragState = DragIntent & {
  start: ConnectorPixelPoint;
  route: OrthogonalConnectorRoute;
};

export function ConnectorRouteEditor({
  data,
  source,
  relation,
  onChange,
  onDone,
}: {
  data: TimelineData;
  source: TimelineItem;
  relation: TimelineRelation;
  onChange: (route: OrthogonalConnectorRoute) => void;
  onDone: () => void;
}) {
  const target = data.items.find((item) => item.id === relation.targetId) ?? null;
  const boardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const positioned = useMemo(() => positionItems(data), [data]);
  const sourceItem = positioned.items.find((item) => item.id === source.id) ?? null;
  const targetItem = positioned.items.find((item) => item.id === relation.targetId) ?? null;
  const defaultRoute = useMemo(() => {
    if (!sourceItem || !targetItem) return null;
    return createDefaultConnector(sourceItem.rect, targetItem.rect);
  }, [sourceItem, targetItem]);
  const [route, setRoute] = useState<OrthogonalConnectorRoute | null>(() => relation.connector ?? defaultRoute);
  const latestRoute = useRef<OrthogonalConnectorRoute | null>(route);

  useEffect(() => {
    if (!drag || !sourceItem || !targetItem) return;

    const onPointerMove = (event: PointerEvent) => {
      const point = pointerInBoard(event, boardRef.current);
      const delta = { x: point.x - drag.start.x, y: point.y - drag.start.y };
      let next = drag.route;
      if (drag.kind === "terminal") {
        const rect = drag.terminal === "source" ? sourceItem.rect : targetItem.rect;
        next = moveTerminal(drag.route, drag.terminal, nearestTerminal(rect, point), sourceItem.rect, targetItem.rect);
      } else if (drag.kind === "segment") {
        next = slideSegment(drag.route, drag.segmentIndex, delta, sourceItem.rect, targetItem.rect);
      } else if (drag.kind === "inject") {
        next = injectElbow(drag.route, drag.segmentIndex, delta, sourceItem.rect, targetItem.rect);
      } else {
        next = moveElbow(drag.route, drag.pointIndex, delta, sourceItem.rect, targetItem.rect);
      }
      latestRoute.current = next;
      setRoute(next);
    };

    const onPointerUp = () => {
      if (latestRoute.current) onChange(latestRoute.current);
      setDrag(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, onChange, sourceItem, targetItem]);

  if (!target || !sourceItem || !targetItem || !route) {
    return (
      <section className="connector-workspace connector-workspace-empty">
        <p>The selected Connected Work item is not available in the timeline.</p>
        <button type="button" onClick={onDone}>Return to item editor</button>
      </section>
    );
  }

  const points = resolveConnectorPoints(route, sourceItem.rect, targetItem.rect);
  const sourceTerminalPoint = terminalPoint(sourceItem.rect, route.source);
  const targetTerminalPoint = terminalPoint(targetItem.rect, route.target);

  const commitRoute = (next: OrthogonalConnectorRoute) => {
    latestRoute.current = next;
    setRoute(next);
    onChange(next);
  };

  const beginDrag = (
    event: ReactPointerEvent<SVGElement>,
    nextDrag: DragIntent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    const start = pointerInBoard(event.nativeEvent, boardRef.current);
    setDrag({ ...nextDrag, start, route } as DragState);
    latestRoute.current = route;
  };

  const setTerminal = (terminal: "source" | "target", nextTerminal: ConnectorTerminal) => {
    commitRoute(moveTerminal(route, terminal, nextTerminal, sourceItem.rect, targetItem.rect));
  };

  return (
    <section className="connector-workspace" aria-label={`Edit connector from ${source.name} to ${target.name}`}>
      <header className="connector-workspace-header">
        <div>
          <span className="index-mark">[LINE / EDIT]</span>
          <h2>Orthogonal connector</h2>
          <p><strong>{source.name}</strong><CornerDownRight size={13} /><strong>{target.name}</strong></p>
        </div>
        <div className="connector-workspace-actions">
          <button type="button" onClick={() => defaultRoute && commitRoute(defaultRoute)}><RotateCcw size={14} /> Reset route</button>
          <button type="button" className="primary-button" onClick={onDone}><Check size={14} /> Done</button>
        </div>
      </header>

      <div className="connector-instructions">
        <span><i className="instruction-terminal" /> Drag a square terminal to another border</span>
        <span><i className="instruction-segment" /> Drag a segment perpendicular to its direction</span>
        <span><i className="instruction-node" /> Drag a midpoint node to inject an elbow</span>
      </div>

      <div className="connector-scroll">
        <div
          className={`connector-board ${drag ? `is-dragging-${drag.kind}` : ""}`}
          ref={boardRef}
          style={{ width: positioned.width, height: positioned.height }}
        >
          <div className="connector-month-axis" style={{ left: LABEL_WIDTH, width: MONTH_WIDTH * 12 }}>
            {MONTHS.map((month) => <span key={month}>{month}</span>)}
          </div>
          {positioned.lanes.map((lane) => (
            <div className="connector-lane-rule" key={lane.name} style={{ top: lane.top, height: lane.height }}>
              <span>{lane.displayName}</span>
            </div>
          ))}

          {positioned.items.map((item) => {
            const isSource = item.id === source.id;
            const isTarget = item.id === target.id;
            return (
              <div
                className={`connector-board-item color-${item.colorToken} ${isSource ? "is-source" : ""} ${isTarget ? "is-target" : ""} ${!isSource && !isTarget ? "is-context" : ""}`}
                key={item.id}
                style={{ left: item.rect.left, top: item.rect.top, width: item.rect.width, height: item.rect.height }}
              >
                <span>{item.name}</span>
              </div>
            );
          })}

          <svg className="connector-editor-svg" width={positioned.width} height={positioned.height} aria-label="Editable orthogonal connector">
            <path className="connector-route-shadow" d={connectorPath(points)} />
            <path className="connector-route-line" d={connectorPath(points)} />

            {points.slice(1).map((point, segmentIndex) => {
              const start = points[segmentIndex];
              const horizontal = start.y === point.y;
              const middle = { x: (start.x + point.x) / 2, y: (start.y + point.y) / 2 };
              return (
                <g className="connector-segment-group" key={`segment-${segmentIndex}`}>
                  <line
                    className={`connector-segment-hit ${horizontal ? "is-horizontal" : "is-vertical"}`}
                    x1={start.x}
                    y1={start.y}
                    x2={point.x}
                    y2={point.y}
                    onPointerDown={(event) => beginDrag(event, { kind: "segment", segmentIndex })}
                  />
                  <rect
                    className="connector-mid-handle"
                    x={middle.x - 4}
                    y={middle.y - 4}
                    width={8}
                    height={8}
                    onPointerDown={(event) => beginDrag(event, { kind: "inject", segmentIndex })}
                  />
                </g>
              );
            })}

            {points.slice(1, -1).map((point, index) => (
              <rect
                className="connector-elbow-handle"
                key={`elbow-${index + 1}`}
                x={point.x - 3.5}
                y={point.y - 3.5}
                width={7}
                height={7}
                onPointerDown={(event) => beginDrag(event, { kind: "elbow", pointIndex: index + 1 })}
              />
            ))}

            <rect
              className="connector-terminal-handle is-source"
              x={sourceTerminalPoint.x - 5}
              y={sourceTerminalPoint.y - 5}
              width={10}
              height={10}
              onPointerDown={(event) => beginDrag(event, { kind: "terminal", terminal: "source" })}
            />
            <rect
              className="connector-terminal-handle is-target"
              x={targetTerminalPoint.x - 5}
              y={targetTerminalPoint.y - 5}
              width={10}
              height={10}
              onPointerDown={(event) => beginDrag(event, { kind: "terminal", terminal: "target" })}
            />
          </svg>
        </div>
      </div>

      <div className="connector-terminal-controls">
        <TerminalControl label="Start border" value={route.source} onChange={(terminal) => setTerminal("source", terminal)} />
        <TerminalControl label="End border" value={route.target} onChange={(terminal) => setTerminal("target", terminal)} />
        <button className="connector-close-mobile" type="button" onClick={onDone}><X size={13} /> Close line editor</button>
      </div>
    </section>
  );
}

function TerminalControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ConnectorTerminal;
  onChange: (terminal: ConnectorTerminal) => void;
}) {
  return (
    <fieldset>
      <legend>{label}</legend>
      <div>
        {borderTerminalOptions().filter((terminal) => terminal.offset === 0.5).map((terminal) => (
          <button
            className={value.side === terminal.side ? "is-active" : ""}
            key={terminal.side}
            type="button"
            onClick={() => onChange(terminal)}
            aria-pressed={value.side === terminal.side}
          >{terminal.side}</button>
        ))}
      </div>
    </fieldset>
  );
}

function positionItems(data: TimelineData) {
  const lanes: Array<{ name: string; displayName: string; top: number; height: number }> = [];
  const items: PositionedItem[] = [];
  let top = 42;

  data.lanes.forEach((lane) => {
    const laneItems = data.items.filter((item) => item.lane === lane.name);
    const rows = assignRows(laneItems);
    const height = LANE_HEADER_HEIGHT + Math.max(1, rows.count) * ROW_HEIGHT + 8;
    lanes.push({ name: lane.name, displayName: lane.displayName, top, height });
    laneItems.forEach((item) => {
      const row = rows.rows.get(item.id) ?? 0;
      const left = LABEL_WIDTH + item.start * MONTH_WIDTH + 5;
      const width = Math.max(34, placementSpan(item.start, item.end) * MONTH_WIDTH - 10);
      items.push({
        ...item,
        rect: {
          left,
          top: top + LANE_HEADER_HEIGHT + row * ROW_HEIGHT + 5,
          width,
          height: BAR_HEIGHT,
        },
      });
    });
    top += height;
  });

  return {
    lanes,
    items,
    width: LABEL_WIDTH + MONTH_WIDTH * 12 + CANVAS_PADDING,
    height: top + CANVAS_PADDING,
  };
}

function assignRows(items: TimelineItem[]) {
  const rows = new Map<string, number>();
  const rowEnds: number[] = [];
  [...items].sort((a, b) => a.start - b.start || a.end - b.end).forEach((item) => {
    let row = rowEnds.findIndex((end) => end < item.start);
    if (row === -1) row = rowEnds.length;
    rowEnds[row] = item.end;
    rows.set(item.id, row);
  });
  return { rows, count: rowEnds.length };
}

function pointerInBoard(event: PointerEvent, board: HTMLDivElement | null) {
  const rect = board?.getBoundingClientRect();
  return {
    x: event.clientX - (rect?.left ?? 0),
    y: event.clientY - (rect?.top ?? 0),
  };
}
