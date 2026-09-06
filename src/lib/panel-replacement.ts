export const PANEL_REPLACEMENT_DEFAULTS = {
  outgoingSpeed: 0.25,
  opacityFloor: 0.15,
} as const;

export function panelReplacementState({
  scrollY,
  incomingTop,
  contentTop,
  viewportHeight,
  outgoingSpeed = PANEL_REPLACEMENT_DEFAULTS.outgoingSpeed,
  opacityFloor = PANEL_REPLACEMENT_DEFAULTS.opacityFloor,
  reducedMotion = false,
}: {
  scrollY: number;
  incomingTop: number;
  contentTop: number;
  viewportHeight: number;
  outgoingSpeed?: number;
  opacityFloor?: number;
  reducedMotion?: boolean;
}) {
  const start = Math.max(0, incomingTop - viewportHeight);
  const distance = Math.max(1, incomingTop - contentTop);
  const rate = 1 - Math.min(0.95, Math.max(0, outgoingSpeed));
  const elapsed = Math.max(0, scrollY - start);
  const shift = reducedMotion ? 0 : Math.min(distance, elapsed * rate);
  const progress = shift / distance;

  return {
    shift,
    progress,
    opacity: reducedMotion ? 1 : Math.max(Math.min(1, Math.max(0.01, opacityFloor)), 1 - progress),
    replaced: !reducedMotion && progress >= 1,
    pinShift: reducedMotion ? 0 : Math.min(elapsed, distance / rate),
  };
}
