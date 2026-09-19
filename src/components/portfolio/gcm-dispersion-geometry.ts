export const dispersionCount = 2000;
export const dispersionDuration = 2800;
export const clamp = (value: number) => Math.max(0, Math.min(1, value));
export const smooth = (value: number) => { const x = clamp(value); return x * x * (3 - 2 * x); };

function createPoints() {
  let seed = 94017;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  return Array.from({ length: dispersionCount }, () => ({
    x: random(), y: random(), a: random() * Math.PI * 2, b: random() * Math.PI * 2,
    c: random(), d: random(), size: .65 + random() * .65,
  }));
}

// Seeded illustrative marks keep the initial field stable across hydration and replay.
export const dispersionPoints = createPoints();
export function dispersionPosition(point: typeof dispersionPoints[number], phase: number) {
  const q = clamp((clamp(phase / .84) - .1 * point.c) / (1 - .1 * point.c));
  const pull = 1 - Math.pow(1 - smooth(q), 1.15);
  const noise = Math.sin(Math.PI * q) * Math.pow(1 - q, .35);
  const nx = (Math.sin(q * 12 + point.a) - Math.sin(point.a)) * .65 + (Math.sin(q * 23 + point.b) - Math.sin(point.b)) * .35;
  const ny = (Math.cos(q * 14 + point.b) - Math.cos(point.b)) * .65 + (Math.sin(q * 19 + point.a) - Math.sin(point.a)) * .35;
  return {
    x: clamp(point.x + (.5 - point.x) * pull + nx * noise * (.055 + point.d * .055)),
    y: clamp(point.y + (.58 - point.y) * pull + ny * noise * (.085 + point.c * .075)),
    radius: point.size * (1 - .6 * smooth((q - .65) / .35)),
  };
}

export const dispersionFallback = dispersionPoints.map(point => `M${(26 + point.x * 548).toFixed(1)} ${(26 + point.y * 235).toFixed(1)}h.01`).join('');
