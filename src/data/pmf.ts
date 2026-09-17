// Approved “Two lines of inquiry” study. Public overview assets have details
// permanently removed; never substitute full-detail originals in this record.
export const pmfRecord = { mark: "P/F", number: "03.B", role: "Sole product lead", organization: "SaferData" };

export const pmfAssets = {
  segmentation: { src: "/portfolio/pmf/segmentation-overview.png", width: 1084, height: 608, title: "Population segmentation prototype", alt: "Original population segmentation prototype overview, with detailed labels withheld", caption: "One model / multiple ways to explore a population" },
  interview: { src: "/portfolio/pmf/interview-overview.png", width: 1623, height: 1408, title: "Interview script", alt: "Original interview script overview, with prompts and identifying details withheld", caption: "A scripted conversation / not a finished product" },
  research: { src: "/portfolio/pmf/research-matrix-overview.png", width: 2846, height: 724, title: "User research synthesis matrix", alt: "Original research matrix overview, retaining its structure with identities and detailed findings withheld", caption: "User research findings / from individual inputs to a shared view" },
  market: { src: "/portfolio/pmf/market-overview.png", width: 2756, height: 1704, title: "Market-analysis board", alt: "Original market-analysis board overview, with identifiers, detailed notes, and metrics withheld", caption: "Rolling market analysis / a view of the alternatives" },
} as const;

export type PmfAsset = (typeof pmfAssets)[keyof typeof pmfAssets];

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
