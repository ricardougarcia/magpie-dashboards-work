import type { Artifact } from "@/lib/portfolio-types";

// Original source pixels are unchanged. Provenance and evidence limits live in
// docs/lti-editorial-relay.md and docs/lti-source-depth.md.
export const ltiRecord = {
  mark: "L/T",
  number: "04",
  role: "Product Manager",
  organization: "LearnPlatform",
};

export type LtiAsset = Artifact & { code: string };

export type LtiInspectionView = {
  id: string;
  label: string;
  artifact: LtiAsset;
  note: string;
  // Source pixels, measured from the original image's top-left corner.
  // The viewer crops the presentation; it never rewrites the source file.
  region?: { x: number; y: number; width: number; height: number };
};

export const ltiAssets = {
  planning: {
    id: "lti-planning-process",
    code: "W002",
    src: "/portfolio/lti/planning-process.png",
    width: 6000,
    height: 1638,
    label: "Process and timeline",
    surface: "paper",
    alt: "Original LTI process and timeline planning sheet showing connected workstreams and the decision to wait for LTI 1.3 and include it in the provider launch.",
    caption: "Documented planning decision, recorded in the original process map. The artifact shows the decision and its dependencies. It does not establish the final shipped date.",
  },
  discover: {
    id: "lti-product-detail",
    code: "A078",
    src: "/portfolio/lti/product-detail.png",
    width: 1034,
    height: 1178,
    label: "Product detail",
    surface: "paper",
    alt: "Original Nearpod product-detail design showing LTI version labels and a Configure control.",
    caption: "LTI 1.1 and 1.3 labels sit beside a Configure control on the product detail.",
  },
  control: {
    id: "lti-provider-products",
    code: "A081",
    src: "/portfolio/lti/provider-products.png",
    width: 1724,
    height: 574,
    label: "Provider product table",
    surface: "paper",
    alt: "Original provider product-table design with Tool IDs, libraries, interoperability, and badges.",
    caption: "Tool IDs, libraries, interoperability, and badges share one product table. The source contains sample data.",
  },
  configure: {
    id: "lti-configuration-paths",
    code: "A080",
    src: "/portfolio/lti/configuration-paths.png",
    width: 2612,
    height: 1484,
    label: "Configuration paths",
    surface: "paper",
    alt: "Original LTI 1.3 configuration board with URL loading, error, and valid states plus manual and JSON setup paths through permissions, data sharing, placements, and review.",
    caption: "Three setup paths—URL, manual, and JSON—carry configuration through launch settings, permissions, data sharing, placements, and review. The board documents proposed interface states.",
  },
  schema: {
    id: "lti-planning-schema",
    code: "Planning",
    src: "/portfolio/lti/planning-schema.png",
    width: 4448,
    height: 2308,
    label: "Planning and schema",
    surface: "paper",
    alt: "Original planning board separating LearnCommunity Library, provider, and system administrator journeys, with a provider save-or-publish branch, version-specific field notes, and a draft timeline.",
    caption: "Library, provider, and administrator journeys share one planning board. Branches and working notes expose different editing paths, save and publish states, and questions about integration versions.",
  },
  details: {
    id: "lti-integration-details",
    code: "A079",
    src: "/portfolio/lti/integration-details.png",
    width: 2770,
    height: 502,
    label: "Integration details",
    surface: "paper",
    alt: "Original interface designs for an LTI integration's Placements, Services, and Description tabs, alongside a related-tools panel.",
    caption: "Placements, Services, and Description show the integration information behind a product listing. The source also contains a related-tools panel.",
  },
} satisfies Record<string, LtiAsset>;

const providerJourney: LtiInspectionView = {
  id: "provider-journey",
  label: "Provider journey",
  artifact: ltiAssets.schema,
  note: "The provider flow separates viewing from creating a product, then branches from data entry to Save or Publish. Working notes call out different fields and multiple integration versions; they record planning questions, not delivered behavior.",
  region: { x: 1530, y: 300, width: 1390, height: 1700 },
};

export const ltiInspections = {
  planning: [
    {
      id: "process-map",
      label: "Process map",
      artifact: ltiAssets.planning,
      note: ltiAssets.planning.caption,
    },
    {
      id: "planning-board",
      label: "Planning board",
      artifact: ltiAssets.schema,
      note: "The complete working board brings three actor journeys, open questions, and a draft timeline together. It records planning scope and dependencies, not a confirmed delivery schedule.",
    },
    {
      id: "library-journey",
      label: "Library journey",
      artifact: ltiAssets.schema,
      note: "The library journey connects searching or filtering the catalog, choosing a product, and opening its Integrations tab. An attached working note questions whether the filter logic needs additional options.",
      region: { x: 20, y: 370, width: 1380, height: 790 },
    },
    providerJourney,
    {
      id: "administrator-journey",
      label: "Administrator journey",
      artifact: ltiAssets.schema,
      note: "The administrator journey separates viewing and creating a product, then brings the available fields into one editing form and an Update action. The field annotations remain working design notes.",
      region: { x: 3060, y: 365, width: 1360, height: 1480 },
    },
  ],
  discover: [
    {
      id: "product-detail",
      label: "Product detail",
      artifact: ltiAssets.discover,
      note: ltiAssets.discover.caption,
    },
    {
      id: "integration-placements",
      label: "Placements",
      artifact: ltiAssets.details,
      note: "The Placements tab lists where an integration can appear, including account navigation and assignment surfaces. This is the supporting detail behind an integration label.",
      region: { x: 34, y: 58, width: 626, height: 402 },
    },
    {
      id: "integration-services",
      label: "Services",
      artifact: ltiAssets.details,
      note: "The Services tab lists named capabilities and versions, including Assignment and Grade Services, Names and Role Provisioning, and Deep Linking.",
      region: { x: 722, y: 58, width: 626, height: 402 },
    },
    {
      id: "integration-description",
      label: "Description",
      artifact: ltiAssets.details,
      note: "The Description tab adds setup context and points to support documentation. Its example describes dynamic registration and Canvas placement.",
      region: { x: 1410, y: 58, width: 626, height: 402 },
    },
    {
      id: "integration-source",
      label: "Complete source",
      artifact: ltiAssets.details,
      note: ltiAssets.details.caption,
    },
  ],
  control: [
    {
      id: "provider-products",
      label: "Product table",
      artifact: ltiAssets.control,
      note: ltiAssets.control.caption,
    },
    providerJourney,
  ],
  configure: [
    {
      id: "configuration-board",
      label: "All paths",
      artifact: ltiAssets.configure,
      note: "The board groups three LTI 1.3 non-dynamic registration paths and their review states. Select a path to follow its sequence; small field text remains limited by the original export resolution.",
    },
    {
      id: "configuration-url",
      label: "URL path",
      artifact: ltiAssets.configure,
      note: "The URL path shows loading, error, and valid states before launch settings. It then continues through permissions, data sharing, placements, URL overrides, naming, icons, and review.",
      region: { x: 40, y: 440, width: 2510, height: 295 },
    },
    {
      id: "configuration-manual",
      label: "Manual path",
      artifact: ltiAssets.configure,
      note: "The manual path includes two launch-settings screens before permissions, data sharing, placements, URL overrides, naming, icons, and review. The board makes the additional setup states visible.",
      region: { x: 40, y: 745, width: 2090, height: 264 },
    },
    {
      id: "configuration-json",
      label: "JSON path",
      artifact: ltiAssets.configure,
      note: "The JSON path continues through the same configuration areas to review. A separate inherited-key review appears beneath the main sequence.",
      region: { x: 40, y: 1010, width: 1880, height: 440 },
    },
  ],
} satisfies Record<"planning" | "discover" | "control" | "configure", LtiInspectionView[]>;
