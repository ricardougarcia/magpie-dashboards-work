import Image from "next/image";
import { CoordinateCursor } from "@/components/coordinate-cursor";
import type { PortfolioProject } from "@/lib/portfolio-types";
import { PortfolioShell } from "./portfolio-shell";
import { PortfolioLink } from "./portfolio-link";
import { boardRestorationScript } from "@/lib/portfolio-navigation";
import { ArtifactCrop } from "./artifact-viewer";
import { EvidenceRegion } from "./evidence-region";
import { RegionInspection } from "./region-inspection";
import { BoardRegistration } from "./board-registration";
import styles from "./region.module.css";
import sheet from "./board-sheet.module.css";

export function PortfolioBoard({ projects }: { projects: PortfolioProject[] }) {
  return (
    <PortfolioShell isBoard>
      <main id="portfolio-main" className={styles.board} data-gantt-region>
        <CoordinateCursor />
        <script dangerouslySetInnerHTML={{ __html: boardRestorationScript }} />
        <header className={styles.boardHeading}>
          <div><p className={styles.register}>[00] Portfolio / Selected work</p><h1>The Board<span>.</span></h1></div>
          <p>The questions. The decisions.<br />The work that followed.</p>
          <dl className={sheet.titleBlock} aria-label="Board sheet record">
            <div className={sheet.sheetOwner}><dt>Board</dt><dd>Rico Garcia</dd></div>
            <div><dt>Sheet</dt><dd>01</dd></div>
            <div><dt>Rev</dt><dd>02</dd></div>
            <div><dt>Issued</dt><dd><time dateTime="2026-09-10">10 Sep 2026</time></dd></div>
          </dl>
        </header>
        <div className={sheet.sheet} data-board-sheet>
        <BoardRegistration />
        <div className={sheet.sheetIndex}>
          <span>{String(projects.length).padStart(2, "0")} {projects.length === 1 ? "Region" : "Regions"} / Project records</span>
          {projects[0] ? <a href={`#region-${projects[0].id}`}>[Begin with {projects[0].slug.toUpperCase()}]</a> : null}
        </div>
        <div className={styles.regions}>
          {projects.map((project, index) => {
            const cover = project.artifacts.find((artifact) => artifact.id === project.coverArtifactId)!;
            const context = project.artifacts.find((artifact) => artifact.id === project.region?.contextArtifactId);
            const detail = cover.details?.[0];
            const projectUrl = `/work/${project.slug}`;
            const sourceCoordinate = detail ? `${Math.round(cover.width * detail.crop.x)},${Math.round(cover.height * detail.crop.y)}` : undefined;
            return <article key={project.id} id={`region-${project.id}`} data-region-code={project.slug.toUpperCase()} className={styles.region} aria-labelledby={`${project.id}-title`}>
              <header className={styles.regionHeading}>
                <div>
                  <p className={styles.register}><span>[{project.number}]</span> {project.organization} / {project.category}</p>
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
              <EvidenceRegion crop={detail?.crop}>
                {context ? <div className={styles.contextPlate} data-artifact="A">
                  <RegionInspection label="the starting point" reference="A" summary={context.caption} insight={project.region?.contextInsight ?? context.caption}>
                    <div key="label" className={styles.plateLabel}><span><b>A</b> Starting point</span><span>Existing experience</span></div>
                    <PortfolioLink key="context" href={`${projectUrl}#${context.id}`} aria-label={`View ${context.label.toLowerCase()} in the Project`}>
                      <Image src={context.src} alt={context.alt} width={context.width} height={context.height} sizes="(max-width: 760px) 100vw, 38vw" />
                    </PortfolioLink>
                  </RegionInspection>
                </div> : null}
                <div className={styles.notesPlate}>
                <div className={styles.researchPlate}>
                  <p className={styles.register}><span>[02]</span> Investigation / Scope</p>
                  {project.region?.signals.filter((signal) => project.sections.some((section) => section.id === signal.sectionId)).map((signal) => <PortfolioLink key={signal.label} href={`${projectUrl}#${signal.sectionId}`} className={styles.scopeSignal}>
                    <strong>{signal.value}</strong><span>{signal.label}</span>
                  </PortfolioLink>)}
                </div>
                <div className={styles.outcomePlate}>
                  <p className={styles.register}><span>[03]</span> Result / Time to value</p>
                  <p className={styles.outcome}>{project.boardTakeaway}</p>
                  <PortfolioLink href={`${projectUrl}#${project.sections.find((section) => section.kind === "impact")?.id ?? project.sections[0]?.id ?? "portfolio-main"}`} className={styles.outcomeLink}>View outcome <span className={styles.actionVerb}>[Read]</span></PortfolioLink>
                </div>
                </div>
                <div className={styles.mapPlate} data-artifact="B" data-evidence-source>
                  <RegionInspection label="the system" reference="B" evidence summary={project.region?.mapInsight ?? cover.caption} insight={cover.caption}>
                    <PortfolioLink key="map" href={projectUrl} className={styles.mapLink} aria-label={`Enter ${project.title} through the ${cover.label.toLowerCase()}`}>
                      <div className={styles.mapLandmark} data-region-landmark="map" style={{ viewTransitionName: `region-${project.id}-map` }}>
                        <div className={styles.plateLabel}><span><b>B</b> {cover.label}</span><span className={sheet.artifactMeta}>{cover.width} × {cover.height} / Original</span></div>
                        <div className={styles.mapImage} data-evidence-map>
                          <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(max-width: 760px) 100vw, 60vw" preload={index === 0} />
                          {detail ? <span className={styles.sourceWindow} style={{ left: `${detail.crop.x * 100}%`, top: `${detail.crop.y * 100}%`, width: `${detail.crop.width * 100}%`, height: `${detail.crop.height * 100}%` }} aria-hidden="true"><span>C / Detail · SRC {sourceCoordinate} px</span></span> : null}
                        </div>
                      </div>
                    </PortfolioLink>
                  </RegionInspection>
                </div>
                {detail ? <div className={styles.detailPlate} data-artifact="C" data-evidence-detail>
                  <RegionInspection label="the handoff" reference="C" summary={`${detail.label}. An enlarged detail from the full workflow.`} insight={detail.caption} evidence locator={
                    <div key="source-locator" className={styles.evidenceLocator} role="img" aria-label={`${detail.label} location in B, the full workflow map`}>
                      <span>B / Source</span>
                      <div><Image src={cover.src} alt="" width={cover.width} height={cover.height} sizes="80px" /><span style={{ left: `${detail.crop.x * 100}%`, top: `${detail.crop.y * 100}%`, width: `${detail.crop.width * 100}%`, height: `${detail.crop.height * 100}%` }} /></div>
                      <span className={sheet.sourceCoordinate}>SRC {sourceCoordinate} px</span>
                    </div>
                  }>
                    <div key="label" className={styles.plateLabel}><span><b>C</b> {detail.label}</span><span>Detail of B</span></div>
                    <PortfolioLink key="detail" href={`${projectUrl}#${cover.id}`} aria-label={`Inspect ${detail.label.toLowerCase()} in the full map`}>
                      <ArtifactCrop artifact={cover} detail={detail} />
                    </PortfolioLink>
                  </RegionInspection>
                </div> : null}
              </EvidenceRegion>
              <footer className={styles.regionFoot}><span>R:{project.slug.toUpperCase()} / End of Region {project.number}</span><span>A–B / Original artifacts · C / Detail of B</span></footer>
            </article>;
          })}
        </div>
        <footer className={sheet.generalNotes}>
          <h2>[04] General notes</h2>
          <ol>
            <li><span>N1.</span> Artifacts are preserved from the source portfolio.</li>
            <li><span>N2.</span> Enlarged details refer to their original artifact.</li>
            <li><span>N3.</span> Outcomes are reported in the source case; measurement context is included in the Project.</li>
          </ol>
          <span className={sheet.sheetEnd}>R/G <span aria-hidden="true">+</span> Sheet 01 / End</span>
        </footer>
        </div>
      </main>
    </PortfolioShell>
  );
}
