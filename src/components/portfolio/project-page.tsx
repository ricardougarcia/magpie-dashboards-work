import Image from "next/image";
import { PortfolioLink as Link } from "./portfolio-link";
import { PROJECT_SECTION_TITLES, type Artifact, type PortfolioProject, type ProjectBlock } from "@/lib/portfolio-types";
import { PortfolioShell } from "./portfolio-shell";
import { ArtifactViewer } from "./artifact-viewer";
import { PanelReplacement } from "@/components/panel-replacement";
import { ProjectReadingRail } from "./project-reading-rail";
import { WorkflowTrace } from "./workflow-trace";
import { ProjectSurface } from "./project-surface";
import { ProjectPageMotion } from "./project-page-motion";
import { CoordinateCursor } from "@/components/coordinate-cursor";
import ccp from "./ccp.module.css";
import styles from "./portfolio.module.css";

function ArtifactFigure({ artifact }: { artifact: Artifact }) {
  return (
    <figure id={artifact.id} className={styles.artifact} data-project-artifact aria-label={artifact.label}>
      {artifact.details?.length ? <>
        <span className={styles.artifactLabel}>{artifact.label}</span>
        <ArtifactViewer artifact={artifact} />
        <a className={styles.fullArtifact} data-original-link href={artifact.src} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size ${artifact.label.toLowerCase()} in a new tab`}>Open original at full size</a>
      </> : <a className={artifact.surface === "ink" ? styles.artifactInk : styles.artifactPaper} href={artifact.src} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size ${artifact.label.toLowerCase()} in a new tab`}>
        <span className={styles.artifactLabel}>{artifact.label}</span>
        <Image src={artifact.src} alt={artifact.alt} width={artifact.width} height={artifact.height} sizes="(max-width: 900px) 100vw, 900px" />
      </a>}
      {!artifact.details?.length ? <figcaption><span>{artifact.caption}</span><span className={styles.eyebrow}>Artifact / Open full size</span></figcaption> : null}
    </figure>
  );
}

function DecisionHeading({ id, title, blockId, enabled }: { id: string; title: string; blockId: string; enabled: boolean }) {
  if (enabled && blockId === "release-decisions") {
    const step = id === "local-creation" ? "new-create" : "new-match";
    return <h3><a href={`#${step}`} data-related-step={step}>{title}</a></h3>;
  }
  if (enabled && blockId === "carry-forward") {
    const section = id === "sequence-value" ? "solution" : "approach";
    return <h3><a href={`#${section}`} data-revisit-section={section}>{title}<span className={ccp.revisit} aria-hidden="true">[Revisit]</span></a></h3>;
  }
  return <h3>{title}</h3>;
}

function ProjectContentBlock({ block, project }: { block: ProjectBlock; project: PortfolioProject }) {
  switch (block.type) {
    case "artifact": {
      const artifact = project.artifacts.find((entry) => entry.id === block.artifactId);
      return artifact ? <ArtifactFigure artifact={artifact} /> : null;
    }
    case "text":
      return <div id={block.id} className={styles.prose}>{block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>;
    case "details":
      return (
        <details id={block.id} className={styles.details}>
          <summary>{block.label}<span className={styles.detailsMark} aria-hidden="true" /></summary>
          <div className={styles.detailItems}>{block.items.map((item) => (
            <div key={item.id} id={item.id}><h3>{item.title}</h3><p>{item.body}</p></div>
          ))}</div>
        </details>
      );
    case "metrics":
      return (
        <dl id={block.id} className={styles.metrics} data-content-type="metrics" data-content-block={block.id}>
          {block.items.map((item) => (
            <div key={item.id} id={item.id}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
              {item.note ? <dd className={styles.metricNote}>{item.note}</dd> : null}
            </div>
          ))}
        </dl>
      );
    case "flow":
      return <WorkflowTrace block={block} />;
    case "decisions":
      return (
        <ol id={block.id} className={styles.decisions} data-content-type="decisions" data-content-block={block.id}>
          {block.items.map((item, index) => (
            <li id={item.id} key={item.id} data-decision-step={project.slug === "ccp" && block.id === "release-decisions" ? (item.id === "local-creation" ? "new-create" : "new-match") : undefined}>
              <span className={styles.eyebrow}>[{String(index + 1).padStart(2, "0")}]</span>
              <DecisionHeading id={item.id} title={item.title} blockId={block.id} enabled={project.slug === "ccp"} /><p>{item.body}</p>
            </li>
          ))}
        </ol>
      );
  }
}

export function ProjectPage({ project }: { project: PortfolioProject }) {
  const cover = project.artifacts.find((artifact) => artifact.id === project.coverArtifactId)!;
  const approach = project.sections.find((section) => section.kind === "approach");
  const readingStart = approach ?? project.sections[0];
  const coverSection = project.sections.find((section) => section.blocks.some((block) => block.type === "artifact" && block.artifactId === cover.id));
  return (
    <PortfolioShell projectNumber={project.number}>
      <main id="portfolio-main" data-gantt-region className={`${styles.projectPage} ${project.slug === "ccp" ? ccp.sheet : ""}`}>
        <CoordinateCursor />
        {project.slug === "ccp" && <ProjectPageMotion sections={project.sections.map(({ id, kind }) => ({ id, title: PROJECT_SECTION_TITLES[kind] }))} />}
        <PanelReplacement outgoing={<header className={styles.projectHero} data-panel-content>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span>[{project.number}]</span> {project.organization} / Project</p>
            <h1 style={{ viewTransitionName: `region-${project.id}-title` }}>{project.title}<span>.</span></h1>
            <p className={styles.heroSummary}>{project.summary}</p>
            {readingStart ? <a className={styles.startReading} href={`#${readingStart.id}`}>{approach ? "Explore the investigation" : "Explore the Project"} <span className={ccp.joint} aria-hidden="true" /></a> : null}
          </div>
          <a className={styles.heroArtifact} data-region-landmark="map" style={{ viewTransitionName: `region-${project.id}-map`, background: cover.surface === "paper" ? "var(--paper-raised)" : "var(--ink)" }} href={coverSection ? `#${cover.id}` : cover.src} target={coverSection ? undefined : "_blank"} rel={coverSection ? undefined : "noopener noreferrer"} aria-label={coverSection ? `View ${cover.label.toLowerCase()} in ${PROJECT_SECTION_TITLES[coverSection.kind]}` : `Open full-size ${cover.label.toLowerCase()} in a new tab`}>
            <div className={styles.imageRegister} aria-hidden="true"><span>Artifact / {cover.label}</span><span className={ccp.registration} /></div>
            <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(max-width: 760px) 100vw, 50vw" preload />
          </a>
        </header>}>
        <dl className={styles.projectFacts}>
          <div><dt>Role</dt><dd>{project.role}</dd></div>
          <div><dt>Company</dt><dd>{project.organization}</dd></div>
          <div><dt>Duration</dt><dd>{project.duration}</dd></div>
          <div><dt>Collaborators</dt><dd>{project.team}</dd></div>
        </dl>
        <div className={styles.projectReading}>
          <ProjectReadingRail sections={project.sections.map((section) => ({ id: section.id, title: PROJECT_SECTION_TITLES[section.kind] }))} />
          <article className={styles.projectSections} aria-label={`${project.title} case study`}>
            {project.sections.map((section, index) => (
              <ProjectSurface key={section.id} id={section.id} kind={section.kind} className={styles.projectSection} enabled={project.slug === "ccp"}>
                <header className={styles.sectionHeading} data-section-heading>
                  <h2 id={`${section.id}-heading`}><span>[{String(index + 1).padStart(2, "0")}]</span> {PROJECT_SECTION_TITLES[section.kind]}</h2>
                  <p className={styles.sectionHeadline}>{section.headline}</p>
                  <p className={styles.sectionSummary}>{section.summary}</p>
                </header>
                {section.blocks.map((block) => <ProjectContentBlock key={block.id} block={block} project={project} />)}
              </ProjectSurface>
            ))}
            <Link href="/drawer" className={styles.endReturn} data-board-return><span>Return to the Board</span></Link>
          </article>
        </div>
        </PanelReplacement>
      </main>
    </PortfolioShell>
  );
}
