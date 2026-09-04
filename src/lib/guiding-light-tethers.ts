export type GuidingTetherRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type GuidingTetherGeometry = {
  path: string;
  source: { x: number; y: number };
  target: { x: number; y: number };
};

export function guidingLightTetherGeometry(
  cell: GuidingTetherRect,
  item: GuidingTetherRect,
  canvas: GuidingTetherRect,
  index: number,
  count: number,
): GuidingTetherGeometry {
  const safeCount = Math.max(1, count);
  const safeIndex = Math.min(Math.max(0, index), safeCount - 1);
  const source = {
    x: round(cell.left - canvas.left + cell.width * ((safeIndex + 1) / (safeCount + 1))),
    y: round(cell.top - canvas.top + cell.height),
  };
  const target = {
    x: round(item.left - canvas.left + item.width / 2),
    y: round(item.top - canvas.top),
  };
  const available = target.y - source.y;
  const separatedRail = source.y + 16 + safeIndex * 5;
  const proportionalRail = source.y + available * 0.42;
  const railY = round(Math.min(target.y - 10, Math.max(separatedRail, proportionalRail)));
  const path = `M ${source.x} ${source.y} V ${railY} H ${target.x} V ${target.y}`;

  return { path, source, target };
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}
