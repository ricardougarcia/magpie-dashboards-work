import type { CSSProperties } from "react";
import type { BoardEntry } from "@/data/board";
import timelineSeed from "@/data/timeline.seed.json";
import type { TimelineData } from "@/lib/timeline-types";
import { MONTHS } from "@/lib/timeline-types";
import { createTimelineLayout } from "@/lib/timeline-layout";
import { PortfolioLink } from "./portfolio-link";
import { RegionInspection } from "./region-inspection";
import { ClusterEntrance } from "./cluster-entrance";
import styles from "./board-clusters.module.css";
import region from "./region.module.css";

// This Board-only drawing is an excerpt of the checked-in source record.
// The completed Magpie experience continues to load its own live timeline.
const source = timelineSeed as TimelineData;
const engineering = { ...source, lanes: source.lanes.filter((lane) => lane.id === "eng-build") };
const drawing = createTimelineLayout(engineering, {
  labelWidth: 12, monthWidth: 80, monthCount: 9, laneHeaderHeight: 0,
  rowHeight: 27, barHeight: 18, laneGap: 12, barInset: 3, topInset: 34, canvasPadding: 12,
});
const completion = source.items.find((item) => item.id === "eng-build--v2-migration-phases-1-3-completion-dashboard")!;
const selected = drawing.items.find((item) => item.id === completion.id)!;

export function MagpieBoardCluster({ entry }: { entry: BoardEntry }) {
  return <article id={`region-${entry.id}`} data-region-code="MAGPIE" data-board-number={entry.number} data-board-state="ready" className={`${styles.cluster} ${styles.magpie}`} aria-labelledby="magpie-title">
    <header className={styles.heading}>
      <p className={region.register}>[{entry.number}] Magpie Literacy / Platform data</p>
      <h2 id="magpie-title"><PortfolioLink href="/" aria-label="Magpie">Magpie<span>.</span></PortfolioLink></h2>
      <p className={styles.summary}>Rebuild the system. Restore the trust.</p>
      <div className={styles.facts}><span>Principal Product Manager</span><span>09 months</span></div>
    </header>
    <ClusterEntrance className={styles.magpieArtifacts}>
      <RegionInspection label="the Magpie timeline" reference="M" summary="Engineering, research, operations, and the curve balls in between." insight="Follow the connections between the rebuild and the work that made it possible.">
        <PortfolioLink href="/#timeline-heading" className={styles.timelineMount} aria-label="Explore the Magpie work timeline">
          <div className={styles.sourceLabel}><span>A / Engineering build</span><span>Source excerpt</span></div>
          <svg viewBox={`0 0 ${drawing.width} ${drawing.height}`} className={styles.timelineDrawing} role="img" aria-label="Engineering work from the Magpie timeline, arranged from January through September">
            {MONTHS.slice(0, 9).map((month, i) => <g key={month}><text x={16 + i * 80} y="18">{month.toUpperCase()}</text><path className={styles.monthRule} d={`M ${12 + i * 80} 27 V ${drawing.height - 12}`} /></g>)}
            {drawing.items.map((item, i) => <g key={item.id} className={item.id === completion.id ? styles.selectedWork : styles.workBar} style={{ "--bar-delay": `${i * 23}ms` } as CSSProperties}>
              <title>{`${item.name} / ${item.placement}`}</title>
              <rect x={item.rect.left} y={item.rect.top} width={item.rect.width} height={item.rect.height} />
              <path d={`M ${item.rect.left + 7} ${item.rect.top + 9} h ${Math.min(item.rect.width - 14, 36 + item.name.length)}`} />
            </g>)}
            <path className={styles.sourceTrace} pathLength="1" d={`M ${selected.rect.left + selected.rect.width / 2} ${selected.rect.top + selected.rect.height} V ${drawing.height - 5} H ${drawing.width - 18}`} />
          </svg>
          <div className={styles.sourceLabel}><span>{drawing.items.length} work items / Lane 01</span><span>[Explore timeline]</span></div>
        </PortfolioLink>
      </RegionInspection>
      <PortfolioLink href="/#timeline-heading" className={styles.detachedNote} aria-label="Explore the Completion Dashboard rebuild in Magpie">
        <span className={styles.sourceLabel}>B / From the source record</span>
        <h3>Completion<br />Dashboard rebuild</h3>
        <p>{completion.value}</p>
        <span className={styles.noteFoot}>{completion.placement} <span>[Read in context]</span></span>
      </PortfolioLink>
    </ClusterEntrance>
    <footer className={styles.clusterFoot}><span>R:MAGPIE / {source.lanes.length} lanes</span><PortfolioLink href="/">View project <span>[Open]</span></PortfolioLink></footer>
  </article>;
}

/** Deliberate blank studies, not invented product interfaces or loading states. */
function ReservedDrawing({ signature }: { signature: BoardEntry["signature"] }) {
  return <svg viewBox="0 0 600 370" className={styles.reservedDrawing} aria-hidden="true">
    <path className={styles.registrationMarks} pathLength="1" d="M 12 42 V 12 H 42 M 558 358 H 588 V 328" />
    {signature === "catalog" ? <g className={styles.catalogStudy}>
      <path className={styles.paperPlane} d="M 68 42 H 576 V 277 H 68 Z" />
      <path d="M 88 67 H 245 M 88 89 H 190 M 88 116 H 555 M 250 116 V 255 M 410 116 V 255" />
      <path className={styles.fineHatch} d="M 112 148 L 173 209 M 139 148 L 200 209 M 166 148 L 227 209 M 277 148 L 338 209 M 304 148 L 365 209 M 331 148 L 392 209" />
      <path className={styles.paperPlane} d="M 20 224 H 211 V 344 H 20 Z" /><path d="M 40 246 H 100 M 40 268 H 171 M 40 284 H 144" />
    </g> : signature === "register" ? <g>
      <path className={styles.paperPlane} d="M 18 74 H 447 V 328 H 18 Z" />
      <path d="M 43 108 H 242 M 43 134 H 419 M 177 156 V 300 M 308 156 V 300 M 43 192 H 419 M 43 242 H 419" />
      <path className={styles.paperPlane} d="M 381 22 H 563 V 218 H 381 Z" /><circle cx="472" cy="112" r="51" /><path d="M 404 112 H 540 M 472 44 V 180" />
    </g> : signature === "bridge" ? <g>
      <path className={styles.paperPlane} d="M 60 27 H 269 V 246 H 60 Z M 350 133 H 560 V 341 H 350 Z" />
      <path d="M 83 54 H 191 M 83 79 H 244 M 83 105 H 151 M 374 161 H 512 M 374 184 H 459" />
      <path className={styles.bridgeStudy} d="M 210 175 H 306 V 239 H 396" /><circle cx="210" cy="175" r="5" /><circle cx="396" cy="239" r="5" />
      <path className={styles.fineHatch} d="M 73 214 H 257 M 363 305 H 548" />
    </g> : <g>
      <path className={styles.paperPlane} d="M 28 32 H 456 V 305 H 28 Z" /><path d="M 110 32 V 305 M 49 62 H 88 M 49 99 H 76 M 49 128 H 87 M 49 157 H 79 M 49 186 H 89 M 137 62 H 363 M 137 92 H 253" />
      <path className={styles.paperPlane} d="M 313 186 H 577 V 343 H 313 Z" /><path d="M 338 213 H 458 M 338 239 H 550 M 338 265 H 550 M 480 213 V 316" />
    </g>}
  </svg>;
}

export function ReservedBoardCluster({ entry }: { entry: BoardEntry }) {
  return <article id={`region-${entry.id}`} data-region-code={entry.id.toUpperCase()} data-board-number={entry.number} data-board-state="reserved" className={`${styles.cluster} ${styles.reserved}`} aria-labelledby={`${entry.id}-title`}>
    <header className={styles.heading}>
      <p className={region.register}>[{entry.number}] Work sample / Reserved</p>
      <h2 id={`${entry.id}-title`}>{entry.title}<span>.</span></h2>
      <p className={styles.summary}>Case study to come.</p>
      <div className={styles.facts}><span>Wireframe placeholder</span></div>
    </header>
    <ClusterEntrance className={styles.reservedArtifacts}>
      <ReservedDrawing signature={entry.signature} />
      <div className={styles.reservedCaption}><span>{entry.number} / Artifact area</span><p>Space reserved for the work.</p></div>
    </ClusterEntrance>
    <footer className={styles.clusterFoot}><span>R:{entry.id.toUpperCase()}</span><span>Not yet published</span></footer>
  </article>;
}
