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

const COLOR_LABELS: Record<PublicTimelineItem["colorToken"], string> = {
  graphite: "Discovery-led",
  signal: "Corrective",
  steel: "Reliability",
  umber: "Governance",
  forest: "Growth",
};

type PositionedItem = PublicTimelineItem & { row: number };
type Connection = { id: string; path: string };

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

function MediaPlaceholder({ item, compact = false }: { item: PublicTimelineItem; compact?: boolean }) {
  return (
    <div className={`media-placeholder ${compact ? "is-compact" : ""}`} aria-label="Media not yet uploaded">
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
  activeRelation,
  setActiveRelation,
  hoveredRelation,
  setHoveredRelation,
  onClose,
  onPreview,
}: {
  item: PublicTimelineItem;
  allItems: PublicTimelineItem[];
  activeRelation: string | null;
  setActiveRelation: (id: string | null) => void;
  hoveredRelation: string | null;
  setHoveredRelation: (id: string | null) => void;
  onClose: () => void;
  onPreview: () => void;
}) {
  const index = allItems.findIndex((entry) => entry.id === item.id) + 1;
  return (
    <motion.aside
      className="detail-panel"
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 18 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`Details for ${item.name}`}
    >
      <div className="detail-panel-head">
        <span className="index-mark">[{String(index).padStart(2, "0")}]</span>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Close details">
          <X size={16} />
        </button>
      </div>

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
        <span className="preview-label"><Maximize2 size={13} /> Preview</span>
      </button>

      <div className="detail-title-block">
        <span className={`color-notch color-${item.colorToken}`} aria-hidden="true" />
        <h2>{item.name}</h2>
      </div>

      <dl className="detail-specs">
        <div>
          <dt>Type</dt>
          <dd>{item.lane === "Challenges Planned / Unplanned" ? "Curve ball" : item.lane}</dd>
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
        <span className="eyebrow">Value</span>
        <p>{item.value}</p>
      </section>

      {item.relations.length > 0 && (
        <section className="detail-section relations-section">
          <span className="eyebrow">Relates to</span>
          <div className="relation-list">
            {item.relations.map((relation) => {
              const target = allItems.find((entry) => entry.id === relation.targetId);
              const isActive = activeRelation === relation.targetId || hoveredRelation === relation.targetId;
              return (
                <div className="relation-entry" key={`${item.id}-${relation.targetId}`}>
                  <button
                    type="button"
                    className={`relation-chip color-${target?.colorToken ?? "graphite"} ${isActive ? "is-active" : ""}`}
                    onMouseEnter={() => setHoveredRelation(relation.targetId)}
                    onMouseLeave={() => setHoveredRelation(null)}
                    onFocus={() => setHoveredRelation(relation.targetId)}
                    onBlur={() => setHoveredRelation(null)}
                    onClick={() => setActiveRelation(activeRelation === relation.targetId ? null : relation.targetId)}
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
    </motion.aside>
  );
}

export function PublicTimeline({ data }: { data: PublicTimelineData }) {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredRelation, setHoveredRelation] = useState<string | null>(null);
  const [activeRelation, setActiveRelation] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [coordinate, setCoordinate] = useState("X 0000 / M JAN / Y 000");
  const canvasRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());

  const publicItems = data.items;
  const displayId = selectedId ?? hoveredId;
  const displayItem = publicItems.find((item) => item.id === displayId) ?? null;
  const selectedItem = publicItems.find((item) => item.id === selectedId) ?? null;
  const relationTarget = hoveredRelation ?? activeRelation;

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
      else setSelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  useLayoutEffect(() => {
    const updateLines = () => {
      if (!selectedItem || !relationTarget || !canvasRef.current) {
        setConnections([]);
        return;
      }
      const source = itemRefs.current.get(selectedItem.id);
      const target = itemRefs.current.get(relationTarget);
      if (!source || !target) {
        setConnections([]);
        return;
      }
      const canvasRect = canvasRef.current.getBoundingClientRect();
      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const sourceCenter = {
        x: sourceRect.left - canvasRect.left + sourceRect.width / 2,
        y: sourceRect.top - canvasRect.top + sourceRect.height / 2,
      };
      const targetCenter = {
        x: targetRect.left - canvasRect.left + targetRect.width / 2,
        y: targetRect.top - canvasRect.top + targetRect.height / 2,
      };
      const direction = targetCenter.x >= sourceCenter.x ? 1 : -1;
      const startX = sourceCenter.x + direction * Math.min(sourceRect.width / 2, 34);
      const endX = targetCenter.x - direction * Math.min(targetRect.width / 2, 34);
      const middleX = startX + (endX - startX) / 2;
      setConnections([
        {
          id: `${selectedItem.id}-${relationTarget}`,
          path: `M ${startX} ${sourceCenter.y} H ${middleX} V ${targetCenter.y} H ${endX}`,
        },
      ]);
    };

    updateLines();
    window.addEventListener("resize", updateLines);
    const observer = new ResizeObserver(updateLines);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => {
      window.removeEventListener("resize", updateLines);
      observer.disconnect();
    };
  }, [selectedItem, relationTarget, laneData]);

  const handleCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget || (event.target as HTMLElement).closest("[data-gantt-background]")) {
      setSelectedId(null);
      setActiveRelation(null);
    }
  };

  const handlePointerReadout = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, event.clientX - rect.left);
    const y = Math.max(0, event.clientY - rect.top);
    const monthIndex = Math.min(8, Math.max(0, Math.floor(((x - 220) / 1080) * 9)));
    setCoordinate(`X ${String(Math.round(x)).padStart(4, "0")} / M ${MONTHS[monthIndex].toUpperCase()} / Y ${String(Math.round(y)).padStart(3, "0")}`);
  };

  const selectItem = (item: PublicTimelineItem) => {
    setSelectedId(item.id);
    setHoveredId(null);
    setActiveRelation(null);
    setHoveredRelation(null);
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
          <p>{data.meta.subtitle}. A nine-month record of product leadership across engineering, research, operations, and the curve balls in between.</p>
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
          <p>Select any bar for context. Hover or select a relationship to trace the system behind the work.</p>
        </div>

        <div className={`workbench ${displayItem ? "has-detail" : ""}`}>
          <div className="timeline-scroll" onClick={handleCanvasClick}>
            <div
              className="timeline-canvas"
              ref={canvasRef}
              onMouseMove={handlePointerReadout}
              data-gantt-background
            >
              <div className="coordinate-readout">{coordinate}</div>
              <div className="phase-row">
                <div className="axis-spacer"><span>Phase</span></div>
                <div className="phase-track">
                  {PHASES.map((phase, index) => (
                    <div
                      className="phase"
                      key={phase.label}
                      style={{ gridColumn: `${phase.start + 1} / span ${phase.span}` }}
                    >
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
                      className="lane-row"
                      key={lane.lane}
                      style={{ "--lane-height": `${lane.count * 45 + 24}px` } as CSSProperties}
                    >
                      <div className="lane-label" data-gantt-background>
                        <span className="index-mark">[{String(laneIndex + 1).padStart(2, "0")}]</span>
                        <strong>{lane.displayName}</strong>
                        <small>{lane.items.length} items</small>
                      </div>
                      <div className="lane-track" data-gantt-background>
                        <div className="month-grid" data-gantt-background>
                          {MONTHS.slice(0, 9).map((month) => <span key={month} data-gantt-background />)}
                        </div>
                        {lane.items.map((item) => {
                          const isSelected = selectedId === item.id;
                          const isRelated = relationTarget === item.id;
                          const isMuted = Boolean(relationTarget) && !isRelated && !isSelected;
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
                              className={`timeline-item color-${item.colorToken} ${isSelected ? "is-selected" : ""} ${isRelated ? "is-related" : ""} ${isMuted ? "is-muted" : ""}`}
                              style={style}
                              onMouseEnter={() => setHoveredId(item.id)}
                              onMouseLeave={() => setHoveredId(null)}
                              onFocus={() => setHoveredId(item.id)}
                              onBlur={() => setHoveredId(null)}
                              onClick={(event) => {
                                event.stopPropagation();
                                selectItem(item);
                              }}
                              aria-pressed={isSelected}
                              aria-label={`${item.name}, ${item.placement}`}
                            >
                              <span className="item-name">{item.name}</span>
                              <span className="item-placement">{item.placement.replace(" (ongoing)", "")}</span>
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
                    <h3>Groundwork for Q4</h3>
                    <p>Already planned. Not yet placed.</p>
                  </div>
                  <div className="future-list">
                    {futureItems.map((item, index) => {
                      const isSelected = selectedId === item.id;
                      const isRelated = relationTarget === item.id;
                      const isMuted = Boolean(relationTarget) && !isRelated && !isSelected;
                      return (
                        <button
                          ref={(node) => {
                            if (node) itemRefs.current.set(item.id, node);
                            else itemRefs.current.delete(item.id);
                          }}
                          className={`future-item color-${item.colorToken} ${isSelected ? "is-selected" : ""} ${isRelated ? "is-related" : ""} ${isMuted ? "is-muted" : ""}`}
                          type="button"
                          key={item.id}
                          onMouseEnter={() => setHoveredId(item.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onFocus={() => setHoveredId(item.id)}
                          onBlur={() => setHoveredId(null)}
                          onClick={(event) => {
                            event.stopPropagation();
                            selectItem(item);
                          }}
                        >
                          <span>{String(index + 1).padStart(2, "0")}</span>
                          <strong>{item.name}</strong>
                          <ArrowUpRight size={14} />
                        </button>
                      );
                    })}
                  </div>
                </aside>
              </div>

              <svg className="connection-layer" aria-hidden="true">
                <defs>
                  <marker id="relation-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                    <path d="M 0 0 L 7 3.5 L 0 7 z" />
                  </marker>
                </defs>
                {connections.map((connection) => (
                  <motion.path
                    key={connection.id}
                    d={connection.path}
                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.35 }}
                    markerEnd="url(#relation-arrow)"
                  />
                ))}
              </svg>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {displayItem && (
              <DetailPanel
                key={displayItem.id}
                item={displayItem}
                allItems={publicItems}
                activeRelation={activeRelation}
                setActiveRelation={setActiveRelation}
                hoveredRelation={hoveredRelation}
                setHoveredRelation={setHoveredRelation}
                onClose={() => {
                  setSelectedId(null);
                  setHoveredId(null);
                  setActiveRelation(null);
                  setHoveredRelation(null);
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

      <AnimatePresence>
        {previewOpen && displayItem && (
          <motion.div
            className="preview-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={() => setPreviewOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`Media preview for ${displayItem.name}`}
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
              {displayItem.media ? (
                displayItem.media.type === "video" ? (
                  <video src={displayItem.media.url} controls autoPlay />
                ) : (
                  <Image src={displayItem.media.url} alt={displayItem.media.alt} fill sizes="90vw" unoptimized />
                )
              ) : (
                <MediaPlaceholder item={displayItem} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
