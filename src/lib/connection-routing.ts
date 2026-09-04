export type RoutingPoint = {
  x: number;
  y: number;
};

export type RoutingRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type RoutingTarget = {
  id: string;
  targetId: string;
  rect: RoutingRect;
};

export type RoutedConnection = {
  id: string;
  targetId: string;
  path: string;
  points: RoutingPoint[];
};

type Side = "top" | "right" | "bottom" | "left";
type GridCell = { column: number; row: number };
type SearchState = GridCell & { direction: number };
type QueueEntry = SearchState & { priority: number };

const DIRECTIONS = [
  { column: 1, row: 0 },
  { column: 0, row: 1 },
  { column: -1, row: 0 },
  { column: 0, row: -1 },
] as const;

export function routeConnections({
  bounds,
  source,
  targets,
  obstacles,
  gridSize = 6,
  obstaclePadding = 4,
}: {
  bounds: RoutingRect;
  source: RoutingRect;
  targets: RoutingTarget[];
  obstacles: RoutingRect[];
  gridSize?: number;
  obstaclePadding?: number;
}): RoutedConnection[] {
  if (targets.length === 0) return [];

  const grid = createGrid(bounds, gridSize);
  const obstacleCells = new Set<number>();
  obstacles.forEach((rect) => markRect(grid, expandRect(rect, obstaclePadding), obstacleCells));

  const usedCells = new Set<number>();
  const orderedTargets = [...targets].sort((a, b) => {
    const aDistance = manhattan(rectCenter(source), rectCenter(a.rect));
    const bDistance = manhattan(rectCenter(source), rectCenter(b.rect));
    return bDistance - aDistance || a.targetId.localeCompare(b.targetId);
  });
  const sideAssignments = assignSourcePorts(source, orderedTargets);
  const routed = new Map<string, RoutedConnection>();

  orderedTargets.forEach((target, routeIndex) => {
    const fallbackSides = preferredSides(source, target.rect);
    const preferred = sideAssignments.get(target.id) ?? { ...fallbackSides, fraction: 0.5 };
    const sidePairs = candidateSidePairs(preferred.sourceSide, preferred.targetSide);
    let route: RoutedConnection | null = null;

    for (const [sourceSide, targetSide] of sidePairs) {
      const sourcePort = edgePoint(source, sourceSide, preferred.fraction);
      const targetPort = edgePoint(target.rect, targetSide, 0.5);
      const sourceLead = outwardPoint(sourcePort, sourceSide, obstaclePadding + gridSize * 2);
      const targetLead = outwardPoint(targetPort, targetSide, obstaclePadding + gridSize * 2);
      const start = grid.toCell(sourceLead);
      const end = grid.toCell(targetLead);
      const snappedStart = grid.toPoint(start);
      const snappedEnd = grid.toPoint(end);
      const startIndex = grid.index(start);
      const endIndex = grid.index(end);

      const unavailable = new Set(obstacleCells);
      usedCells.forEach((cell) => unavailable.add(cell));
      unavailable.delete(startIndex);
      unavailable.delete(endIndex);

      const cells = findOrthogonalPath(grid, start, end, unavailable);
      if (!cells) continue;

      const routedPoints = simplifyPoints([
        sourcePort,
        sourceLead,
        bridgePoint(sourceLead, snappedStart, sourceSide),
        ...cells.map(grid.toPoint),
        bridgePoint(targetLead, snappedEnd, targetSide),
        targetLead,
        targetPort,
      ]);
      route = {
        id: target.id,
        targetId: target.targetId,
        path: pointsToPath(routedPoints),
        points: routedPoints,
      };
      cells.forEach((cell) => usedCells.add(grid.index(cell)));
      break;
    }

    if (!route) {
      const fallbackOffset = (routeIndex + 1) * (gridSize * 3);
      const sourcePort = edgePoint(source, "bottom", preferred.fraction);
      const targetPort = edgePoint(target.rect, "top", 0.5);
      const railY = Math.min(bounds.bottom - gridSize, Math.max(source.bottom, target.rect.bottom) + fallbackOffset);
      const points = simplifyPoints([
        sourcePort,
        { x: sourcePort.x, y: railY },
        { x: targetPort.x, y: railY },
        targetPort,
      ]);
      route = {
        id: target.id,
        targetId: target.targetId,
        path: pointsToPath(points),
        points,
      };
    }

    routed.set(target.id, route);
  });

  return targets.flatMap((target) => {
    const route = routed.get(target.id);
    return route ? [route] : [];
  });
}

function createGrid(bounds: RoutingRect, size: number) {
  const columns = Math.max(2, Math.floor((bounds.right - bounds.left) / size) + 1);
  const rows = Math.max(2, Math.floor((bounds.bottom - bounds.top) / size) + 1);
  const clampCell = ({ column, row }: GridCell): GridCell => ({
    column: Math.min(columns - 1, Math.max(0, column)),
    row: Math.min(rows - 1, Math.max(0, row)),
  });
  return {
    bounds,
    size,
    columns,
    rows,
    index: ({ column, row }: GridCell) => row * columns + column,
    toCell: (point: RoutingPoint) => clampCell({
      column: Math.round((point.x - bounds.left) / size),
      row: Math.round((point.y - bounds.top) / size),
    }),
    toPoint: ({ column, row }: GridCell): RoutingPoint => ({
      x: bounds.left + column * size,
      y: bounds.top + row * size,
    }),
  };
}

function markRect(
  grid: ReturnType<typeof createGrid>,
  rect: RoutingRect,
  marked: Set<number>,
) {
  const first = grid.toCell({ x: rect.left, y: rect.top });
  const last = grid.toCell({ x: rect.right, y: rect.bottom });
  for (let row = first.row; row <= last.row; row += 1) {
    for (let column = first.column; column <= last.column; column += 1) {
      marked.add(grid.index({ column, row }));
    }
  }
}

function findOrthogonalPath(
  grid: ReturnType<typeof createGrid>,
  start: GridCell,
  end: GridCell,
  unavailable: Set<number>,
) {
  const queue = new MinHeap();
  const startState: SearchState = { ...start, direction: -1 };
  queue.push({ ...startState, priority: 0 });
  const startKey = stateKey(startState, grid.columns);
  const distance = new Map<number, number>([[startKey, 0]]);
  const previous = new Map<number, number>();
  const states = new Map<number, SearchState>([[startKey, startState]]);
  let finalKey: number | null = null;

  while (queue.size > 0) {
    const current = queue.pop();
    if (!current) break;
    const currentKey = stateKey(current, grid.columns);
    const known = distance.get(currentKey);
    if (known === undefined) continue;
    if (current.column === end.column && current.row === end.row) {
      finalKey = currentKey;
      break;
    }

    DIRECTIONS.forEach((direction, directionIndex) => {
      const next: SearchState = {
        column: current.column + direction.column,
        row: current.row + direction.row,
        direction: directionIndex,
      };
      if (next.column < 0 || next.column >= grid.columns || next.row < 0 || next.row >= grid.rows) return;
      const cellIndex = grid.index(next);
      if (unavailable.has(cellIndex) && !(next.column === end.column && next.row === end.row)) return;

      const nextKey = stateKey(next, grid.columns);
      const turnCost = current.direction === -1 || current.direction === directionIndex ? 0 : 0.42;
      const edgeCost = next.column === 0 || next.row === 0 || next.column === grid.columns - 1 || next.row === grid.rows - 1 ? 0.08 : 0;
      const nextDistance = known + 1 + turnCost + edgeCost;
      if (nextDistance >= (distance.get(nextKey) ?? Number.POSITIVE_INFINITY)) return;

      distance.set(nextKey, nextDistance);
      previous.set(nextKey, currentKey);
      states.set(nextKey, next);
      const heuristic = Math.abs(end.column - next.column) + Math.abs(end.row - next.row);
      queue.push({ ...next, priority: nextDistance + heuristic });
    });
  }

  if (finalKey === null) return null;
  const path: GridCell[] = [];
  let cursor: number | undefined = finalKey;
  while (cursor !== undefined) {
    const state = states.get(cursor);
    if (state) path.push({ column: state.column, row: state.row });
    cursor = previous.get(cursor);
  }
  return path.reverse();
}

function assignSourcePorts(source: RoutingRect, targets: RoutingTarget[]) {
  const groups = new Map<Side, Array<{ target: RoutingTarget; targetSide: Side }>>();
  targets.forEach((target) => {
    const sides = preferredSides(source, target.rect);
    const group = groups.get(sides.sourceSide) ?? [];
    group.push({ target, targetSide: sides.targetSide });
    groups.set(sides.sourceSide, group);
  });

  const assignments = new Map<string, { sourceSide: Side; targetSide: Side; fraction: number }>();
  groups.forEach((group, sourceSide) => {
    group.sort((a, b) => {
      const aCenter = rectCenter(a.target.rect);
      const bCenter = rectCenter(b.target.rect);
      return sourceSide === "top" || sourceSide === "bottom"
        ? aCenter.x - bCenter.x
        : aCenter.y - bCenter.y;
    });
    group.forEach(({ target, targetSide }, index) => {
      assignments.set(target.id, {
        sourceSide,
        targetSide,
        fraction: (index + 1) / (group.length + 1),
      });
    });
  });
  return assignments;
}

function preferredSides(source: RoutingRect, target: RoutingRect) {
  const sourceCenter = rectCenter(source);
  const targetCenter = rectCenter(target);
  const deltaX = targetCenter.x - sourceCenter.x;
  const deltaY = targetCenter.y - sourceCenter.y;
  if (Math.abs(deltaX) > Math.abs(deltaY) * 1.35) {
    return deltaX >= 0
      ? { sourceSide: "right" as const, targetSide: "left" as const }
      : { sourceSide: "left" as const, targetSide: "right" as const };
  }
  return deltaY >= 0
    ? { sourceSide: "bottom" as const, targetSide: "top" as const }
    : { sourceSide: "top" as const, targetSide: "bottom" as const };
}

function candidateSidePairs(sourceSide: Side, targetSide: Side): Array<[Side, Side]> {
  const opposite: Record<Side, Side> = { top: "bottom", right: "left", bottom: "top", left: "right" };
  const perpendicular: Record<Side, [Side, Side]> = {
    top: ["left", "right"],
    right: ["top", "bottom"],
    bottom: ["right", "left"],
    left: ["bottom", "top"],
  };
  return [
    [sourceSide, targetSide],
    [perpendicular[sourceSide][0], opposite[perpendicular[sourceSide][0]]],
    [perpendicular[sourceSide][1], opposite[perpendicular[sourceSide][1]]],
    [opposite[sourceSide], opposite[targetSide]],
  ];
}

function edgePoint(rect: RoutingRect, side: Side, fraction: number): RoutingPoint {
  const safeFraction = Math.min(0.84, Math.max(0.16, fraction));
  if (side === "top" || side === "bottom") {
    return {
      x: rect.left + (rect.right - rect.left) * safeFraction,
      y: side === "top" ? rect.top : rect.bottom,
    };
  }
  return {
    x: side === "left" ? rect.left : rect.right,
    y: rect.top + (rect.bottom - rect.top) * safeFraction,
  };
}

function bridgePoint(lead: RoutingPoint, snapped: RoutingPoint, side: Side): RoutingPoint {
  return side === "top" || side === "bottom"
    ? { x: snapped.x, y: lead.y }
    : { x: lead.x, y: snapped.y };
}

function outwardPoint(point: RoutingPoint, side: Side, distance: number): RoutingPoint {
  if (side === "top") return { x: point.x, y: point.y - distance };
  if (side === "right") return { x: point.x + distance, y: point.y };
  if (side === "bottom") return { x: point.x, y: point.y + distance };
  return { x: point.x - distance, y: point.y };
}

function simplifyPoints(points: RoutingPoint[]) {
  const deduplicated = points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || previous.x !== point.x || previous.y !== point.y;
  });
  return deduplicated.filter((point, index) => {
    if (index === 0 || index === deduplicated.length - 1) return true;
    const previous = deduplicated[index - 1];
    const next = deduplicated[index + 1];
    return !((previous.x === point.x && point.x === next.x) || (previous.y === point.y && point.y === next.y));
  });
}

function pointsToPath(points: RoutingPoint[]) {
  if (points.length === 0) return "";
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    if (previous.y === point.y) return `${path} H ${round(point.x)}`;
    if (previous.x === point.x) return `${path} V ${round(point.y)}`;
    return `${path} L ${round(point.x)} ${round(point.y)}`;
  }, `M ${round(points[0].x)} ${round(points[0].y)}`);
}

function expandRect(rect: RoutingRect, padding: number): RoutingRect {
  return {
    left: rect.left - padding,
    top: rect.top - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding,
  };
}

function rectCenter(rect: RoutingRect): RoutingPoint {
  return { x: (rect.left + rect.right) / 2, y: (rect.top + rect.bottom) / 2 };
}

function manhattan(a: RoutingPoint, b: RoutingPoint) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function stateKey(state: SearchState, columns: number) {
  return ((state.row * columns + state.column) * 5) + (state.direction + 1);
}

class MinHeap {
  private values: QueueEntry[] = [];

  get size() {
    return this.values.length;
  }

  push(entry: QueueEntry) {
    this.values.push(entry);
    let index = this.values.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.values[parent].priority <= entry.priority) break;
      this.values[index] = this.values[parent];
      index = parent;
    }
    this.values[index] = entry;
  }

  pop() {
    if (this.values.length === 0) return undefined;
    const first = this.values[0];
    const last = this.values.pop();
    if (this.values.length === 0 || !last) return first;
    let index = 0;
    while (true) {
      const left = index * 2 + 1;
      const right = left + 1;
      if (left >= this.values.length) break;
      let child = left;
      if (right < this.values.length && this.values[right].priority < this.values[left].priority) child = right;
      if (this.values[child].priority >= last.priority) break;
      this.values[index] = this.values[child];
      index = child;
    }
    this.values[index] = last;
    return first;
  }
}
