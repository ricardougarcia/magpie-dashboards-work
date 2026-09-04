"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Maximize2 } from "lucide-react";
import Image from "next/image";
import type { PublicTimelineItem } from "@/lib/timeline-types";

export const LANE_CODES: Record<string, string> = {
  "Eng Build": "ENG",
  "Product Build": "BLD",
  "Product Discovery": "DSC",
  Processes: "OPS",
  "Challenges Planned / Unplanned": "CRV",
};

export type TelemetryTab = "overview" | "connections";

export function TelemetryMediaPlaceholder({ item }: { item: PublicTimelineItem }) {
  return (
    <div className="media-placeholder" aria-label="Media not yet uploaded">
      <div className="media-placeholder-grid" aria-hidden="true" />
      <span className="eyebrow">Artifact pending</span>
      <strong>{item.name}</strong>
      <span className="media-placeholder-meta">MEDIA SLOT</span>
    </div>
  );
}

export function TelemetryAperture({
  item,
  allItems,
  mode,
  activeTab,
  setActiveTab,
  activeRelation,
  selectedRelation,
  setRelationPreview,
  toggleRelation,
  onPreview,
  setApertureNode,
}: {
  item: PublicTimelineItem;
  allItems: PublicTimelineItem[];
  mode: "hover" | "selected";
  activeTab: TelemetryTab;
  setActiveTab: (tab: TelemetryTab) => void;
  activeRelation: string | null;
  selectedRelation: string | null;
  setRelationPreview: (id: string | null) => void;
  toggleRelation: (id: string) => void;
  onPreview: () => void;
  setApertureNode: (node: HTMLElement | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const index = allItems.findIndex((entry) => entry.id === item.id) + 1;
  const laneName = item.lane === "Challenges Planned / Unplanned" ? "Curve balls" : item.lane;

  return (
    <motion.aside
      ref={setApertureNode}
      layout={!reduceMotion}
      className={`telemetry-aperture is-${mode}`}
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, x: 10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98, x: 8 }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
      aria-label={`${mode === "hover" ? "Preview" : "Selected details"} for ${item.name}`}
      aria-live="polite"
    >
      <span className="aperture-corner corner-nw" aria-hidden="true" />
      <span className="aperture-corner corner-se" aria-hidden="true" />
      <span className="aperture-scan-line" aria-hidden="true" />

      <div className="telemetry-head">
        <span>{mode === "hover" ? "Target acquired" : "Pinned record"}</span>
        <span>[{String(index).padStart(2, "0")}] / {LANE_CODES[item.lane] ?? "Q4"}</span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mode === "hover" ? (
          <motion.div
            className="telemetry-hover-body"
            key={`hover-${item.id}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.14 }}
          >
            <div className="telemetry-hover-meta">
              <span>{laneName}</span>
            </div>
            <h2>{item.name}</h2>
            <p>{item.value || item.description}</p>
          </motion.div>
        ) : (
          <motion.div
            className="telemetry-selected-body"
            key={`selected-${item.id}`}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18, delay: reduceMotion ? 0 : 0.05 }}
          >
            <div className="telemetry-title-row">
              <span className={`telemetry-signal color-${item.colorToken}`} aria-hidden="true" />
              <div>
                <span>{laneName} / {item.placement}</span>
                <h2>{item.name}</h2>
              </div>
            </div>

            <div className="telemetry-tabs telemetry-tabs-compact" role="tablist" aria-label="Item detail sections">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "overview"}
                className={activeTab === "overview" ? "is-active" : ""}
                onClick={() => setActiveTab("overview")}
              >
                <span>01</span>Overview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "connections"}
                className={activeTab === "connections" ? "is-active" : ""}
                onClick={() => setActiveTab("connections")}
              >
                <span>02</span>Connected work<sup>{item.relations.length}</sup>
              </button>
            </div>

            <div className="telemetry-tab-panel">
              <AnimatePresence mode="wait" initial={false}>
                {activeTab === "overview" && (
                  <motion.div {...panelMotion(reduceMotion)} className="telemetry-overview" key="overview" role="tabpanel">
                    <section className="telemetry-context">
                      <span className="eyebrow">Context</span>
                      <p>{item.description}</p>
                    </section>
                    <section className="telemetry-value">
                      <span className="eyebrow">Value delivered</span>
                      <p>{item.value}</p>
                    </section>
                  </motion.div>
                )}
                {activeTab === "connections" && (
                  <motion.section {...panelMotion(reduceMotion)} key="connections" role="tabpanel">
                    <span className="eyebrow">Connected work</span>
                    {item.relations.length > 0 ? (
                      <div className="telemetry-relations">
                        {item.relations.map((relation) => {
                          const target = allItems.find((entry) => entry.id === relation.targetId);
                          const isActive = activeRelation === relation.targetId;
                          const isSelected = selectedRelation === relation.targetId;
                          return (
                            <div key={`${item.id}-${relation.targetId}`}>
                              <button
                                type="button"
                                className={`color-${target?.colorToken ?? "graphite"} ${isActive ? "is-active" : ""} ${isSelected ? "is-selected" : ""}`}
                                aria-pressed={isSelected}
                                onMouseEnter={() => setRelationPreview(relation.targetId)}
                                onMouseLeave={() => setRelationPreview(null)}
                                onFocus={() => setRelationPreview(relation.targetId)}
                                onBlur={() => setRelationPreview(null)}
                                onClick={() => toggleRelation(relation.targetId)}
                              >
                                <span>{relation.targetName}</span>
                                <ArrowUpRight size={12} />
                              </button>
                              <p>{relation.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="telemetry-empty">No explicit relationships recorded.</p>
                    )}
                  </motion.section>
                )}
              </AnimatePresence>
            </div>

            {item.media && (
              <button className="telemetry-media" type="button" onClick={onPreview} aria-label="Open media preview">
                <span className="telemetry-media-thumb">
                  {item.media.type === "video" ? (
                    <video src={item.media.url} muted playsInline preload="metadata" />
                  ) : (
                    <Image src={item.media.url} alt={item.media.alt} fill sizes="58px" unoptimized />
                  )}
                </span>
                <span><small>Artifact</small>{item.media.alt}</span>
                <Maximize2 size={13} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
}

function panelMotion(reduceMotion: boolean | null) {
  return {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: reduceMotion ? 0 : 0.14 },
  };
}
