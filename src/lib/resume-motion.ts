/** The geometry is extracted from the supplied PDF, including its embedded fonts. */
export type ResumeBounds = [number, number, number, number];
export type ResumeDocument = {
  source: string;
  sourceSha256: string;
  extraction: string;
  pages: Array<{
    page: number;
    width: number;
    height: number;
    definitions: Record<string, { d: string; bounds: ResumeBounds }>;
    glyphs: Array<{
      id: string;
      key: string;
      x: number;
      y: number;
      fill: string;
      text: string;
      font: string;
      size: number;
      line: string;
      bounds: ResumeBounds;
    }>;
    graphics: Array<{ id: string; attrs: Record<string, string>; bounds: ResumeBounds }>;
    lines: Array<{ id: string; text: string; y: number; glyphStart: number; glyphCount: number }>;
    text: string;
    removed: Record<string, number>;
  }>;
};

export type ResumeTreatment = "construction-1" | "construction-2" | "lines-1" | "lines-2";
export const RESUME_DURATION = 8400;
type ResumePage = ResumeDocument["pages"][number];
type Matrix = [number, number, number, number, number, number];
export type ResumeScheduleEntry = {
  id: string;
  kind: "glyph" | "graphic";
  start: number;
  end: number;
};

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const easeOut = (value: number) => 1 - (1 - clamp(value)) ** 3;

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  }
  return (result >>> 0) / 4294967295;
}

/** PDF graphics use a flipped coordinate system; glyph positions are already visual. */
export function resumeGraphicMatrix(transform?: string): Matrix {
  if (!transform) return [...IDENTITY];
  const match = /^matrix\(\s*([^)]*)\s*\)$/.exec(transform);
  if (!match) throw new Error(`Unsupported resume graphic transform: ${transform}`);
  const values = match[1].trim().split(/[\s,]+/).map(Number);
  if (values.length !== 6 || !values.every(Number.isFinite)) {
    throw new Error(`Invalid resume graphic transform: ${transform}`);
  }
  return values as Matrix;
}

export function resumeGraphicBounds(graphic: ResumePage["graphics"][number]): ResumeBounds {
  const [a, b, c, d, e, f] = resumeGraphicMatrix(graphic.attrs.transform);
  const [left, top, right, bottom] = graphic.bounds;
  const points = [[left, top], [right, top], [left, bottom], [right, bottom]];
  const xs = points.map(([x, y]) => a * x + c * y + e);
  const ys = points.map(([x, y]) => b * x + d * y + f);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** Pure scheduling makes visual order, the blank opening, and completion testable. */
export function createResumeSchedule(page: ResumePage, treatment: ResumeTreatment): ResumeScheduleEntry[] {
  const sectionOrigins = [...new Set([
    18,
    ...page.lines
      .filter((line) => /^\[\d+\]$/.test(line.text) || /^(SKILLS|EDUCATION|CORE EXPERTISE)$/.test(line.text))
      .map((line) => Math.max(18, line.y - 12)),
    742,
  ])].sort((a, b) => a - b);

  function timing(id: string, kind: ResumeScheduleEntry["kind"], bounds: ResumeBounds) {
    const x = clamp((bounds[0] - 18) / 576);
    const y = clamp((bounds[1] - 18) / 756);
    let start: number;
    let duration: number;
    switch (treatment) {
      case "construction-1":
        start = 180 + y * 6250 + x * 660;
        duration = kind === "glyph" ? 820 : 620;
        break;
      case "construction-2":
        // A diagonal coordinate field assembles many small fixed-position cells.
        start = 180 + y * 4600 + x * 2200 + hash(id) * 130;
        duration = kind === "glyph" ? 1000 : 820;
        break;
      case "lines-1":
        start = 180 + y * 6100 + x * 700;
        duration = kind === "glyph" ? 1150 : 850;
        break;
      case "lines-2": {
        let section = 0;
        while (section + 1 < sectionOrigins.length && bounds[1] >= sectionOrigins[section + 1]) section += 1;
        const origin = sectionOrigins[section];
        const sectionHeight = (sectionOrigins[section + 1] ?? 792) - origin;
        // Short metadata bands still launch promptly rather than consuming a
        // whole section's time before the first visible center-out rule.
        const depth = clamp((bounds[1] - origin) / Math.max(180, sectionHeight));
        const distanceFromCenter = Math.abs((bounds[0] + bounds[2]) / 2 - 306) / 288;
        start = 180 + section / Math.max(1, sectionOrigins.length - 1) * 4300
          + depth * 1250 + distanceFromCenter * 1550;
        duration = kind === "glyph" ? 1250 : 950;
        break;
      }
    }
    // A short fully resolved interval prevents a jump when the exact SVG takes over.
    start = Math.min(start, RESUME_DURATION - 180 - duration);
    return { id, kind, start, end: start + duration };
  }

  return [
    ...page.glyphs
      .filter((glyph) => Boolean(page.definitions[glyph.key]?.d.trim()))
      .map((glyph) => timing(glyph.id, "glyph", glyph.bounds)),
    ...page.graphics.map((graphic) => timing(graphic.id, "graphic", resumeGraphicBounds(graphic))),
  ];
}

type Contour = { path: Path2D; length: number };
type Shape = { path: Path2D; contours: Contour[]; bounds: ResumeBounds };
type Paint = {
  fill: string;
  fillOpacity: number;
  fillRule: CanvasFillRule;
  stroke: string;
  strokeOpacity: number;
  width: number;
  cap: CanvasLineCap;
  join: CanvasLineJoin;
  miterLimit: number;
  dash: number[];
  dashOffset: number;
};
type Drawable = ResumeScheduleEntry & {
  shape: Shape;
  matrix: Matrix;
  paint: Paint;
  seed: number;
};
type Layer = {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  pending: Drawable[];
  cursor: number;
  active: Drawable[];
};

function compileShape(d: string, bounds: ResumeBounds, measure: SVGPathElement): Shape {
  const contours = d.split(/(?=[Mm])/).filter((part) => /[LlCcQqHhVvSsTtAaZz]/.test(part)).map((part) => {
    measure.setAttribute("d", part);
    return { path: new Path2D(part), length: measure.getTotalLength() };
  }).filter((contour) => contour.length > 0);
  return { path: new Path2D(d), contours, bounds };
}

function graphicPaint(attrs: Record<string, string>): Paint {
  return {
    fill: attrs.fill ?? "black",
    fillOpacity: Number(attrs["fill-opacity"] ?? 1),
    fillRule: attrs["fill-rule"] === "evenodd" ? "evenodd" : "nonzero",
    stroke: attrs.stroke ?? "none",
    strokeOpacity: Number(attrs["stroke-opacity"] ?? 1),
    width: Number(attrs["stroke-width"] ?? 1),
    cap: (attrs["stroke-linecap"] ?? "butt") as CanvasLineCap,
    join: (attrs["stroke-linejoin"] ?? "miter") as CanvasLineJoin,
    miterLimit: Number(attrs["stroke-miterlimit"] ?? 10),
    dash: attrs["stroke-dasharray"] && attrs["stroke-dasharray"] !== "none"
      ? attrs["stroke-dasharray"].split(/[\s,]+/).map(Number) : [],
    dashOffset: Number(attrs["stroke-dashoffset"] ?? 0),
  };
}

function applyStroke(context: CanvasRenderingContext2D, paint: Paint) {
  context.strokeStyle = paint.stroke;
  context.globalAlpha = paint.strokeOpacity;
  context.lineWidth = paint.width;
  context.lineCap = paint.cap;
  context.lineJoin = paint.join;
  context.miterLimit = paint.miterLimit;
  context.setLineDash(paint.dash);
  context.lineDashOffset = paint.dashOffset;
}

function drawExact(context: CanvasRenderingContext2D, item: Drawable) {
  context.save();
  context.transform(...item.matrix);
  if (item.paint.fill !== "none") {
    context.fillStyle = item.paint.fill;
    context.globalAlpha = item.paint.fillOpacity;
    context.fill(item.shape.path, item.paint.fillRule);
  }
  if (item.paint.stroke !== "none") {
    applyStroke(context, item.paint);
    context.stroke(item.shape.path);
  }
  context.restore();
}

function drawContours(context: CanvasRenderingContext2D, shape: Shape, progress: number, bilateral: boolean) {
  for (const contour of shape.contours) {
    const amount = clamp(progress) * contour.length;
    if (amount <= 0) continue;
    context.setLineDash([amount, contour.length * 2 + 1]);
    context.lineDashOffset = bilateral ? -(contour.length - amount) / 2 : 0;
    context.stroke(contour.path);
  }
  context.setLineDash([]);
  context.lineDashOffset = 0;
}

/** Overlapping strokes fill the shape completely; there is no solid-fill fade. */
function drawHatch(context: CanvasRenderingContext2D, shape: Shape, progress: number, vertical: boolean) {
  const [left, top, right, bottom] = shape.bounds;
  const spacing = 0.56;
  const count = Math.ceil((vertical ? right - left : bottom - top) / spacing) + 3;
  context.lineWidth = spacing * 1.8;
  context.lineCap = "butt";
  context.setLineDash([]);
  context.beginPath();
  for (let index = 0; index < count; index += 1) {
    const stagger = vertical
      ? Math.abs(index / Math.max(1, count - 1) - 0.5) * 0.23
      : (index % 5) * 0.035;
    const length = clamp((progress - 0.1 - stagger) / 0.69);
    if (length <= 0) continue;
    if (vertical) {
      const x = left - spacing + index * spacing;
      const midpoint = (top + bottom) / 2;
      const reach = ((bottom - top) / 2 + 1) * length;
      context.moveTo(x, midpoint - reach);
      context.lineTo(x, midpoint + reach);
    } else {
      const y = top - spacing + index * spacing;
      context.moveTo(left - 1, y);
      context.lineTo(left - 1 + (right - left + 2) * length, y);
    }
  }
  context.stroke();
}

function drawLineFill(context: CanvasRenderingContext2D, item: Drawable, progress: number, vertical: boolean) {
  context.save();
  context.clip(item.shape.path, item.paint.fillRule);
  context.globalAlpha = item.paint.fillOpacity;
  context.strokeStyle = item.paint.fill;
  context.lineWidth = 0.24;
  context.lineJoin = "round";
  if (progress < 0.94) drawContours(context, item.shape, progress / 0.72, vertical);
  drawHatch(context, item.shape, progress, vertical);
  context.restore();
}

function drawQuadrants(context: CanvasRenderingContext2D, item: Drawable, progress: number) {
  const [left, top, right, bottom] = item.shape.bounds;
  const width = (right - left) / 2;
  const height = (bottom - top) / 2;
  context.fillStyle = item.paint.fill;
  context.globalAlpha = item.paint.fillOpacity;
  for (let quadrant = 0; quadrant < 4; quadrant += 1) {
    const local = clamp((progress - quadrant * 0.085) / 0.66);
    if (local <= 0) continue;
    const column = quadrant % 2;
    const row = Math.floor(quadrant / 2);
    const arrival = easeOut(local);
    const dx = (column === 0 ? -1 : 1) * 2.4 * (1 - arrival);
    const dy = (row === 0 ? -1 : 1) * 2.4 * (1 - arrival);
    const inset = (1 - clamp(local * 4)) * Math.min(width, height) * 0.45;
    context.save();
    context.translate(dx, dy);
    context.beginPath();
    context.rect(left + column * width + inset, top + row * height + inset,
      Math.max(0, width - inset * 2), Math.max(0, height - inset * 2));
    context.clip();
    context.fill(item.shape.path, item.paint.fillRule);
    context.restore();
  }
}

function drawCells(context: CanvasRenderingContext2D, item: Drawable, progress: number) {
  const [left, top, right, bottom] = item.shape.bounds;
  const cell = bottom - top > 20 ? 3.1 : 1.55;
  const columns = Math.ceil((right - left) / cell);
  const rows = Math.ceil((bottom - top) / cell);
  context.save();
  context.clip(item.shape.path, item.paint.fillRule);
  context.fillStyle = item.paint.fill;
  context.globalAlpha = item.paint.fillOpacity;
  context.beginPath();
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const stagger = ((column * 7 + row * 11 + Math.floor(item.seed * 17)) % 19) / 19 * 0.48;
      const local = easeOut((progress - stagger) / 0.49);
      if (local <= 0) continue;
      const size = cell * local;
      const inset = (cell - size) / 2;
      context.rect(left + column * cell + inset, top + row * cell + inset, size, size);
    }
  }
  context.fill();
  context.restore();
}

function drawPartial(context: CanvasRenderingContext2D, item: Drawable, progress: number, treatment: ResumeTreatment) {
  if (progress <= 0) return;
  context.save();
  context.transform(...item.matrix);
  const lines = treatment.startsWith("lines");
  const bilateral = treatment === "lines-2";
  if (item.paint.fill !== "none") {
    if (lines) drawLineFill(context, item, progress, bilateral);
    else if (treatment === "construction-1") drawQuadrants(context, item, progress);
    else drawCells(context, item, progress);
  }
  if (item.paint.stroke !== "none") {
    applyStroke(context, item.paint);
    if (item.paint.dash.length > 0) {
      // Preserve authored dash spacing while the line's visible extent grows.
      const [left, top, right, bottom] = item.shape.bounds;
      const padding = item.paint.width * 2;
      const width = right - left + padding * 2;
      const height = bottom - top + padding * 2;
      context.beginPath();
      context.rect(left - padding + (bilateral ? width * (1 - progress) / 2 : 0),
        top - padding, width * progress, height);
      context.clip();
      context.stroke(item.shape.path);
    } else {
      drawContours(context, item.shape, clamp(progress / 0.94), bilateral);
    }
  }
  context.restore();
}

/**
 * Owns no clock or animation loop. Settled geometry is painted once into two
 * persistent layers. Per-frame vector work is limited to the moving interval.
 */
export function createResumeRenderer(canvas: HTMLCanvasElement, page: ResumePage, treatment: ResumeTreatment): {
  draw: (elapsed: number) => void;
  destroy: () => void;
} {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("A 2D canvas context is required to build the resume.");
  const measure = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const definitions = new Map<string, Shape>();
  for (const [key, definition] of Object.entries(page.definitions)) {
    if (definition.d.trim()) definitions.set(key, compileShape(definition.d, definition.bounds, measure));
  }
  const schedule = new Map(createResumeSchedule(page, treatment).map((entry) => [entry.id, entry]));
  const glyphs: Drawable[] = page.glyphs.flatMap((glyph) => {
    const shape = definitions.get(glyph.key);
    const timing = schedule.get(glyph.id);
    if (!shape || !timing) return [];
    return [{ ...timing, shape, matrix: [1, 0, 0, 1, glyph.x, glyph.y] as Matrix,
      paint: graphicPaint({ fill: glyph.fill, stroke: "none" }), seed: hash(glyph.id) }];
  });
  const graphics: Drawable[] = page.graphics.map((graphic) => ({
    ...schedule.get(graphic.id)!,
    shape: compileShape(graphic.attrs.d, graphic.bounds, measure),
    matrix: resumeGraphicMatrix(graphic.attrs.transform),
    paint: graphicPaint(graphic.attrs),
    seed: hash(graphic.id),
  }));
  function createLayer(items: Drawable[]): Layer {
    const buffer = document.createElement("canvas");
    const bufferContext = buffer.getContext("2d");
    if (!bufferContext) throw new Error("A 2D canvas context is required for the resume layers.");
    return { canvas: buffer, context: bufferContext, pending: items.sort((a, b) => a.start - b.start), cursor: 0, active: [] };
  }
  // Keep filled badge boxes below the text even when their timings overlap.
  const layers = [createLayer(graphics), createLayer(glyphs)];
  let lastTime = -1;
  let width = 0;
  let height = 0;
  let destroyed = false;

  function reset() {
    width = canvas.width;
    height = canvas.height;
    for (const layer of layers) {
      layer.canvas.width = width;
      layer.canvas.height = height;
      layer.context.setTransform(width / page.width, 0, 0, height / page.height, 0, 0);
      layer.cursor = 0;
      layer.active = [];
    }
  }

  return {
    draw(elapsed) {
      if (destroyed) return;
      const time = Math.max(0, Number.isFinite(elapsed) ? elapsed : 0);
      if (time < lastTime || width !== canvas.width || height !== canvas.height) reset();
      lastTime = time;
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (const layer of layers) {
        while (layer.cursor < layer.pending.length && layer.pending[layer.cursor].start < time) {
          layer.active.push(layer.pending[layer.cursor++]);
        }
        const remaining: Drawable[] = [];
        for (const item of layer.active) {
          if (time >= item.end) drawExact(layer.context, item);
          else remaining.push(item);
        }
        layer.active = remaining;
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.drawImage(layer.canvas, 0, 0);
        context.setTransform(width / page.width, 0, 0, height / page.height, 0, 0);
        for (const item of layer.active) {
          drawPartial(context, item, (time - item.start) / (item.end - item.start), treatment);
        }
      }
    },
    destroy() {
      destroyed = true;
      for (const layer of layers) {
        layer.canvas.width = 0;
        layer.canvas.height = 0;
        layer.active = [];
        layer.pending = [];
      }
      definitions.clear();
    },
  };
}
