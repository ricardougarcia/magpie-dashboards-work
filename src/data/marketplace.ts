import type { Artifact } from "@/lib/portfolio-types";

// Authored from the recovered owner portfolio. See docs/edco-marketplace.md
// for the source record, image provenance, and editorial boundaries.
export const marketplaceRecord = {
  number: "02",
  role: "Product Manager",
  organization: "Instructure",
  duration: "7-month sample",
};

export const marketplaceSections = [
  { id: "people", title: "Two perspectives" },
  { id: "investigation", title: "Investigation" },
  { id: "repositories", title: "Three repositories" },
  { id: "orchestration", title: "Orchestration" },
  { id: "shared-product", title: "Shared product" },
  { id: "impact", title: "Impact" },
  { id: "reflection", title: "Reflection" },
];

export const marketplaceArtifacts = {
  ai: {
    id: "marketplace-source-ai", src: "/portfolio/marketplace/ai-marketplace.png", width: 1972, height: 1406,
    label: "Emerging AI Marketplace", surface: "paper",
    alt: "The separate Emerging AI Marketplace catalog for AI products and services.",
    caption: "A separate destination for AI products and services.",
  },
  appCenter: {
    id: "marketplace-source-app-center", src: "/portfolio/marketplace/edu-app-center.png", width: 1972, height: 1406,
    label: "Edu App Center", surface: "paper",
    alt: "The legacy Edu App Center catalog of apps with LTI integrations.",
    caption: "The legacy app catalog included in the transition and sunsetting work.",
  },
  library: {
    id: "marketplace-source-library", src: "/portfolio/marketplace/learncommunity-library.png", width: 1972, height: 1406,
    label: "LearnCommunity Library", surface: "paper",
    alt: "LearnCommunity Library with product discovery and evidence, certification, subject, and integration filters.",
    caption: "Product discovery organized around evidence, certification, and fit.",
  },
  discovery: {
    id: "marketplace-discovery-flow", src: "/portfolio/marketplace/discovery-flow.png", width: 2718, height: 1368,
    label: "From discovery to connection", surface: "paper",
    alt: "An early Marketplace flow connecting browsing and evaluating products to expressing interest and contacting a provider.",
    caption: "An early flow connects discovery and evaluation with a concrete next step: contacting the provider.",
  },
  provider: {
    id: "marketplace-provider-persona", src: "/portfolio/marketplace/provider-persona.png", width: 2774, height: 1368,
    label: "Provider research synthesis", surface: "paper",
    alt: "A provider persona synthesizing needs for visibility, control over product presentation, and access to institutional decision-makers.",
    caption: "A research persona captures the provider’s need for visibility, ownership, and connection. It represents a synthesis, not an individual participant.",
  },
  publicPlan: {
    id: "marketplace-public-plan", src: "/portfolio/marketplace/public-discovery-plan.png", width: 2514, height: 964,
    label: "Public discovery / annotated plan", surface: "paper",
    alt: "An annotated planning diagram for the public discovery page, with requirements for browsing, evidence, product updates, and provider connections.",
    caption: "The planning artifact connects research themes to page structure, priorities, and open questions. Exploratory features remain part of the planning record.",
  },
  canvasPlan: {
    id: "marketplace-canvas-plan", src: "/portfolio/marketplace/canvas-discovery-plan.png", width: 2588, height: 1394,
    label: "In-platform discovery / concept", surface: "paper",
    alt: "An annotated Canvas discovery concept exploring how Marketplace information could appear within the platform.",
    caption: "An in-platform concept explores another surface for the shared product information. This is a planning artifact, not a claim that every pictured feature shipped.",
  },
  catalog: {
    id: "marketplace-catalog", src: "/portfolio/marketplace/catalog.png", width: 2842, height: 1428,
    label: "The shared Marketplace", surface: "paper",
    alt: "A presentation of the EdTech Collective Marketplace showing Partner Products browsing, trust badges, and product details on desktop and mobile.",
    caption: "The shared experience: browsing, trust signals, and product information across desktop and mobile. Original product presentation from the case record.",
  },
} satisfies Record<string, Artifact>;

export const marketplaceWorkstreams = [
  {
    id: "catalog-foundation", number: "A", title: "Bring the catalog together.", label: "Data + publishing",
    body: "We audited the existing repositories and brought product information into a shared catalog. A foundational API supplied LearnPlatform data for filters, badges, images, and tags.",
    detail: "Publishing rules and provider-partner recognition connected the underlying records to what appeared in the Marketplace. The aim was a consistent, current listing experience across the new surfaces.",
  },
  {
    id: "coordinate-delivery", number: "B", title: "Coordinate the moving parts.", label: "Discovery + delivery",
    body: "I connected research and concept testing to requirements, then coordinated delivery across the catalog, provider workflows, and the public Marketplace.",
    detail: "Provider listing management, marketing assets, and lead capture had to work with the new catalog. Public discovery and the planned premium experience also needed a shared product foundation.",
  },
  {
    id: "transition-data", number: "C", title: "Carry the data through.", label: "Transition + continuity",
    body: "Legacy-source data was rerouted into the shared backend during the sunset period. The new experience and the transition away from existing ones were connected work.",
    detail: "This joined catalog consolidation with the provider experience and the Marketplace launch. The product work included how people reached and maintained listings as the ecosystem changed.",
  },
  {
    id: "sunset-legacy", number: "D", title: "Retire the legacy paths.", label: "Sunsetting + operations",
    body: "The public Marketplace launched alongside the sunsetting of Edu App Center. Reducing fragmented discovery also meant reducing the operational burden of separate environments.",
    detail: "Consolidating three sources and retiring a legacy product are distinct parts of the story. The documented launch identifies Edu App Center in the sunsetting work; it does not establish that all three repositories were retired.",
  },
];
