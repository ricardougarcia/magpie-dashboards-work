/** Source-backed content for the approved Integrated milestones treatment.
 * Provenance and metric definitions: /portfolio/portal/sources.md.
 */
export type PortalAsset = {
  src: string;
  title: string;
  description: string;
  url: string;
};

export const portalAssets = {
  "product": {
    "src": "/portfolio/portal/product.jpg",
    "title": "Provider product record",
    "description": "Original Partner Portal product-management interface. Product records are illustrative.",
    "url": "/portfolio/portal/product-original.png"
  },
  "integration": {
    "src": "/portfolio/portal/integration.png",
    "title": "Integrations and implementation guidance",
    "description": "Original Partner Portal integration tools and implementation resources.",
    "url": "/portfolio/portal/integration.png"
  },
  "evidence": {
    "src": "/portfolio/portal/evidence.png",
    "title": "Evidence publishing and services",
    "description": "Original Evidence tab with ESSA-aligned evidence and contact with the evidence team. Illustrative records.",
    "url": "/portfolio/portal/evidence.png"
  },
  "impact": {
    "src": "/portfolio/portal/impact.jpg",
    "title": "Original impact graph",
    "description": "Source-reported MAA and MAU values, July launch through December. The source does not supply a year or a consistent account definition.",
    "url": "/portfolio/portal/impact-original.png"
  },
  "journey": {
    "src": "/portfolio/portal/journey.png",
    "title": "Journey map: Manage vetting resources",
    "description": "Original discovery artifact connecting resource needs, requests, additions, and access approval. Its exact date within development is not documented.",
    "url": "/portfolio/portal/journey.png"
  },
  "workflow": {
    "src": "/portfolio/portal/workflow.png",
    "title": "Provider UX mapping",
    "description": "Original workflow overview across provider setup, product management, evidence, and LTI publishing. Open the full original for fine detail.",
    "url": "/portfolio/portal/workflow.png"
  },
  "ecosystem": {
    "src": "/portfolio/portal/ecosystem.jpg",
    "title": "Original ecosystem connections",
    "description": "Partner Portal connects to EdCo Marketplace, Canvas, Impact, and LearnPlatform. The source does not specify directional data flow.",
    "url": "https://static.wixstatic.com/media/7eca65_ec4711abcde54ced9ff85b47508dff69~mv2.jpg"
  },
  "poster": {
    "src": "/portfolio/portal/poster.jpg",
    "title": "Original video cover",
    "description": "Original product collage used as the Partner Portal video cover.",
    "url": "https://static.wixstatic.com/media/7eca65_736cc50d5e2d45478742070e0a225f4c~mv2.jpg"
  }
} as const satisfies Record<string, PortalAsset>;

export type PortalAssetKey = keyof typeof portalAssets;

export type PortalStop = {
  stop: string;
  phase: string;
  head: string;
  copy: string;
  title: string;
  contribution: string;
  features: readonly string[];
  asset: PortalAssetKey;
  caption: string;
  detail: readonly string[];
};

export const portalStops: readonly PortalStop[] = [
  {
    "stop": "Ecosystem",
    "phase": "Product leadership / 9 months",
    "head": "One portal. A connected ecosystem.",
    "copy": "A provider home connecting product publishing, integrations, trust information, and partner services.",
    "title": "Lead the work from discovery to launch.",
    "contribution": "I led the Partner Portal lifecycle from research and development through go-to-market.",
    "features": [
      "Cross-product coordination",
      "Four delivery phases",
      "Marketplace launch + portal retirement"
    ],
    "asset": "ecosystem",
    "caption": "Original ecosystem connections",
    "detail": [
      "Product Manager working with five engineers and one designer over nine months.",
      "Phased planning and coordination across product teams.",
      "Simultaneous launch with the new Marketplace and retirement of legacy portals."
    ]
  },
  {
    "stop": "Discovery",
    "phase": "Discovery / continued through development",
    "head": "Start with the provider’s work.",
    "copy": "Duplicate listings, inconsistent information, and limited visibility made the need for a shared workflow clear.",
    "title": "Understand the work before unifying it.",
    "contribution": "I developed partner personas to prioritize requirements around provider needs.",
    "features": [
      "Provider + internal interviews",
      "Journey and workflow mapping",
      "Prioritization workshops"
    ],
    "asset": "workflow",
    "caption": "Provider UX mapping",
    "detail": [
      "The project combined interviews and workflow mapping with providers and internal stakeholders.",
      "Personas spanned integration-focused vendors and evidence-driven providers.",
      "Workshops prioritized profile completion, evidence publishing, and integration management.",
      "Market analysis and user research continued during development."
    ]
  },
  {
    "stop": "Assets",
    "phase": "Phase 1 / Unify assets",
    "head": "One place to maintain the tool.",
    "copy": "Central asset management and synchronization brought fragmented publishing into a shared provider workflow.",
    "title": "Define a shared asset workflow.",
    "contribution": "I led the creation of a central portal for partner assets and cross-product synchronization.",
    "features": [
      "Central asset management",
      "Cross-product synchronization",
      "A maintained product record"
    ],
    "asset": "product",
    "caption": "Provider product record",
    "detail": [
      "The first phase established central asset management and synchronization across products.",
      "The product record brought provider information and assets into one managed surface.",
      "The original prose references five interconnected products; its diagram names four destinations, reproduced here without adding a fifth."
    ]
  },
  {
    "stop": "Integrate",
    "phase": "Phase 2 / Partner capabilities",
    "head": "Make integrations usable.",
    "copy": "Give providers integration tools, direct requests, and a way to share assets with end users.",
    "title": "Turn provider needs into capabilities.",
    "contribution": "Provider research and market analysis continued alongside the phased development work.",
    "features": [
      "Integration tools",
      "Direct partner requests",
      "Sharing assets with end users"
    ],
    "asset": "workflow",
    "caption": "Provider UX mapping",
    "detail": [
      "The second phase included integration tools, direct requests, and asset sharing.",
      "The same phase also introduced evidence containers and monetization options.",
      "The workflow map provides context for the product scope; it is not a dated phase milestone."
    ]
  },
  {
    "stop": "Evidence",
    "phase": "Phase 2 / Evidence capabilities",
    "head": "Make the evidence accessible.",
    "copy": "Providers publish efficacy evidence alongside the privacy and accessibility information institutions need.",
    "title": "Make evidence part of the working record.",
    "contribution": "The scope connected provider needs with the information institutions use to evaluate tools.",
    "features": [
      "Evidence containers",
      "Vetting-resource requests",
      "Controlled asset sharing"
    ],
    "asset": "journey",
    "caption": "Discovery behind evidence sharing",
    "detail": [
      "Evidence containers are explicitly listed among the capabilities developed in phase 2.",
      "The original journey map follows identifying missing vetting resources, requesting them, adding them, and approving access.",
      "The new portal supports publishing efficacy evidence; the Evidence screen includes ESSA-aligned evidence and a connection to the evidence team."
    ]
  },
  {
    "stop": "Services",
    "phase": "Phase 2 / Partner business",
    "head": "Support a deeper partnership.",
    "copy": "Partners purchase services such as ESSA evaluations, creating revenue for Instructure’s partner program.",
    "title": "Include the commercial role in the product.",
    "contribution": "The portal served provider workflows and the partner program’s business goals.",
    "features": [
      "Monetization options",
      "Evidence publishing",
      "Paid ESSA evaluation services"
    ],
    "asset": "evidence",
    "caption": "Evidence publishing and services",
    "detail": [
      "The published phase description identifies monetization options as part of phase 2.",
      "The project owner identifies paid partner services, including ESSA evaluations, as the commercial model.",
      "The case provides no quantified revenue amount, conversion rate, or attributed revenue growth."
    ]
  },
  {
    "stop": "Launch",
    "phase": "Phases 3 + 4 / Transition and adoption",
    "head": "Bring partners across. Support what follows.",
    "copy": "Coordinate migration and launch, then help partners use the portal through guidance, support, and instrumentation.",
    "title": "Lead the transition into daily use.",
    "contribution": "Phased planning connected the Marketplace launch with legacy portal retirement.",
    "features": [
      "New login routes + migration",
      "Program rebrand + communications",
      "Tagging, guidance + support"
    ],
    "asset": "workflow",
    "caption": "The provider workflow in context",
    "detail": [
      "Phase 3 introduced a new login experience routing users from sunset products, user migration, the partnership-program rebrand, and email/notification updates.",
      "Phase 4 introduced third-party UI tagging and reporting for adoption, friction, attrition, and preferred paths.",
      "In-app guidance and a support documentation overhaul supported adoption.",
      "These were delivered capabilities; the source does not quantify reductions in friction or attrition."
    ]
  },
  {
    "stop": "Impact + demo",
    "phase": "Impact / Product walkthrough",
    "head": "The outcome. The product.",
    "copy": "Inspect the published adoption trajectory, then watch the full Partner Portal walkthrough.",
    "title": "Connect delivery to the outcome.",
    "contribution": "A provider publishing platform and an operating foundation for the partner program.",
    "features": [
      "75% MAA · source-reported",
      "65.18% MAU · source-reported",
      "Eight new features among most-used"
    ],
    "asset": "impact",
    "caption": "Original published impact graph",
    "detail": [
      "The original graph reports monthly values from July launch through December, without a year.",
      "The graph labels the account series MAA; surrounding prose also calls it total accounts. Its definition and calculation need confirmation.",
      "The source reports eight new features among the application’s most-used."
    ]
  }
];

/** Source-reported values; retain MAA as labeled in the original graph. */
export const portalGrowth = {
  "months": [
    "July launch",
    "August",
    "September",
    "October",
    "November",
    "December"
  ],
  "maa": [
    0,
    24.68,
    41.23,
    47.73,
    65.91,
    75
  ],
  "mau": [
    0,
    22.95,
    37.96,
    44.25,
    58.72,
    65.18
  ]
} as const;

export const portalDemoUrl = "https://video.wixstatic.com/video/7eca65_9a26ca035c704c1789bf2e402cff4443/720p/mp4/file.mp4";
