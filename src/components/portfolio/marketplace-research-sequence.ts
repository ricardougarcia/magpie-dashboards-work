export const researchStops = { educator: [0, .16, .32], provider: [.57, .70, .83] } as const;
const clamp = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };

/** The approved study's reversible progression; time is supplied by native scroll. */
export function getResearchFrame(progress: number, compact = false) {
  const p = clamp(progress);
  const topic = p < .11 ? 0 : p < .27 ? 1 : p < .45 ? 2 : p < .64 ? 0 : p < .78 ? 1 : 2;
  const lens = smooth((p - .44) / .12);
  const shared = smooth((p - .91) / .09);
  const material = smooth(Math.min(...[.11, .27, .45, .64, .78].map(boundary => Math.abs(p - boundary))) / .014);
  return { topic, lens, shared,
    educator: Math.max(compact ? 1 - smooth((p - .44) / .05) : 1 - lens, shared) * material,
    provider: Math.max(compact ? smooth((p - .51) / .05) : lens, shared) * material,
    perspective: shared > .75 ? "both" : lens < .5 ? "educator" : "provider" };
}

export const researchNeeds = [
  { label: "A / Discovery & visibility",
    educator: { label: "EDUCATOR / DISCOVERY", title: "Is this right for my needs?", body: "A clear audience and purpose help educators recognize a relevant tool." },
    provider: { label: "PROVIDER / VISIBILITY", title: "Will the right educators find us?", body: "Relevant product information gives educators a way to discover the offering." } },
  { label: "B / Evaluation & ownership",
    educator: { label: "EDUCATOR / EVALUATION", title: "What helps me evaluate it?", body: "Product information and trust signals support a more informed next step." },
    provider: { label: "PROVIDER / OWNERSHIP", title: "Can we represent our product clearly?", body: "Providers need control over their listing and how their product is presented." } },
  { label: "C / Contact & inquiries",
    educator: { label: "EDUCATOR / CONNECTION", title: "How do I learn more?", body: "Discovery needs a path to ask questions and contact the provider." },
    provider: { label: "PROVIDER / INQUIRIES", title: "Can interest become a conversation?", body: "A path for inbound inquiries connects discovery with provider participation." } },
] as const;
