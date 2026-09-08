import Image from "next/image";
import type { PortfolioProject } from "@/lib/portfolio-types";
import { PortfolioShell } from "./portfolio-shell";
import { PortfolioLink } from "./portfolio-link";
import { boardRestorationScript } from "@/lib/portfolio-navigation";
import { ArtifactCrop } from "./artifact-viewer";
import { EvidenceRegion } from "./evidence-region";
import { RegionInspection } from "./region-inspection";
import styles from "./region.module.css";

export function PortfolioBoard({ projects }: { projects: PortfolioProject[] }) {
  return (
    <PortfolioShell isBoard>
      <main id="portfolio-main" className={styles.board}>
        <script dangerouslySetInnerHTML={{ __html: boardRestorationScript }} />
        <header className={styles.boardHeading}>
          <div><p className={styles.register}>R/G — Selected work</p><h1>The Board<span>.</span></h1></div>
          <p>The questions. The decisions.<br />The work that followed.</p>
          <span className={styles.register}>{String(projects.length).padStart(2, "0")} {projects.length === 1 ? "Region" : "Regions"}</span>
        </header>
        <div className={styles.regions}>
          {projects.map((project, index) => {
            const cover = project.artifacts.find((artifact) => artifact.id === project.coverArtifactId)!;
            const context = project.artifacts.find((artifact) => artifact.id === project.region?.contextArtifactId);
            const detail = cover.details?.[0];
            const projectUrl = `/work/${project.slug}`;
            return <article key={project.id} id={`region-${project.id}`} className={styles.region} aria-labelledby={`${project.id}-title`}>
              <header className={styles.regionHeading}>
                <div>
                  <p className={styles.register}><span>[{project.number}]</span> {project.organization} / {project.category}</p>
                  <h2 id={`${project.id}-title`} style={{ viewTransitionName: `region-${project.id}-title` }}>
                    <PortfolioLink href={projectUrl} aria-label={project.title}>{project.title}<span>.</span></PortfolioLink>
                  </h2>
                  <p className={styles.summary}>{project.summary}</p>
                </div>
                <div className={styles.regionIdentity}>
                  <p className={styles.register}>Region {project.number} / Project record</p>
                  <p>{project.role}<span>{project.duration} / {project.team}</span></p>
                  <PortfolioLink href={projectUrl} className={styles.enter}>Enter Project <span aria-hidden="true">↗</span></PortfolioLink>
                </div>
              </header>
              <EvidenceRegion crop={detail?.crop}>
                <div className={styles.mapPlate} data-evidence-source>
                  <RegionInspection label="the system" summary={cover.caption} insight={project.region?.mapInsight ?? cover.caption}>
                    <PortfolioLink href={projectUrl} className={styles.mapLink} aria-label={`Enter ${project.title} through the ${cover.label.toLowerCase()}`}>
                      <div className={styles.mapLandmark} data-region-landmark="map" style={{ viewTransitionName: `region-${project.id}-map` }}>
                        <div className={styles.plateLabel}><span>A / {cover.label}</span><span aria-hidden="true">↗</span></div>
                        <div className={styles.mapImage} data-evidence-map>
                          <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(max-width: 760px) 100vw, 65vw" preload={index === 0} />
                          {detail ? <span className={styles.sourceWindow} style={{ left: `${detail.crop.x * 100}%`, top: `${detail.crop.y * 100}%`, width: `${detail.crop.width * 100}%`, height: `${detail.crop.height * 100}%` }} aria-hidden="true"><span>C / Detail</span></span> : null}
                        </div>
                      </div>
                    </PortfolioLink>
                  </RegionInspection>
                </div>
                {context ? <div className={styles.contextPlate}>
                  <RegionInspection label="the starting point" summary={context.caption} insight={project.region?.contextInsight ?? context.caption}>
                    <div className={styles.plateLabel}><span>B / Starting point</span><span aria-hidden="true">↘</span></div>
                    <PortfolioLink href={`${projectUrl}#${context.id}`} aria-label={`View ${context.label.toLowerCase()} in the Project`}>
                      <Image src={context.src} alt={context.alt} width={context.width} height={context.height} sizes="(max-width: 760px) 100vw, 32vw" />
                    </PortfolioLink>
                  </RegionInspection>
                </div> : null}
                <div className={styles.researchPlate}>
                  <p className={styles.register}>Investigation / Scope</p>
                  {project.region?.signals.filter((signal) => project.sections.some((section) => section.id === signal.sectionId)).map((signal) => <PortfolioLink key={signal.label} href={`${projectUrl}#${signal.sectionId}`} className={styles.scopeSignal}>
                    <strong>{signal.value}</strong><span>{signal.label}</span><span aria-hidden="true">↗</span>
                  </PortfolioLink>)}
                  <p className={styles.scopeFootnote}>Trace the work behind the outcome.</p>
                </div>
                {detail ? <div className={styles.detailPlate} data-evidence-detail>
                  <RegionInspection label="the handoff" summary={`${detail.label}. An enlarged detail from the full workflow.`} insight={detail.caption} evidence locator={
                    <div className={styles.evidenceLocator} role="img" aria-label={`${detail.label} location in A, the full workflow map`}>
                      <span>A / Source</span>
                      <div><Image src={cover.src} alt="" width={cover.width} height={cover.height} sizes="80px" /><span style={{ left: `${detail.crop.x * 100}%`, top: `${detail.crop.y * 100}%`, width: `${detail.crop.width * 100}%`, height: `${detail.crop.height * 100}%` }} /></div>
                    </div>
                  }>
                    <div className={styles.plateLabel}><span>C / {detail.label}</span><span>Detail of A</span></div>
                    <PortfolioLink href={`${projectUrl}#${cover.id}`} aria-label={`Inspect ${detail.label.toLowerCase()} in the full map`}>
                      <ArtifactCrop artifact={cover} detail={detail} />
                    </PortfolioLink>
                  </RegionInspection>
                </div> : null}
                <div className={styles.outcomePlate}>
                  <p className={styles.register}>Result / Time to value</p>
                  <p className={styles.outcome}>{project.boardTakeaway}</p>
                  <PortfolioLink href={`${projectUrl}#${project.sections.find((section) => section.kind === "impact")?.id ?? project.sections[0]?.id ?? "portfolio-main"}`} className={styles.outcomeLink}>Explore the outcome <span aria-hidden="true">↗</span></PortfolioLink>
                </div>
              </EvidenceRegion>
              <footer className={styles.regionFoot}><span>Region {project.number} / {project.organization}</span><span>Overview → Evidence → Project</span></footer>
            </article>;
          })}
        </div>
      </main>
    </PortfolioShell>
  );
}
