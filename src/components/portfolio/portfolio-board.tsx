import Image from "next/image";
import Link from "next/link";
import type { PortfolioProject } from "@/lib/portfolio-types";
import { PortfolioShell } from "./portfolio-shell";
import styles from "./portfolio.module.css";

export function PortfolioBoard({ projects }: { projects: PortfolioProject[] }) {
  return (
    <PortfolioShell isBoard>
      <main id="portfolio-main" className={styles.boardMain}>
        <div className={styles.boardIntroduction}>
          <div>
            <p className={styles.eyebrow}><span>[00]</span> Portfolio / Overview</p>
            <h1 className={styles.boardTitle}>THE BOARD<span>.</span></h1>
          </div>
          <p className={styles.boardStatement}>The questions. The decisions.<br />The work that followed.</p>
        </div>
        <div className={styles.boardSurface}>
          <div className={styles.boardRegister}>
            <span>Selected work</span>
            <span>{String(projects.length).padStart(2, "0")} {projects.length === 1 ? "Project" : "Projects"}</span>
          </div>
          <div className={styles.projectCollection}>
            {projects.map((project, index) => {
              const cover = project.artifacts.find((artifact) => artifact.id === project.coverArtifactId)!;
              return (
                <article key={project.id} className={styles.boardProject}>
                  <Link href={`/work/${project.slug}`} className={styles.projectLink} aria-labelledby={`${project.id}-title`}>
                    <div className={styles.boardImage}>
                      <div className={styles.imageRegister} aria-hidden="true"><span>{project.number} / {cover.label}</span><span>↗</span></div>
                      <Image src={cover.src} alt={cover.alt} width={cover.width} height={cover.height} sizes="(max-width: 760px) 100vw, 55vw" preload={index === 0} />
                    </div>
                    <div className={styles.boardProjectCopy}>
                      <p className={styles.eyebrow}><span>[{project.number}]</span> {project.organization}</p>
                      <h2 id={`${project.id}-title`}>{project.title}</h2>
                      <p className={styles.projectSummary}>{project.summary}</p>
                      <div className={styles.projectTakeaway}>{project.boardTakeaway}</div>
                      <div className={styles.projectCardBottom}>
                        <span className={styles.eyebrow}>{project.duration} / {project.role}</span>
                        <span className={styles.openProject}>Explore Project <span aria-hidden="true">↗</span></span>
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
          <div className={styles.boardCoordinates} aria-hidden="true"><span>R/G — Work index</span><span>01:01</span></div>
        </div>
      </main>
    </PortfolioShell>
  );
}
