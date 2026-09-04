"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ExternalLink, Maximize2, X } from "lucide-react";
import Image from "next/image";
import {
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CoordinateCursor } from "@/components/coordinate-cursor";
import { MONTHS, placementSpan, type PublicTimelineData, type PublicTimelineItem } from "@/lib/timeline-types";

const LANE_ORDER = [
  "Eng Build",
  "Product Build",
  "Product Discovery",
  "Processes",
  "Challenges Planned / Unplanned",
];

const PHASES = [
  { label: "Learn fast, stabilize faster", start: 0, span: 2 },
  { label: "Choose rebuild over repair", start: 2, span: 2 },
  { label: "Relaunch and govern", start: 4, span: 2 },
  { label: "Prepare for scale", start: 6, span: 3 },
];

const LANE_CODES: Record<string, string> = {
  "Eng Build": "ENG",
  "Product Build": "BLD",
  "Product Discovery": "DSC",
  Processes: "OPS",
  "Challenges Planned / Unplanned": "CRV",
};

const COLOR_LABELS: Record<PublicTimelineItem["colorToken"], string> = {
  graphite: "Discovery-led",
  signal: "Corrective",
  steel: "Reliability",
  umber: "Governance",
  forest: "Growth",
};

type PositionedItem = PublicTimelineItem & { row: number };
type Connection = { id: string; targetId: string; path: string };

function assignRows(items: PublicTimelineItem[]) {
  const result = new Map<string, number>();
  const rowEnds: number[] = [];
  [...items]
    .sort((a, b) => a.start - b.start || a.end - b.end)
    .forEach((item) => {
      let row = rowEnds.findIndex((end) => end < item.start);
      if (row === -1) row = rowEnds.length;
      rowEnds[row] = item.end;
      result.set(item.id, row);
    });
  return { rows: result, count: Math.max(1, rowEnds.length) };
}

function MediaPlaceholder({ item }: { item: PublicTimelineItem }) {
  return (
    <div className="media-placeholder" aria-label="Media not yet uploaded">
      <div className="media-placeholder-grid" aria-hidden="true" />
      <span className="eyebrow">Artifact pending</span>
      <strong>{item.name}</strong>
      <span className="media-placeholder-meta">MEDIA SLOT / {item.colorToken.toUpperCase()}</span>
    </div>
  );
}

function DetailPanel({
  item,
  allItems,
  focusedRelation,
  setFocusedRelation,
  onClose,
  onPreview,
}: {
  item: PublicTimelineItem;
  allItems: PublicTimelineItem[];
  focusedRelation: string | null;
  setFocusedRelation: (id: string | null) => void;
  onClose: () => void;
  onPreview: () => void;
}) {
  const index = allItems.findIndex((entry) => entry.id === item.id) + 1;
  return (
    <motion.aside
      className="detail-panel"
      initial={{ opacity: 0, x: 22 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 22 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`Details for ${item.name}`}
    >
      <span className="detail-rail-label">Selected work / record</span>
      <div className="detail-panel-head">
        <span className="index-mark">[{String(index).padStart(2, "0")}] / {LANE_CODES[item.lane] ?? "Q4"}</span>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close details">
          <X size={16} />
        </button>
      </div>

      <div className="detail-title-block">
        <span className={`color-notch color-${item.colorToken}`} aria-hidden="true" />
        <h2>{item.name}</h2>
      </div>

      <dl className="detail-specs">
        <div>
          <dt>Lane</dt>
          <dd>{item.lane === "Challenges Planned / Unplanned" ? "Curve balls" : item.lane}</dd>
        </div>
        <div>
          <dt>Placement</dt>
          <dd>{item.placement}</dd>
        </div>
        <div>
          <dt>Signal</dt>
          <dd>{COLOR_LABELS[item.colorToken]}</dd>
        </div>
      </dl>

      <section className="detail-section">
        <span className="eyebrow">Description</span>
        <p>{item.description}</p>
      </section>

      <section className="detail-section value-section">
        <span className="eyebrow">Value delivered</span>
        <p>{item.value}</p>
      </section>

      {item.relations.length > 0 && (
        <section className="detail-section relations-section">
          <div className="relations-heading">
            <span className="eyebrow">Connected work</span>
            <span>{item.relations.length} visible on timeline</span>
          </div>
          <div className="relation-list">
            {item.relations.map((relation) => {
              const target = allItems.find((entry) => entry.id === relation.targetId);
              const isActive = focusedRelation === relation.targetId;
              return (
                <div className="relation-entry" key={`${item.id}-${relation.targetId}`}>
                  <button
                    type="button"
                    className={`relation-chip color-${target?.colorToken ?? "graphite"} ${isActive ? "is-active" : ""}`}
                    onMouseEnter={() => setFocusedRelation(relation.targetId)}
                    onMouseLeave={() => setFocusedRelation(null)}
                    onFocus={() => setFocusedRelation(relation.targetId)}
                    onBlur={() => setFocusedRelation(null)}
                    onClick={() => setFocusedRelation(isActive ? null : relation.targetId)}
                  >
                    <span>{relation.targetName}</span>
                    <ArrowUpRight size={13} />
                  </button>
                  <p>{relation.description}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <button className="detail-media" type="button" onClick={onPreview} aria-label="Open media preview">
        {item.media ? (
          item.media.type === "video" ? (
            <video src={item.media.url} muted playsInline preload="metadata" />
          ) : (
            <Image src={item.media.url} alt={item.media.alt} fill sizes="420px" unoptimized />
          )
        ) : (
          <MediaPlaceholder item={item} />
        )}
        <span className="preview-label"><Maximize2 size={13} /> Preview artifact</span>
      </button>
    </motion.aside>
  );
}

export function PublicTimeline({ data }: { data: PublicTimelineData }) {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedRelation, setFocusedRelation] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());

  const publicItems = data.items;
  const selectedItem = publicItems.find((item) => item.id === selectedId) ?? null;
  const relatedIds = useMemo(
    () => new Set(selectedItem?.relations.map((relation) => relation.targetId) ?? []),
    [selectedItem],
  );

  const laneData = useMemo(() => {
    return LANE_ORDER.map((lane) => {
      const items = publicItems.filter((item) => item.lane === lane && !item.planned);
      const assignment = assignRows(items);
      return {
        lane,
        displayName: data.lanes.find((entry) => entry.name === lane)?.displayName ?? lane,
        count: assignment.count,
        items: items.map((item) => ({ ...item, row: assignment.rows.get(item.id) ?? 0 })) as PositionedItem[],
      };
    });
  }, [data.lanes, publicItems]);

  const futureItems = publicItems.filter((item) => item.planned);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (previewOpen) setPreviewOpen(false);
      else {
        setSelectedId(null);
        setFocusedRelation(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  useLayoutEffect(() => {
    const updateLines = () => {
      if (!selectedItem || !canvasRef.current) {
        setConnections([]);
        return;
      }
      const source = itemRefs.current.get(selectedItem.id);
      if (!source) {
        setConnections([]);
        return;
      }

      const canvasRect = canvasRef.current.getBoundingClientRect();
      const sourceRect = source.getBoundingClientRect();
      const sourceCenterX = sourceRect.left - canvasRect.left + sourceRect.width / 2;
      const sourceCenterY = sourceRect.top - canvasRect.top + sourceRect.height / 2;

      const nextConnections = selectedItem.relations.flatMap((relation) => {
        const target = itemRefs.current.get(relation.targetId);
        if (!target) return [];
        const targetRect = target.getBoundingClientRect();
        const targetCenterX = targetRect.left - canvasRect.left + targetRect.width / 2;
        const targetCenterY = targetRect.top - canvasRect.top + targetRect.height / 2;
        const sameBand = Math.abs(targetCenterY - sourceCenterY) < 34;
        const movesDown = targetCenterY >= sourceCenterY;
        const sourceY = movesDown
          ? sourceRect.bottom - canvasRect.top + 2
          : sourceRect.top - canvasRect.top - 2;
        const targetY = movesDown
          ? targetRect.top - canvasRect.top - 2
          : targetRect.bottom - canvasRect.top + 2;
        const railY = sameBand
          ? Math.max(sourceRect.bottom, targetRect.bottom) - canvasRect.top + 8
          : sourceY + (targetY - sourceY) / 2;
        return [{
          id: `${selectedItem.id}-${relation.targetId}`,
          targetId: relation.targetId,
          path: `M ${sourceCenterX} ${sourceY} V ${railY} H ${targetCenterX} V ${targetY}`,
        }];
      });
      setConnections(nextConnections);
    };

    updateLines();
    window.addEventListener("resize", updateLines);
    const observer = new ResizeObserver(updateLines);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => {
      window.removeEventListener("resize", updateLines);
      observer.disconnect();
    };
  }, [selectedItem, laneData]);

  const handleCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget || (event.target as HTMLElement).closest("[data-gantt-background]")) {
      setSelectedId(null);
      setFocusedRelation(null);
    }
  };

  const selectItem = (item: PublicTimelineItem) => {
    setSelectedId(item.id);
    setFocusedRelation(null);
  };

  return (
    <main className="site-shell">
      <header className="masthead">
        <a className="wordmark" href="#top" aria-label="Magpie Dashboards timeline home">
          <span className="wordmark-mark">M/D</span>
          <span>Rico Garcia</span>
        </a>
        <div className="masthead-meta">
          <span>Principal product management</span>
          <span>Portfolio record / 2026</span>
        </div>
        <a className="edit-link" href="/edit">
          Owner access <ExternalLink size={13} />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-kicker"><span>[01]</span> Magpie Literacy / Platform Data</div>
        <h1>
          Rebuild the system.<br />
          <span>Restore the trust.</span>
        </h1>
        <div className="hero-bottom">
          <p>{data.meta.subtitle}. A nine-month record of product leadership across engineering, research, operations, and the curve balls in between to migrate all three dashboards, restore partner trust, and prepare the platform for K–8.</p>
          <dl className="hero-metrics">
            <div><dt>Window</dt><dd>09 months</dd></div>
            <div><dt>Work items</dt><dd>{publicItems.length}</dd></div>
            <div><dt>Role</dt><dd>Sole principal PM</dd></div>
          </dl>
        </div>
      </section>

      <section className="timeline-section" aria-labelledby="timeline-heading">
        <div className="section-heading">
          <div>
            <span className="index-mark">[02]</span>
            <h2 id="timeline-heading">The work, in motion</h2>
          </div>
          <div className="timeline-guide">
            <p>Hover to scan. Select a bar to open its record and trace every connected work item.</p>
            <div className="timeline-legend" aria-label="Color key">
              <span className="legend-title">Color key</span>
              {(Object.entries(COLOR_LABELS) as Array<[PublicTimelineItem["colorToken"], string]>).map(([color, label]) => (
                <span className="legend-entry" key={color}><i className={`color-${color}`} />{label}</span>
              ))}
            </div>
          </div>
        </div>

        <div className={`workbench ${selectedItem ? "has-detail" : ""}`}>
          <div className="timeline-scroll" onClick={handleCanvasClick}>
            <div className="timeline-canvas" ref={canvasRef} data-gantt-background>
              <div className="phase-row">
                <div className="axis-spacer"><span>Phase</span></div>
                <div className="phase-track">
                  {PHASES.map((phase, index) => (
                    <div className="phase" key={phase.label} style={{ gridColumn: `${phase.start + 1} / span ${phase.span}` }}>
                      <span>[0{index + 1}]</span>{phase.label}
                    </div>
                  ))}
                </div>
                <div className="future-axis">Q4 / PLANNED</div>
              </div>

              <div className="month-row">
                <div className="axis-spacer"><span>2026 / Timeline</span></div>
                <div className="month-track">
                  {MONTHS.slice(0, 9).map((month, index) => (
                    <div className="month" key={month}>
                      <span>{month}</span><small>{String(index + 1).padStart(2, "0")}</small>
                    </div>
                  ))}
                </div>
                <div className="future-axis">OCT—DEC</div>
              </div>

              <div className="timeline-body">
                <div className="lane-stack" data-gantt-background>
                  {laneData.map((lane, laneIndex) => (
                    <section
                      className={`lane-row lane-${laneIndex + 1}`}
                      key={lane.lane}
                      style={{ "--lane-height": `${lane.count * 29 + 12}px`, "--lane-index": laneIndex } as CSSProperties}
                    >
                      <div className="lane-label" data-gantt-background>
                        <span className="lane-code">{LANE_CODES[lane.lane]}</span>
                        <strong>{lane.displayName}</strong>
                        <small>{String(lane.items.length).padStart(2, "0")} items</small>
                      </div>
                      <div className="lane-track" data-gantt-background>
                        <div className="month-grid" data-gantt-background>
                          {MONTHS.slice(0, 9).map((month) => <span key={month} data-gantt-background />)}
                        </div>
                        {lane.items.map((item) => {
                          const isSelected = selectedId === item.id;
                          const isRelated = relatedIds.has(item.id);
                          const isFocused = focusedRelation === item.id;
                          const isMuted = Boolean(focusedRelation) && !isFocused && !isSelected;
                          const style = {
                            "--item-left": `${(item.start / 9) * 100}%`,
                            "--item-width": `${(placementSpan(item.start, item.end) / 9) * 100}%`,
                            "--item-row": item.row,
                          } as CSSProperties;
                          return (
                            <motion.button
                              ref={(node) => {
                                if (node) itemRefs.current.set(item.id, node);
                                else itemRefs.current.delete(item.id);
                              }}
                              layout={!reduceMotion}
                              type="button"
                              key={item.id}
                              className={`timeline-item color-${item.colorToken} ${isSelected ? "is-selected" : ""} ${isRelated ? "is-related" : ""} ${isFocused ? "is-relation-focus" : ""} ${isMuted ? "is-muted" : ""}`}
                              style={style}
                              onClick={(event) => {
                                event.stopPropagation();
                                selectItem(item);
                              }}
                              aria-pressed={isSelected}
                              aria-label={`${item.name}, ${item.placement}`}
                              title={item.name}
                            >
                              <span className="item-name">{item.name}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>

                <aside className="future-rail" aria-label="In-flight and future work">
                  <div className="future-rail-intro">
                    <span className="index-mark">[06]</span>
                    <h3>Q4 groundwork</h3>
                    <p>Planned. Not yet placed.</p>
                  </div>
                  <div className="future-list">
                    {futureItems.map((item, index) => {
                      const isSelected = selectedId === item.id;
                      const isRelated = relatedIds.has(item.id);
                      const isFocused = focusedRelation === item.id;
                      const isMuted = Boolean(focusedRelation) && !isFocused && !isSelected;
                      return (
                        <button
                          ref={(node) => {
                            if (node) itemRefs.current.set(item.id, node);
                            else itemRefs.current.delete(item.id);
                          }}
                          className={`future-item color-${item.colorToken} ${isSelected ? "is-selected" : ""} ${isRelated ? "is-related" : ""} ${isFocused ? "is-relation-focus" : ""} ${isMuted ? "is-muted" : ""}`}
                          type="button"
                          key={item.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            selectItem(item);
                          }}
                        >
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>{item.name}</strong>
                          <ArrowUpRight size={13} />
                        </button>
                      );
                    })}
                  </div>
                </aside>
              </div>

              <svg className="connection-layer" aria-hidden="true">
                {connections.map((connection) => (
                  <motion.path
                    key={connection.id}
                    className={`${focusedRelation === connection.targetId ? "is-focused" : ""} ${focusedRelation && focusedRelation !== connection.targetId ? "is-dimmed" : ""}`}
                    d={connection.path}
                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.35 }}
                  />
                ))}
              </svg>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedItem && (
              <DetailPanel
                key={selectedItem.id}
                item={selectedItem}
                allItems={publicItems}
                focusedRelation={focusedRelation}
                setFocusedRelation={setFocusedRelation}
                onClose={() => {
                  setSelectedId(null);
                  setFocusedRelation(null);
                }}
                onPreview={() => setPreviewOpen(true)}
              />
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="outcome-strip">
        <div><span className="index-mark">[03]</span><strong>Build the foundation</strong><p>Moved reporting from a brittle monolith toward a governed, testable architecture.</p></div>
        <div><span className="index-mark">[04]</span><strong>Make the work legible</strong><p>Connected product decisions, customer evidence, operations, and technical delivery.</p></div>
        <div><span className="index-mark">[05]</span><strong>Prepare for scale</strong><p>Turned stabilization work into the runway for K–8, self-service research, and Q4 growth.</p></div>
      </section>

      <footer>
        <span>{data.meta.owner} / {data.meta.period}</span>
        <span>Product leadership case record</span>
      </footer>

      <CoordinateCursor />

      <AnimatePresence>
        {previewOpen && selectedItem && (
          <motion.div
            className="preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setPreviewOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`Media preview for ${selectedItem.name}`}
          >
            <button className="preview-close" type="button" onClick={() => setPreviewOpen(false)} aria-label="Close media preview">
              <X size={18} />
            </button>
            <motion.div
              className="preview-content"
              initial={reduceMotion ? false : { scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { scale: 0.96, y: 12 }}
              onMouseDown={(event) => event.stopPropagation()}
            >
              {selectedItem.media ? (
                selectedItem.media.type === "video" ? (
                  <video src={selectedItem.media.url} controls autoPlay />
                ) : (
                  <Image src={selectedItem.media.url} alt={selectedItem.media.alt} fill sizes="90vw" unoptimized />
                )
              ) : (
                <MediaPlaceholder item={selectedItem} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
