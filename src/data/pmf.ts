// Approved “Two lines of inquiry” study. Preserve the protected overviews;
// only the four explicitly selected prototype frames expose original pixels.
export const pmfRecord = { mark: "P/F", number: "03.B", role: "Sole product lead", organization: "SaferData" };

export type PmfAsset = {
  src: string;
  width: number;
  height: number;
  title: string;
  alt: string;
  caption: string;
  disclosure?: string;
  label?: string;
};

export const pmfAssets = {
  segmentation: { src: "/portfolio/pmf/segmentation-overview.png", width: 1084, height: 608, title: "Population segmentation prototype", alt: "Original population segmentation prototype overview, with detailed labels withheld", caption: "One model / multiple ways to explore a population" },
  interview: { src: "/portfolio/pmf/interview-overview.png", width: 1623, height: 1408, title: "Interview script", alt: "Original interview script overview, with prompts and identifying details withheld", caption: "A scripted conversation / not a finished product" },
  research: { src: "/portfolio/pmf/research-matrix-overview.png", width: 2846, height: 724, title: "User research synthesis matrix", alt: "Original research matrix overview, retaining its structure with identities and detailed findings withheld", caption: "User research findings / from individual inputs to a shared view" },
  market: { src: "/portfolio/pmf/market-overview.png", width: 2756, height: 1704, title: "Market-analysis board", alt: "Original market-analysis board overview, with identifiers, detailed notes, and metrics withheld", caption: "Rolling market analysis / a view of the alternatives" },
} as const;

export const pmfPrototypeFrames: readonly PmfAsset[] = [
  { src: "/portfolio/pmf/prototypes/discovery-prototype.jpg", width: 960, height: 540, title: "Population discovery prototype", alt: "Original prototype showing population attributes, a created population, and baseline population cards", caption: "Population discovery / attributes and baseline populations", disclosure: "Original prototype frame", label: "Prototype" },
  { src: "/portfolio/pmf/prototypes/segmentation-selected.jpg", width: 960, height: 538, title: "Population segmentation prototype", alt: "Original segmentation prototype with a selected group of points and a generating state", caption: "Segmentation / a selected population", disclosure: "Original prototype frame", label: "Segment" },
  { src: "/portfolio/pmf/prototypes/inference-response.jpg", width: 960, height: 540, title: "Inference prototype", alt: "Original inference prototype showing a population question, a response, and an Ask your Data input", caption: "Inference / a question and response", disclosure: "Original prototype frame", label: "Ask" },
  { src: "/portfolio/pmf/prototypes/imputation-progress.jpg", width: 960, height: 540, title: "Data imputation prototype", alt: "Original data imputation prototype with highlighted table cells, a confidence indicator, and a generating state", caption: "Data imputation / generation in progress", disclosure: "Original prototype frame", label: "Enrich" },
];

export const pmfResearchCheckpoints = [
  { id: "research-choice", label: "01 / The research choice", title: "Make the unfamiliar discussable.", reasoning: "Participants interpreted the model through tools they already knew. I kept the prototype low fidelity so the discussion could focus on needs rather than interface preferences.", artifact: "segmentation" },
  { id: "research-instrument", label: "02 / The research instrument", title: "Give every module a question.", reasoning: "I paired the modules with targeted interview questions and a complementary Bolt prototype, connecting product, market, customer, and pricing assumptions.", artifact: "interview" },
  { id: "research-synthesis", label: "03 / Synthesis", title: "Bring the findings into focus.", reasoning: "I consolidated participant feedback to understand pressing problems, capability resonance, and potential adoption barriers.", artifact: "research" },
] as const;

export const pmfMarketCheckpoints = [
  { id: "market-context", label: "01 / Market context", title: "Understand the alternatives.", reasoning: "I mapped competitors, strategies, market share, and emerging trends alongside discovery interviews." },
  { id: "capabilities-in-context", label: "02 / Capabilities in context", title: "Keep the possibilities open.", reasoning: "I worked with the data scientist to keep the demonstrations accurate while exploring processes the model could support." },
  { id: "opportunity-synthesis", label: "03 / Synthesis", title: "Find the opportunities worth pursuing.", reasoning: "I combined market signals with user findings to clarify where the model might create differentiated value." },
] as const;
