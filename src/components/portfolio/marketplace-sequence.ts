export const marketplaceImageStops = [0, .22, .44, .66] as const;
const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const interval = (p: number, start: number, end: number) => clamp((p - start) / (end - start));
const smooth = (n: number) => n * n * (3 - 2 * n);

/** One reversible native-scroll timeline, matching the approved progress study. */
export function getMarketplaceFrame(progress: number) {
  const p = clamp(progress);
  let from = 0, to = 0, reveal = 0;
  for (let index = 0; index < 3; index++) {
    const end = marketplaceImageStops[index + 1];
    const start = end - .08;
    if (p >= end) from = to = index + 1;
    else if (p > start) { from = index; to = index + 1; reveal = interval(p, start, end); break; }
  }
  return { from, to, reveal, selected: reveal >= .5 ? to : from,
    registration: interval(p, .58, .72), departure: 1 - smooth(interval(p, .76, .88)),
    arrival: smooth(interval(p, .84, .96)), handoff: smooth(interval(p, .76, .96)),
    nav: smooth(interval(p, .83, .94)), wordBlend: smooth(interval(p, .92, .96)) };
}
