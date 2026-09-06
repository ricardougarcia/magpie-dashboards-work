export const PANEL_REPLACEMENT_DEFAULTS = {
  outgoingSpeed: 0.25,
  opacityFloor: 0.15,
} as const;

export function panelReplacementGeometry({
  incomingTop,
  contentTop,
  viewportHeight,
  outgoingSpeed = PANEL_REPLACEMENT_DEFAULTS.outgoingSpeed,
  opacityFloor = PANEL_REPLACEMENT_DEFAULTS.opacityFloor,
}: {
  incomingTop: number;
  contentTop: number;
  viewportHeight: number;
  outgoingSpeed?: number;
  opacityFloor?: number;
}) {
  const start = Math.max(0, incomingTop - viewportHeight);
  const distance = Math.max(1, incomingTop - contentTop);
  const rate = 1 - Math.min(0.95, Math.max(0, outgoingSpeed));
  const floor = Math.min(1, Math.max(0.01, opacityFloor));
  return { start, distance, rate, floor, end: start + distance / rate, fadeEnd: start + distance / rate * (1 - floor) };
}

export function panelReplacementState({ scrollY, reducedMotion = false, ...options }: Parameters<typeof panelReplacementGeometry>[0] & {
  scrollY: number;
  reducedMotion?: boolean;
}) {
  const { start, distance, rate, floor } = panelReplacementGeometry(options);
  const elapsed = Math.max(0, scrollY - start);
  const shift = reducedMotion ? 0 : Math.min(distance, elapsed * rate);
  const progress = shift / distance;

  return {
    shift,
    progress,
    opacity: reducedMotion ? 1 : Math.max(floor, 1 - progress),
    replaced: !reducedMotion && progress >= 1,
    pinShift: reducedMotion ? 0 : Math.min(elapsed, distance / rate),
  };
}
