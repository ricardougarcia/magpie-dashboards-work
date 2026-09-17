import { Fragment } from "react";
import { CoordinateCursor } from "@/components/coordinate-cursor";
import type { PortfolioProject } from "@/lib/portfolio-types";
import { PanelReplacement } from "@/components/panel-replacement";
import { PortfolioMasthead, PortfolioShell } from "./portfolio-shell";
import { boardRestorationScript } from "@/lib/portfolio-navigation";
import { BoardRegistration } from "./board-registration";
import styles from "./region.module.css";
import sheet from "./board-sheet.module.css";

import { boardEntries } from "@/data/board";
import { CcpBoardCluster } from "./ccp-board-cluster";
import { MarketplaceBoardCluster } from "./marketplace-board-cluster";
import { MagpieBoardCluster, ReservedBoardCluster } from "./board-clusters";
import { GcmBoardCluster, GcmPmfBoardSlip } from "./gcm-board-cluster";
import { GcmBoardField } from "./gcm-board-field";
import clusters from "./board-clusters.module.css";

export function PortfolioBoard({ projects }: { projects: PortfolioProject[] }) {
  return (
    <PortfolioShell isBoard>
      <main id="portfolio-main" className={styles.board} data-gantt-region>
        <CoordinateCursor />
        <script dangerouslySetInnerHTML={{ __html: boardRestorationScript }} />
        <PanelReplacement outgoing={<div data-panel-content>
          <PortfolioMasthead isBoard />
          <div className={styles.boardGutter}>
        <header className={styles.boardHeading}>
          <div><p className={styles.register}>[00] Portfolio / Selected work</p><h1>The Board<span>.</span></h1></div>
          <p>The questions. The decisions.<br />The work that followed.</p>
        </header>
          </div>
        </div>}>
        <div className={styles.boardGutter}>
        <div className={sheet.sheet} data-board-sheet>
        <BoardRegistration />
        <nav className={clusters.index} aria-label="Work on the Board">
          {boardEntries.map((entry) => <a key={entry.id} href={`#region-${entry.id}`}><span>{entry.number}</span>{entry.kind === "gcm" ? "GCM + PMF" : entry.title}</a>)}
        </nav>
        <GcmBoardField className={clusters.field}>
          {boardEntries.map((entry) => {
            if (entry.kind === "magpie") return <MagpieBoardCluster key={entry.id} entry={entry} />;
            if (entry.kind === "marketplace") return <MarketplaceBoardCluster key={entry.id} entry={entry} />;
            if (entry.kind === "gcm") return <GcmBoardCluster key={entry.id} entry={entry} />;
            if (entry.kind === "ccp") {
              const project = projects.find((project) => project.slug === "ccp");
              return <Fragment key={entry.id}><GcmPmfBoardSlip />{project ? <CcpBoardCluster project={project} number={entry.number} /> : null}</Fragment>;
            }
            return <ReservedBoardCluster key={entry.id} entry={entry} />;
          })}
        </GcmBoardField>
        <footer className={sheet.generalNotes}>
          <h2>General notes</h2>
          <ol>
            <li><span>N1.</span> Artifacts are preserved from the source portfolio.</li>
            <li><span>N2.</span> Enlarged details refer to their original artifact.</li>
            <li><span>N3.</span> Wireframe areas reserve space for work samples still to come.</li>
          </ol>
          <span className={sheet.sheetEnd}>R/G <span aria-hidden="true">+</span> Sheet 01 / End</span>
        </footer>
        </div>
        </div>
        </PanelReplacement>
      </main>
    </PortfolioShell>
  );
}
