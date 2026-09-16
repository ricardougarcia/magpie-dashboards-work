// Source: Rico Garcia's published GCM case and original expected-behavior artifact.
// See docs/gcm-evaluation-ledger.md for provenance and the accepted 2R contract.
export const gcmRecord = { number: "03.A", role: "Sole product lead", organization: "SaferData" };
export const gcmPmfHref = "/work/pmf";
export const gcmDemoSrc = "https://video.wixstatic.com/video/7eca65_a9578d8c1a714034a612d04e4d02622d/1080p/mp4/file.mp4";
export const gcmAssets = {
  poster: "/portfolio/gcm/demo-poster.jpg",
  data: "/portfolio/gcm/data-coverage.jpg",
  expected: "/portfolio/gcm/expected-behaviors.png",
} as const;

export type GcmComponent = "llm" | "mcp" | "gcm";
export const gcmBehaviors: { id: string; title: string; components: GcmComponent[]; owner: string; requirement: string; description: string }[] = [
  { id: "tool", title: "Select the correct tool", components: ["llm"], owner: "LLM", requirement: "Choose the right operation.", description: "Map a natural-language question to the correct GCM function." },
  { id: "ambiguity", title: "Clarify ambiguous queries", components: ["llm"], owner: "LLM", requirement: "Clarify before execution.", description: "Ask for specificity when a request is ambiguous or maps to multiple tools." },
  { id: "conditions", title: "Preserve conditions and filters", components: ["llm", "mcp"], owner: "LLM + MCP", requirement: "Keep the conditions intact.", description: "Preserve the user’s assumptions and filters through the model request." },
  { id: "summary", title: "Summarize results faithfully", components: ["llm", "gcm"], owner: "GCM result + LLM summary", requirement: "Represent the result faithfully.", description: "Keep the summary aligned with the result the GCM actually returned." },
  { id: "context", title: "Maintain session context", components: ["llm"], owner: "LLM", requirement: "Carry context forward.", description: "Maintain relevant context when a follow-up refers to an earlier question or result." },
  { id: "limits", title: "Surface tool limitations", components: ["llm", "mcp"], owner: "LLM + MCP", requirement: "Make the limits visible.", description: "Surface tool constraints and unsupported operations in the conversation." },
];

export const gcmDecisions = [
  { id: "demo", label: "Demo", kicker: "My responsibility / Sole product lead", title: "Make the model understandable—and testable.", copy: "I shaped a live demo around relevant data, planned the integration, and designed its evaluation.", why: "A working interface had to make the model’s value understandable to prospective partners.", caption: "Original GCM demonstration / 3:38" },
  { id: "data", label: "Data", kicker: "My decision / Ground the demo", title: "Start with data that makes the value recognizable.", copy: "I sourced relevant consumer datasets to ground the demonstration in customer-relevant scenarios.", why: "The dataset shaped which questions the demo could make tangible.", caption: "Data coverage and sources / Frame from the original demonstration" },
  { id: "integration", label: "Integration", kicker: "My work / Plan the connection", title: "Give each component a clear responsibility.", copy: "I planned the LLM + MCP + GCM integration and led the work toward a functional demo.", why: "The conversational interface, routing layer, and model had to work together as one experience.", caption: "Conceptual system view / Interface, connection, and probabilistic model" },
  { id: "evaluation", label: "Evaluation", kicker: "My work / Define and evaluate", title: "Decide what a reliable answer must preserve.", copy: "I designed and ran structured evaluations around expected behaviors and faithful outputs.", why: "The evaluation framework connected technical reliability to the demo’s usefulness.", caption: "Expected-behavior excerpt / Re-typeset from the original framework" },
] as const;

export const gcmOutcomes = [
  { value: "10", label: "Pilot commitments + follow-on engagements", words: false },
  { value: "≥4.5/5", label: "Feedback on clarity and utility", words: false },
  { value: "97%", label: "Evaluation alignment", words: false },
  { value: "100%", label: "Participants contributed feature requests", words: false },
  { value: "Lean-team delivery", label: "Engineering, data science, and product", words: true },
  { value: "Modular foundation", label: "Built for future expansion", words: true },
] as const;
