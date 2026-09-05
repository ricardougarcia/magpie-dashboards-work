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
  straightenConnector,
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
  relationIndex: number;
  targetId: string;
  start: ConnectorPixelPoint;
  route: OrthogonalConnectorRoute;
};

type NetworkConnection = {
  relationIndex: number;
  relation: TimelineRelation;
  target: PositionedItem;
  route: OrthogonalConnectorRoute;
  points: ConnectorPixelPoint[];
};

export function ConnectorRouteEditor({
  data,
  source,
  onChange,
  onDone,
}: {
  data: TimelineData;
  source: TimelineItem;
  onChange: (relationIndex: number, route: OrthogonalConnectorRoute) => void;
  onDone: () => void;
}) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const positioned = useMemo(() => positionItems(data), [data]);
  const sourceItem = positioned.items.find((item) => item.id === source.id) ?? null;
  const eligibleRelations = useMemo(() => source.relations.flatMap((relation, relationIndex) => {
    const target = positioned.items.find((item) => item.id === relation.targetId);
    return target ? [{ relation, relationIndex, target }] : [];
  }), [positioned.items, source.relations]);
  const [activeTargetId, setActiveTargetId] = useState(() => eligibleRelations[0]?.relation.targetId ?? "");
  const [routes, setRoutes] = useState<Record<string, OrthogonalConnectorRoute>>(() => {
    if (!sourceItem) return {};
    return Object.fromEntries(eligibleRelations.map(({ relation, target }) => [
      relation.targetId,
      relation.connector ?? createDefaultConnector(sourceItem.rect, target.rect),
    ]));
  });
  const latestRoutes = useRef(routes);

  const connections = useMemo<NetworkConnection[]>(() => {
    if (!sourceItem) return [];
    return eligibleRelations.flatMap(({ relation, relationIndex, target }) => {
      const route = routes[relation.targetId] ?? relation.connector ?? createDefaultConnector(sourceItem.rect, target.rect);
      return [{
        relationIndex,
        relation,
        target,
        route,
        points: resolveConnectorPoints(route, sourceItem.rect, target.rect),
      }];
    });
  }, [eligibleRelations, routes, sourceItem]);
  const activeConnection = connections.find((connection) => connection.relation.targetId === activeTargetId)
    ?? connections[0]
    ?? null;

  useEffect(() => {
    if (!drag || !sourceItem) return;
    const target = positioned.items.find((item) => item.id === drag.targetId);
    if (!target) return;

    const onPointerMove = (event: PointerEvent) => {
      const point = pointerInBoard(event, boardRef.current);
      const delta = { x: point.x - drag.start.x, y: point.y - drag.start.y };
      let next = drag.route;
      if (drag.kind === "terminal") {
        const rect = drag.terminal === "source" ? sourceItem.rect : target.rect;
        next = moveTerminal(drag.route, drag.terminal, nearestTerminal(rect, point), sourceItem.rect, target.rect);
      } else if (drag.kind === "segment") {
        next = slideSegment(drag.route, drag.segmentIndex, delta, sourceItem.rect, target.rect);
      } else if (drag.kind === "inject") {
        next = injectElbow(drag.route, drag.segmentIndex, delta, sourceItem.rect, target.rect);
      } else {
        next = moveElbow(drag.route, drag.pointIndex, delta, sourceItem.rect, target.rect);
      }
      latestRoutes.current = { ...latestRoutes.current, [drag.targetId]: next };
      setRoutes((current) => ({ ...current, [drag.targetId]: next }));
    };

    const onPointerUp = () => {
      const route = latestRoutes.current[drag.targetId];
      if (route) onChange(drag.relationIndex, route);
      setDrag(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [drag, onChange, positioned.items, sourceItem]);

  if (!sourceItem || connections.length === 0 || !activeConnection) {
    return (
      <section className="connector-workspace connector-workspace-empty">
        <p>This item has no available Connected Work lines to edit.</p>
        <button type="button" onClick={onDone}>Return to item editor</button>
      </section>
    );
  }

  const commitRoute = (connection: NetworkConnection, next: OrthogonalConnectorRoute) => {
    latestRoutes.current = { ...latestRoutes.current, [connection.relation.targetId]: next };
    setRoutes((current) => ({ ...current, [connection.relation.targetId]: next }));
    onChange(connection.relationIndex, next);
  };

  const beginDrag = (
    event: ReactPointerEvent<SVGElement>,
    connection: NetworkConnection,
    nextDrag: DragIntent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveTargetId(connection.relation.targetId);
    const start = pointerInBoard(event.nativeEvent, boardRef.current);
    setDrag({
      ...nextDrag,
      relationIndex: connection.relationIndex,
      targetId: connection.relation.targetId,
      start,
      route: connection.route,
    } as DragState);
    latestRoutes.current = { ...latestRoutes.current, [connection.relation.targetId]: connection.route };
  };

  const setTerminal = (terminal: "source" | "target", nextTerminal: ConnectorTerminal) => {
    const next = moveTerminal(
      activeConnection.route,
      terminal,
      nextTerminal,
      sourceItem.rect,
      activeConnection.target.rect,
    );
    commitRoute(activeConnection, next);
  };

  return (
    <section className="connector-workspace" aria-label={`Edit Connected Work lines for ${source.name}`}>
      <header className="connector-workspace-header">
        <div>
          <span className="index-mark">[LINE NETWORK / EDIT]</span>
          <h2>Orthogonal line network</h2>
          <p><strong>{source.name}</strong><CornerDownRight size={13} /><strong>{connections.length} connected item{connections.length === 1 ? "" : "s"}</strong></p>
        </div>
        <div className="connector-workspace-actions">
          <button
            type="button"
            onClick={() => commitRoute(
              activeConnection,
              straightenConnector(activeConnection.route, sourceItem.rect, activeConnection.target.rect),
            )}
          ><RotateCcw size={14} /> Straighten active line</button>
          <button type="button" className="primary-button" onClick={onDone}><Check size={14} /> Done</button>
        </div>
      </header>

      <div className="connector-network-picker" aria-label="Connected Work lines">
        {connections.map((connection, index) => (
          <button
            type="button"
            key={connection.relation.targetId}
            className={connection.relation.targetId === activeConnection.relation.targetId ? "is-active" : ""}
            aria-pressed={connection.relation.targetId === activeConnection.relation.targetId}
            onClick={() => setActiveTargetId(connection.relation.targetId)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{connection.target.name}</strong>
            <small>{connection.relation.connector ? "Custom route" : "Default route"}</small>
          </button>
        ))}
      </div>

      <div className="connector-instructions">
        <span>Select a line or Connected Work item to make it active</span>
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
            const isTarget = connections.some((connection) => connection.target.id === item.id);
            const isActiveTarget = item.id === activeConnection.target.id;
            return (
              <button
                type="button"
                className={`connector-board-item color-${item.colorToken} ${isSource ? "is-source" : ""} ${isTarget ? "is-target" : ""} ${isActiveTarget ? "is-active-target" : ""} ${!isSource && !isTarget ? "is-context" : ""}`}
                key={item.id}
                style={{ left: item.rect.left, top: item.rect.top, width: item.rect.width, height: item.rect.height }}
                onClick={() => {
                  if (isTarget) setActiveTargetId(item.id);
                }}
                disabled={!isTarget}
              >
                <span>{item.name}</span>
              </button>
            );
          })}

          <svg className="connector-editor-svg" width={positioned.width} height={positioned.height} aria-label="Editable Connected Work line network">
            {connections.map((connection) => {
              const active = connection.relation.targetId === activeConnection.relation.targetId;
              return (
                <g
                  className={`connector-network-route ${active ? "is-active" : ""}`}
                  key={connection.relation.targetId}
                >
                  <path className="connector-route-shadow" d={connectorPath(connection.points)} />
                  <path className="connector-route-line" d={connectorPath(connection.points)} />
                  <path
                    className="connector-route-select"
                    d={connectorPath(connection.points)}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setActiveTargetId(connection.relation.targetId);
                    }}
                  />
                </g>
              );
            })}

            {activeConnection.points.slice(1).map((point, segmentIndex) => {
              const start = activeConnection.points[segmentIndex];
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
                    onPointerDown={(event) => beginDrag(event, activeConnection, { kind: "segment", segmentIndex })}
                  />
                  <rect
                    className="connector-mid-handle"
                    x={middle.x - 4}
                    y={middle.y - 4}
                    width={8}
                    height={8}
                    onPointerDown={(event) => beginDrag(event, activeConnection, { kind: "inject", segmentIndex })}
                  />
                </g>
              );
            })}

            {activeConnection.points.slice(1, -1).map((point, index) => (
              <rect
                className="connector-elbow-handle"
                key={`elbow-${index + 1}`}
                x={point.x - 3.5}
                y={point.y - 3.5}
                width={7}
                height={7}
                onPointerDown={(event) => beginDrag(event, activeConnection, { kind: "elbow", pointIndex: index + 1 })}
              />
            ))}

            <rect
              className="connector-terminal-handle is-source"
              x={terminalPoint(sourceItem.rect, activeConnection.route.source).x - 5}
              y={terminalPoint(sourceItem.rect, activeConnection.route.source).y - 5}
              width={10}
              height={10}
              onPointerDown={(event) => beginDrag(event, activeConnection, { kind: "terminal", terminal: "source" })}
            />
            <rect
              className="connector-terminal-handle is-target"
              x={terminalPoint(activeConnection.target.rect, activeConnection.route.target).x - 5}
              y={terminalPoint(activeConnection.target.rect, activeConnection.route.target).y - 5}
              width={10}
              height={10}
              onPointerDown={(event) => beginDrag(event, activeConnection, { kind: "terminal", terminal: "target" })}
            />
          </svg>
        </div>
      </div>

      <div className="connector-terminal-controls">
        <TerminalControl label="Start border" value={activeConnection.route.source} onChange={(terminal) => setTerminal("source", terminal)} />
        <TerminalControl label="End border" value={activeConnection.route.target} onChange={(terminal) => setTerminal("target", terminal)} />
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
