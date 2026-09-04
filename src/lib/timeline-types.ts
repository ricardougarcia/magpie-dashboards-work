export const GUIDING_LIGHTS = ["Learn", "Fix", "Stabilize", "Govern", "Grow"] as const;
export const COLOR_TOKENS = ["graphite", "signal", "steel", "umber", "forest"] as const;

export type GuidingLight = (typeof GUIDING_LIGHTS)[number];
export type ColorToken = (typeof COLOR_TOKENS)[number];

export const LANE_COLOR_TOKENS: Record<string, ColorToken> = {
  "Eng Build": "steel",
  "Product Build": "forest",
  "Product Discovery": "graphite",
  Processes: "umber",
  "Challenges Planned / Unplanned": "signal",
  "In-Flight / Future": "signal",
};

export function colorTokenForLane(lane: string): ColorToken {
  return LANE_COLOR_TOKENS[lane] ?? "graphite";
}

export type ConnectorTerminalSide = "top" | "right" | "bottom" | "left";

export type ConnectorTerminal = {
  side: ConnectorTerminalSide;
  offset: number;
};

export type ConnectorPoint = {
  x: number;
  y: number;
};

export type OrthogonalConnectorRoute = {
  source: ConnectorTerminal;
  target: ConnectorTerminal;
  points: ConnectorPoint[];
};

export type TimelineRelation = {
  targetId: string;
  targetName: string;
  description: string;
  connector?: OrthogonalConnectorRoute;
};

export type TimelineMedia = {
  url: string;
  type: "image" | "video" | "gif";
  alt: string;
};

export type TimelineItem = {
  id: string;
  name: string;
  lane: string;
  description: string;
  placement: string;
  value: string;
  relations: TimelineRelation[];
  guidingLights: GuidingLight[];
  start: number;
  end: number;
  planned: boolean;
  ongoing: boolean;
  colorToken: ColorToken;
  media: TimelineMedia | null;
};

export type TimelineLane = {
  id: string;
  name: string;
  displayName: string;
  index: number;
};

export type PublicTimelineItem = TimelineItem;

export type TimelineData = {
  version: number;
  updatedAt: string;
  meta: {
    title: string;
    subtitle: string;
    owner: string;
    period: string;
  };
  lanes: TimelineLane[];
  items: TimelineItem[];
};

export type PublicTimelineData = Omit<TimelineData, "items"> & {
  items: PublicTimelineItem[];
};

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

function formatMonthPoint(value: number) {
  const month = MONTHS[Math.floor(value)];
  return Number.isInteger(value) ? month : `Mid ${month}`;
}

export function formatPlacement(start: number, end: number, planned = false, ongoing = false) {
  const label = `${formatMonthPoint(start)} - ${formatMonthPoint(end)}`;
  if (planned) return `${label} (planned)`;
  if (ongoing) return `${label} (ongoing)`;
  return label;
}

export function placementSpan(start: number, end: number) {
  const endBoundary = Number.isInteger(end) ? end + 1 : end;
  return Math.max(0.5, endBoundary - start);
}

export function monthPointOptions(startMonth = 0, endMonth = 11) {
  const options: Array<{ value: number; label: string }> = [];
  for (let month = startMonth; month <= endMonth; month += 1) {
    options.push({ value: month, label: MONTHS[month] });
    options.push({ value: month + 0.5, label: `Mid ${MONTHS[month]}` });
  }
  return options.filter((option) => option.value <= endMonth + 0.5);
}

export function createItemId(lane: string, name: string) {
  const slug = `${lane}-${name}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
  return `${slug}-${Date.now().toString(36)}`;
}
