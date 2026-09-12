import Image from "next/image";
import type { PortfolioProject } from "@/lib/portfolio-types";
import { PortfolioLink } from "./portfolio-link";
import { ArtifactCrop } from "./artifact-viewer";
import { EvidenceRegion } from "./evidence-region";
import { RegionInspection } from "./region-inspection";
import styles from "./region.module.css";
import sheet from "./board-sheet.module.css";

import clusters from "./board-clusters.module.css";

export function CcpBoardCluster({ project, number }: { project: PortfolioProject; number: string }) {
  const cover = project.artifacts.find((artifact) => artifact.id === project.coverArtifactId)!;
  const context = project.artifacts.find((artifact) => artifact.id === project.region?.contextArtifactId);
  const detail = cover.details?.[0];
  const projectUrl = `/work/${project.slug}`;
  const sourceCoordinate = detail ? `${Math.round(cover.width * detail.crop.x)},${Math.round(cover.height * detail.crop.y)}` : undefined;
  return <article id={`region-${project.id}`} data-region-code={project.slug.toUpperCase()} className={`${styles.region} ${clusters.cluster} ${clusters.ccp}`} data-board-number={number} data-board-state="ready" aria-labelledby={`${project.id}-title`}>
    <header className={styles.regionHeading}>
      <div>
        <p className={styles.register}><span>[{number}]</span> {project.organization} / {project.category}</p>
        <h2 id={`${project.id}-title`} style={{ viewTransitionName: `region-${project.id}-title` }}>
          <PortfolioLink href={projectUrl} aria-label={project.title}>{project.title}<span>.</span></PortfolioLink>
        </h2>
        <p className={styles.summary}>{project.summary}</p>
      </div>
      <div className={styles.regionIdentity}>
        <dl className={sheet.specPlate} aria-label={`${project.title} specifications`}>
          <div><dt>Role</dt><dd>{project.role}</dd></div>
          <div><dt>Duration</dt><dd>{project.duration}</dd></div>
          <div><dt>Team</dt><dd>{project.team}</dd></div>
        </dl>
        <PortfolioLink href={projectUrl} className={styles.enter}>View project <span className={styles.actionVerb}>[Open]</span></PortfolioLink>
      </div>
    </header>
    <EvidenceRegion crop={detail?.crop} deferUntilVisible>
      {context ? <div className={styles.contextPlate} data-artifact="A">
        <RegionInspection label="the starting point" reference="A" summary={context.caption} insight={project.region?.contextInsight ?? context.caption}>
          <div key="label" className={styles.plateLabel} data-plate-label><span><b>A</b> Starting point</span><span>Existing experience</span></div>
          <PortfolioLink className={styles.contextMount} data-artifact-mount key="context" href={`${projectUrl}#${context.id}`} aria-label={`View ${context.label.toLowerCase()} in the Project`}>
            <Image src={context.src} alt={context.alt} width={context.width} height={context.height} sizes="(max-width: 760px) 100vw, 24vw" />
          </PortfolioLink>
        </RegionInspection>
      </div> : null}
      <div className={styles.mapPlate} data-artifact="B" data-evidence-source>
        <RegionInspection label="the system" reference="B" evidence summary={project.region?.mapInsight ?? cover.caption} insight={cover.caption}>
          <PortfolioLink key="map" href={projectUrl} className={styles.mapLink} aria-label={`Enter ${project.title} through the ${cover.label.toLowerCase()}`}>
            <div className={styles.mapLandmark} data-region-landmark="map" style={{ viewTransitionName: `region-${project.id}-map` }}>
              <div className={styles.plateLabel} data-plate-label><span><b>B</b> {cover.label}</span><span className={sheet.artifactMeta}>{cover.width} × {cover.height} / Original</span></div>
              <div className={styles.mapMount} data-artifact-mount data-map-mount>
              <div className={styles.mapImage} data-evidence-map>
                <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(max-width: 760px) 100vw, 30vw" />
                {detail ? <span className={styles.sourceWindow} style={{ left: `${detail.crop.x * 100}%`, top: `${detail.crop.y * 100}%`, width: `${detail.crop.width * 100}%`, height: `${detail.crop.height * 100}%` }} aria-hidden="true"><span>C / Detail · SRC {sourceCoordinate} px</span></span> : null}
              </div>
              </div>
            </div>
          </PortfolioLink>
        </RegionInspection>
      </div>
      {detail ? <div className={styles.detailPlate} data-artifact="C" data-evidence-detail>
        <RegionInspection label="the handoff" reference="C" summary={`${detail.label}. An enlarged detail from the full workflow.`} insight={detail.caption} evidence locator={
          <div key="source-locator" className={styles.evidenceLocator} data-source-locator role="img" aria-label={`${detail.label} location in B, the full workflow map`}>
            <span>B / Source</span>
            <div><Image src={cover.src} alt="" width={cover.width} height={cover.height} sizes="80px" /><span style={{ left: `${detail.crop.x * 100}%`, top: `${detail.crop.y * 100}%`, width: `${detail.crop.width * 100}%`, height: `${detail.crop.height * 100}%` }} /></div>
            <span className={sheet.sourceCoordinate}>SRC {sourceCoordinate} px</span>
          </div>
        }>
          <div key="label" className={styles.plateLabel} data-plate-label><span><b>C</b> {detail.label}</span><span>Detail of B</span></div>
          <PortfolioLink className={styles.detailMount} data-artifact-mount key="detail" href={`${projectUrl}#${cover.id}`} aria-label={`Inspect ${detail.label.toLowerCase()} in the full map`}>
            <ArtifactCrop artifact={cover} detail={detail} />
          </PortfolioLink>
        </RegionInspection>
      </div> : null}
    </EvidenceRegion>
      <div className={styles.notesPlate} data-board-notes>
      <section className={styles.researchPlate} aria-labelledby={`${project.id}-scope`}>
        <h3 id={`${project.id}-scope`} className={styles.register}>Investigation / Scope</h3>
        <div className={styles.researchSignals}>
        {project.region?.signals.filter((signal) => project.sections.some((section) => section.id === signal.sectionId)).map((signal) => <PortfolioLink key={signal.label} href={`${projectUrl}#${signal.sectionId}`} className={styles.scopeSignal}>
          <strong>{signal.value}</strong><span>{signal.label}</span>
        </PortfolioLink>)}
        </div>
      </section>
      <section className={styles.outcomePlate} aria-labelledby={`${project.id}-outcome`}>
        <h3 id={`${project.id}-outcome`} className={styles.register}>Result / Time to value</h3>
        <div>
        <p className={styles.outcome}>{project.boardTakeaway}</p>
        <PortfolioLink href={`${projectUrl}#${project.sections.find((section) => section.kind === "impact")?.id ?? project.sections[0]?.id ?? "portfolio-main"}`} className={styles.outcomeLink}>View outcome <span className={styles.actionVerb}>[Read]</span></PortfolioLink>
        </div>
      </section>
      </div>
    <footer className={styles.regionFoot}><span>R:{project.slug.toUpperCase()} / End of Region {number}</span><PortfolioLink href={projectUrl}>View project <span className={styles.actionVerb}>[Open]</span></PortfolioLink></footer>
  </article>;
}
