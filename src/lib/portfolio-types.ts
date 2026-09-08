export const PROJECT_SECTION_TITLES = {
  context: "Context",
  problem: "Problem",
  approach: "Approach and decisions",
  solution: "Solution",
  impact: "Impact",
  reflection: "Reflection",
} as const;

export type ProjectSectionKind = keyof typeof PROJECT_SECTION_TITLES;

export type Artifact = {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
  label: string;
  caption: string;
  surface: "ink" | "paper";
  details?: {
    id: string;
    label: string;
    caption: string;
    // Fractions of the original image; the archived file is never altered.
    crop: { x: number; y: number; width: number; height: number };
  }[];
};

export type ProjectBlock =
  | { id: string; type: "artifact"; artifactId: string }
  | { id: string; type: "text"; paragraphs: string[] }
  | { id: string; type: "details"; label: string; items: { id: string; title: string; body: string }[] }
  | { id: string; type: "metrics"; items: { id: string; value: string; label: string; note?: string }[] }
  | { id: string; type: "flow"; label: string; steps: { id: string; label: string; note?: string; emphasis?: boolean }[] }
  | { id: string; type: "decisions"; items: { id: string; title: string; body: string }[] };

export type ProjectSection = {
  id: string;
  kind: ProjectSectionKind;
  headline: string;
  summary: string;
  blocks: ProjectBlock[];
};

export type PortfolioProject = {
  id: string;
  slug: string;
  number: string;
  title: string;
  organization: string;
  category: string;
  summary: string;
  role: string;
  duration: string;
  team: string;
  coverArtifactId: string;
  boardTakeaway: string;
  region?: {
    contextArtifactId: string;
    contextInsight: string;
    mapInsight: string;
    signals: { value: string; label: string; sectionId: string }[];
  };
  artifacts: Artifact[];
  sections: ProjectSection[];
};
