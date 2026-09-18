import { GUIDING_LIGHTS, type GuidingLightNarratives, type TimelineData } from "@/lib/timeline-types";

export const DEFAULT_GUIDING_LIGHT_NARRATIVES: GuidingLightNarratives = {
  Learn: {
    heading: "Understand before deciding.",
    narrative: "Research, usage reporting, and prototypes connected educator needs to product decisions. Customer validation tested the reporting direction before engineering investment.",
    soleContributor: "I designed and conducted discovery, built usage reports on engineering’s instrumentation, and built the replica environment for research and prototypes.",
  },
  Fix: {
    heading: "Match the response to the problem.",
    narrative: "Existing commitments needed repairs. Inaccurate reporting needed a rebuild. Changed dependencies required scope decisions, while reporting gaps needed an interim response.",
    soleContributor: "I built the accessibility scanner and produced manual ROAR reporting and analysis while dashboard coverage was incomplete.",
  },
  Stabilize: {
    heading: "Make recovery repeatable.",
    narrative: "The team protected live reporting, expanded testing, and defined reliability targets. Completion’s validated relaunch established a model for the migrations that followed.",
    soleContributor: "I performed dashboard QA and owned the migration roadmap, connecting release decisions to the reporting educators depended on.",
  },
  Govern: {
    heading: "Turn knowledge into shared practice.",
    narrative: "Intake, definitions, and documented decisions connected requests to the work behind them. Shared practices gave the team a clearer basis for prioritization and delivery.",
    soleContributor: "I created the intake board and supporting processes to make requests, priorities, and decisions visible.",
  },
  Grow: {
    heading: "Ready for feature development and scale.",
    narrative: "The groundwork positions the dashboards for Q4 and beyond: a foundation for new features and scalable growth.",
    soleContributor: "I completed detailed initiative proposals for Q4 and Q1, including the work outlined in Q4 Groundwork. I also developed six evidence-rich Unified Dashboard research prototypes, supported by competitor analysis, customer discovery, internal alignments, and market parity reports.",
  },
};

export function resolveGuidingLightNarratives(input?: TimelineData["guidingLightNarratives"]): GuidingLightNarratives {
  return Object.fromEntries(GUIDING_LIGHTS.map((light) => [light, {
    ...(input?.[light] ?? DEFAULT_GUIDING_LIGHT_NARRATIVES[light]),
  }])) as GuidingLightNarratives;
}
