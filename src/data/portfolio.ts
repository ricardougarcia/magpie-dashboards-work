import type { PortfolioProject } from "@/lib/portfolio-types";

// Authored from the recovered public case. Source mapping and withheld claims:
// docs/portfolio-foundation.md. This collection is independent of timeline Blob data.
export const portfolioProjects: PortfolioProject[] = [
  {
    id: "learnplatform-ccp",
    slug: "ccp",
    number: "01",
    title: "Customer-Created Products",
    organization: "LearnPlatform",
    category: "Edtech / Platform workflows",
    summary: "From a request backlog to district self-service.",
    role: "Product Manager",
    duration: "6 months",
    team: "4 engineers · 2 designers · 3 contractors",
    coverArtifactId: "ccp-workflow",
    boardTakeaway: "~14 days → immediate product creation",
    artifacts: [
      {
        id: "ccp-workflow",
        src: "/portfolio/ccp/workflow.png",
        width: 5780,
        height: 5060,
        alt: "CCP workflow map across educator, district administrator, and system administrator roles, including product creation, matching, and vetting.",
        label: "Workflow map",
        caption: "The full system: three roles, shared handoffs, and a path from request to creation and matching.",
        surface: "ink",
      },
      {
        id: "ccp-request",
        src: "/portfolio/ccp/request-experience.png",
        width: 2388,
        height: 1572,
        alt: "LearnPlatform district library search showing a Missing Product tile and guidance for educators to request administrator vetting.",
        label: "Existing request experience",
        caption: "The starting point. Educators could search the library or request a missing product before district vetting.",
        surface: "paper",
      },
    ],
    sections: [
      {
        id: "context",
        kind: "context",
        headline: "A library is only useful if you can get your tools into it.",
        summary: "LearnPlatform helps education agencies discover, vet, and manage their edtech. Missing products stalled that work at the first step.",
        blocks: [
          { id: "context-screen", type: "artifact", artifactId: "ccp-request" },
          { id: "context-detail", type: "details", label: "Read more about the context", items: [
            { id: "context-platform", title: "One ecosystem. Many responsibilities.", body: "Local and state education agencies use LearnPlatform to coordinate privacy, compliance, interoperability, efficacy, and accessibility reviews. A product first had to exist in the library before those workflows could begin." },
            { id: "context-role", title: "My contribution", body: "I led product work across investigation, workflow mapping, prioritization, and phased delivery, working with engineers, designers, contractors, and customer success managers." },
          ] },
        ],
      },
      {
        id: "problem",
        kind: "problem",
        headline: "Every request joined the same queue.",
        summary: "Manual processing delayed vetting. Duplicate requests increased the workload, while “added” was often mistaken for “approved.”",
        blocks: [
          { id: "legacy-flow", type: "flow", label: "Before / contractor-dependent discovery", steps: [
            { id: "legacy-search", label: "Search", note: "Educator" },
            { id: "legacy-request", label: "Request", note: "Missing product" },
            { id: "legacy-review", label: "Manual review", note: "5–20 min per request", emphasis: true },
            { id: "legacy-create", label: "Create", note: "Contractor" },
            { id: "legacy-vet", label: "Vet", note: "District administrator" },
          ] },
          { id: "problem-signals", type: "metrics", items: [
            { id: "duplicate-rate", value: "~25%", label: "Requests duplicated existing products" },
            { id: "time-to-value-before", value: "~14 days", label: "Time to value before the change" },
          ] },
        ],
      },
      {
        id: "approach",
        kind: "approach",
        headline: "Follow the request. Find the friction.",
        summary: "Interviews, request data, and prototypes made the hidden handoffs visible—and shaped a staged release.",
        blocks: [
          { id: "research-signals", type: "metrics", items: [
            { id: "request-history", value: "2.5 years", label: "Request data reviewed" },
            { id: "research-perspectives", value: "4 perspectives", label: "Educators · admins · contractors · CSMs" },
          ] },
          { id: "approach-map", type: "artifact", artifactId: "ccp-workflow" },
          { id: "investigation-methods", type: "details", label: "Read more about the investigation", items: [
            { id: "workflow-interviews", title: "Investigation / map the whole journey", body: "I interviewed educators, administrators, contractors, and customer success managers, then mapped the workflow from search through request, review, creation, vetting, and publishing. The map exposed friction and error-prone handoffs." },
            { id: "request-analysis", title: "Investigation / examine the request history", body: "I reviewed 2.5 years of request data to understand processing times, duplicate rates, and contractor effort. Auditing thousands of requests exposed recurring causes: typos, domain changes, and company-name variations." },
            { id: "findings-matching", title: "Finding / make matching more informed", body: "The duplicate patterns informed requirements for richer customer-provided fields and smarter matching against the existing library." },
            { id: "language-testing", title: "Finding / added does not mean approved", body: "Testing with educators and administrators helped refine language and status messaging before build, addressing confusion between adding a product and approving it for use." },
            { id: "prototype-decision", title: "Decision / release the value in stages", body: "A lightweight prototype with contractors and customer success managers revealed an opportunity to separate local creation from backend matching. This enabled earlier value while matching logic was refined." },
          ] },
        ],
      },
      {
        id: "solution",
        kind: "solution",
        headline: "Create locally. Connect globally.",
        summary: "Give districts control of product creation, with a path to matching provider-managed products and preserving administrator vetting.",
        blocks: [
          { id: "self-service-flow", type: "flow", label: "After / district self-service", steps: [
            { id: "new-request", label: "Request", note: "Visible to district" },
            { id: "new-create", label: "Create locally", note: "Immediate value", emphasis: true },
            { id: "new-vet", label: "Vet", note: "District workflow" },
            { id: "new-match", label: "Match & merge", note: "Provider-managed product" },
          ] },
          { id: "release-decisions", type: "decisions", items: [
            { id: "local-creation", title: "Local creation", body: "A Custom Product Creation Wizard lets districts create the products they need." },
            { id: "global-matching", title: "Global matching", body: "A backend matching wizard replaces the legacy request system and supports merging with provider-managed products." },
          ] },
          { id: "delivery-detail", type: "details", label: "Read more about delivery", items: [
            { id: "prioritization", title: "Prioritize the critical path", body: "I focused scope on immediate time to value, duplicate reduction, and in-platform transparency. Sprint planning and reviews were paired with Kanban flow through design, development, QA, and deployment." },
            { id: "delivery-constraints", title: "Work through the system constraints", body: "Delivery involved field matching, new product-type tables, and feature tracking. Customer success input helped keep the evolving workflow aligned with power users." },
          ] },
        ],
      },
      {
        id: "impact",
        kind: "impact",
        headline: "Less waiting. More ownership.",
        summary: "The published case reports faster time to value, fewer product-request support cases, and deeper administrator engagement.",
        blocks: [
          { id: "reported-outcomes", type: "metrics", items: [
            { id: "immediate-value", value: "Immediate", label: "Time to value", note: "Previously ~14 days" },
            { id: "support-reduction", value: "−95%", label: "Product-request support cases" },
            { id: "admin-engagement", value: "+130%", label: "Administrator session duration" },
          ] },
          { id: "measurement-detail", type: "details", label: "Read more about measurement", items: [
            { id: "measurement-approach", title: "Measure the workflow, not just the launch", body: "The initiative tracked duplicates avoided, customer-created product velocity, synced-product adoption, contractor effort, time to value, and support cases. The figures above are reported in the original case study; the available source does not specify the measurement window." },
          ] },
        ],
      },
      {
        id: "reflection",
        kind: "reflection",
        headline: "The handoffs are part of the product.",
        summary: "Creation, matching, and approval serve different purposes. Making those boundaries clear gave districts more control while preserving a shared product ecosystem.",
        blocks: [
          { id: "carry-forward", type: "decisions", items: [
            { id: "investigate-handoffs", title: "Investigate across roles", body: "Follow a request through the people and systems that handle it. Friction often lives between screens." },
            { id: "clarify-language", title: "Treat language as behavior", body: "A status label shapes what a person believes they can do next. Test it alongside the workflow." },
            { id: "sequence-value", title: "Sequence around value", body: "Separate an immediate customer benefit from the deeper system work needed to sustain it." },
          ] },
        ],
      },
    ],
  },
];

export function getPortfolioProject(slug: string) {
  return portfolioProjects.find((project) => project.slug === slug);
}
