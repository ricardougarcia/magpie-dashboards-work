import type { Artifact } from "@/lib/portfolio-types";

// Approved Editorial Relay study; provenance and evidence limits are recorded
// in docs/lti-editorial-relay.md. The archived image pixels are unchanged.
export const ltiRecord = {
  mark: "L/T",
  number: "04",
  role: "Product Manager",
  organization: "LearnPlatform",
};

export type LtiAsset = Artifact & { code: string };

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
    id: "lti-canvas-configuration",
    code: "A076",
    src: "/portfolio/lti/canvas-configuration.png",
    width: 810,
    height: 1006,
    label: "Canvas configuration",
    surface: "paper",
    alt: "Original Add Canvas Configuration dialog showing LTI 1.3 Dynamic Registration, URL, placements, services, and notes.",
    caption: "The Add Canvas Configuration dialog presents the LTI 1.3 Dynamic Registration setup.",
  },
} satisfies Record<string, LtiAsset>;
