import Image from "next/image";
import Link from "next/link";
import { PROJECT_SECTION_TITLES, type Artifact, type PortfolioProject, type ProjectBlock } from "@/lib/portfolio-types";
import { PortfolioShell } from "./portfolio-shell";
import styles from "./portfolio.module.css";

function ArtifactFigure({ artifact }: { artifact: Artifact }) {
  return (
    <figure id={artifact.id} className={styles.artifact}>
      <a className={artifact.surface === "ink" ? styles.artifactInk : styles.artifactPaper} href={artifact.src} target="_blank" rel="noopener noreferrer" aria-label={`Open full-size ${artifact.label.toLowerCase()} in a new tab`}>
        <span className={styles.artifactLabel}>{artifact.label}<span aria-hidden="true">↗</span></span>
        <Image src={artifact.src} alt={artifact.alt} width={artifact.width} height={artifact.height} sizes="(max-width: 900px) 100vw, 900px" />
      </a>
      <figcaption><span>{artifact.caption}</span><span className={styles.eyebrow}>Artifact / Open full size ↗</span></figcaption>
    </figure>
  );
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
        <dl id={block.id} className={styles.metrics}>
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
      return (
        <figure id={block.id} className={styles.flowFigure}>
          <figcaption className={styles.eyebrow}>{block.label}</figcaption>
          <ol className={styles.flow}>
            {block.steps.map((step, index) => (
              <li key={step.id} id={step.id} className={step.emphasis ? styles.flowEmphasis : undefined}>
                <span className={styles.flowIndex}>{String(index + 1).padStart(2, "0")}</span>
                <strong>{step.label}</strong><span>{step.note}</span>
              </li>
            ))}
          </ol>
        </figure>
      );
    case "decisions":
      return (
        <ol id={block.id} className={styles.decisions}>
          {block.items.map((item, index) => (
            <li id={item.id} key={item.id}>
              <span className={styles.eyebrow}>[{String(index + 1).padStart(2, "0")}]</span>
              <h3>{item.title}</h3><p>{item.body}</p>
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
      <main id="portfolio-main">
        <header className={styles.projectHero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span>[{project.number}]</span> {project.organization} / Project</p>
            <h1>{project.title}<span>.</span></h1>
            <p className={styles.heroSummary}>{project.summary}</p>
            {readingStart ? <a className={styles.startReading} href={`#${readingStart.id}`}>{approach ? "Explore the investigation" : "Explore the Project"} <span aria-hidden="true">↓</span></a> : null}
          </div>
          <a className={styles.heroArtifact} href={coverSection ? `#${cover.id}` : cover.src} target={coverSection ? undefined : "_blank"} rel={coverSection ? undefined : "noopener noreferrer"} aria-label={coverSection ? `View ${cover.label.toLowerCase()} in ${PROJECT_SECTION_TITLES[coverSection.kind]}` : `Open full-size ${cover.label.toLowerCase()} in a new tab`}>
            <div className={styles.imageRegister} aria-hidden="true"><span>Artifact / {cover.label}</span><span>↓</span></div>
            <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(max-width: 760px) 100vw, 50vw" preload />
          </a>
        </header>
        <dl className={styles.projectFacts}>
          <div><dt>Role</dt><dd>{project.role}</dd></div>
          <div><dt>Company</dt><dd>{project.organization}</dd></div>
          <div><dt>Duration</dt><dd>{project.duration}</dd></div>
          <div><dt>Collaborators</dt><dd>{project.team}</dd></div>
        </dl>
        <div className={styles.projectReading}>
          <aside className={styles.sectionRail}>
            <nav aria-label="Project sections">
              <p className={styles.eyebrow}>In this Project</p>
              <ol>{project.sections.map((section, index) => (
                <li key={section.id}><a href={`#${section.id}`}><span>{String(index + 1).padStart(2, "0")}</span>{PROJECT_SECTION_TITLES[section.kind]}</a></li>
              ))}</ol>
              <Link href="/drawer" className={styles.railReturn}>← Board</Link>
            </nav>
          </aside>
          <article className={styles.projectSections} aria-label={`${project.title} case study`}>
            {project.sections.map((section, index) => (
              <section key={section.id} id={section.id} className={styles.projectSection} aria-labelledby={`${section.id}-heading`}>
                <header className={styles.sectionHeading}>
                  <h2 id={`${section.id}-heading`}><span>[{String(index + 1).padStart(2, "0")}]</span> {PROJECT_SECTION_TITLES[section.kind]}</h2>
                  <p className={styles.sectionHeadline}>{section.headline}</p>
                  <p className={styles.sectionSummary}>{section.summary}</p>
                </header>
                {section.blocks.map((block) => <ProjectContentBlock key={block.id} block={block} project={project} />)}
              </section>
            ))}
            <Link href="/drawer" className={styles.endReturn}><span>Return to the Board</span><span aria-hidden="true">↗</span></Link>
          </article>
        </div>
      </main>
    </PortfolioShell>
  );
}
