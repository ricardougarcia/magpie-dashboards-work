"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ExternalLink, X } from "lucide-react";
import Image from "next/image";
import {
  type ChangeEvent as ReactChangeEvent,
  type CSSProperties,
  type FocusEvent as ReactFocusEvent,
  type MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PanelReplacement } from "@/components/panel-replacement";
import { CoordinateCursor } from "@/components/coordinate-cursor";
import { GuidingLightInkTrail } from "@/components/guiding-light-ink-trail";
import {
  LANE_CODES,
  TelemetryAperture,
  TelemetryMediaPlaceholder,
  type TelemetryTab,
} from "@/components/telemetry-aperture";
import { guidingLightTetherGeometry } from "@/lib/guiding-light-tethers";
import { connectorForRelation } from "@/lib/connector-parity";
import {
  connectorPath,
  createDefaultConnector,
  resolveConnectorPoints,
  type ConnectorRect,
} from "@/lib/orthogonal-connectors";
import { TELEMETRY_TETHER_DURATION, telemetryTetherGeometry } from "@/lib/telemetry-tether";
import { assignTimelineRows } from "@/lib/timeline-layout";
import { GUIDING_LIGHTS, MONTHS, placementSpan, type GuidingLight, type PublicTimelineData, type PublicTimelineItem } from "@/lib/timeline-types";

const LANE_ORDER = [
  "Eng Build",
  "Product Build",
  "Product Discovery",
  "Processes",
  "Challenges Planned / Unplanned",
];

const PIXEL_TONES = ["#111311", "#191b19", "#2b2d2b", "#3d3f3d"] as const;

function seededUnit(index: number, seed: number, salt: number) {
  let value = Math.imul(index + 1 + salt * 97, 0x9e3779b1) ^ Math.imul(seed + 11, 0x5f356495);
  value ^= value >>> 16;
  value = Math.imul(value, 0x85ebca6b);
  value ^= value >>> 13;
  return (value >>> 0) / 0xffffffff;
}

function createPixelField(seed: number) {
  return Array.from({ length: 256 }, (_, index) => {
    const column = index % 16;
    return {
      index,
      delayIn: Math.round(column * 34 + seededUnit(index, seed, 1) * 190),
      durationIn: Math.round(190 + seededUnit(index, seed, 2) * 260),
      delayOut: Math.round((15 - column) * 24 + seededUnit(index, seed, 3) * 130),
      durationOut: Math.round(150 + seededUnit(index, seed, 4) * 170),
      tone: PIXEL_TONES[Math.floor(seededUnit(index, seed, 5) * PIXEL_TONES.length)],
    };
  });
}

const PIXEL_FIELDS = Array.from({ length: 6 }, (_, seed) => createPixelField(seed));

type PositionedItem = PublicTimelineItem & { row: number };
type Connection = { id: string; targetId: string; path: string };
type GuidingLightTether = { id: string; path: string };
type TelemetrySide = "left" | "right";

export function PublicTimeline({ data }: { data: PublicTimelineData }) {
  const reduceMotion = useReducedMotion();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedRelation, setFocusedRelation] = useState<string | null>(null);
  const [selectedRelation, setSelectedRelation] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TelemetryTab>("overview");
  const [telemetrySide, setTelemetrySide] = useState<TelemetrySide>("right");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeGuidingLight, setActiveGuidingLight] = useState<GuidingLight | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [guidingLightTethers, setGuidingLightTethers] = useState<GuidingLightTether[]>([]);
  const [tetherPath, setTetherPath] = useState<string | null>(null);
  const [apertureNode, setApertureNode] = useState<HTMLElement | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState({ progress: 0, viewport: 1, canScroll: false });
  const canvasRef = useRef<HTMLDivElement>(null);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const apertureRef = useRef<HTMLElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const guidingLightRefs = useRef(new Map<GuidingLight, HTMLButtonElement>());
  const guidingLightTrackRef = useRef<HTMLDivElement>(null);

  const publicItems = data.items;
  const selectedItem = publicItems.find((item) => item.id === selectedId) ?? null;
  const hoveredItem = publicItems.find((item) => item.id === hoveredId) ?? null;
  const displayItem = hoveredItem ?? selectedItem;
  const telemetryMode = selectedItem && (!hoveredItem || hoveredItem.id === selectedItem.id) ? "selected" : "hover";
  const activeLane = displayItem?.lane ?? null;
  const activeRelation = focusedRelation ?? selectedRelation;
  const relatedIds = new Set(selectedItem?.relations.map((relation) => relation.targetId) ?? []);
  const guidingMatchIds = new Set(activeGuidingLight
    ? publicItems.filter((item) => item.guidingLights.includes(activeGuidingLight)).map((item) => item.id)
    : []);

  const laneData = useMemo(() => {
    return LANE_ORDER.map((lane) => {
      const items = publicItems.filter((item) => item.lane === lane && !item.planned);
      const assignment = assignTimelineRows(items);
      return {
        lane,
        displayName: data.lanes.find((entry) => entry.name === lane)?.displayName ?? lane,
        count: Math.max(1, assignment.count),
        items: items.map((item) => ({ ...item, row: assignment.rows.get(item.id) ?? 0 })) as PositionedItem[],
      };
    });
  }, [data.lanes, publicItems]);

  const futureItems = publicItems.filter((item) => item.planned);

  useLayoutEffect(() => {
    const scrollNode = timelineScrollRef.current;
    if (!scrollNode) return;
    let frame: number | null = null;
    const updateMetrics = () => {
      const maxScroll = Math.max(0, scrollNode.scrollWidth - scrollNode.clientWidth);
      const progress = maxScroll > 0 ? scrollNode.scrollLeft / maxScroll : 0;
      const viewport = scrollNode.scrollWidth > 0 ? scrollNode.clientWidth / scrollNode.scrollWidth : 1;
      const next = {
        progress: Math.min(1, Math.max(0, Math.round(progress * 10000) / 10000)),
        viewport: Math.min(1, Math.max(0.08, Math.round(viewport * 10000) / 10000)),
        canScroll: maxScroll > 1,
      };
      setScrollMetrics((current) => (
        current.progress === next.progress && current.viewport === next.viewport && current.canScroll === next.canScroll
          ? current
          : next
      ));
    };
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        updateMetrics();
      });
    };

    updateMetrics();
    scrollNode.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(scrollNode);
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      scrollNode.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      observer.disconnect();
    };
  }, []);

  const setTimelineProgress = (event: ReactChangeEvent<HTMLInputElement>) => {
    const scrollNode = timelineScrollRef.current;
    if (!scrollNode) return;
    const maxScroll = Math.max(0, scrollNode.scrollWidth - scrollNode.clientWidth);
    scrollNode.scrollLeft = (Number(event.currentTarget.value) / 1000) * maxScroll;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (previewOpen) setPreviewOpen(false);
      else {
        setHoveredId(null);
        setSelectedId(null);
        setFocusedRelation(null);
        setSelectedRelation(null);
        setActiveGuidingLight(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewOpen]);

  useEffect(() => {
    if ((!selectedId && !hoveredId) || previewOpen) return;
    const dismissOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || apertureRef.current?.contains(target)) return;
      if (target.closest("[data-timeline-item]")) return;
      setHoveredId(null);
      setSelectedId(null);
      setFocusedRelation(null);
      setSelectedRelation(null);
    };
    document.addEventListener("pointerdown", dismissOnOutsidePointer, true);
    return () => document.removeEventListener("pointerdown", dismissOnOutsidePointer, true);
  }, [hoveredId, selectedId, previewOpen]);

  useEffect(() => {
    if (!activeGuidingLight) return;
    const dismissGuidingLightFocus = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest("[data-guiding-light]")) return;
      setActiveGuidingLight(null);
    };
    document.addEventListener("pointerdown", dismissGuidingLightFocus, true);
    return () => document.removeEventListener("pointerdown", dismissGuidingLightFocus, true);
  }, [activeGuidingLight]);

  useEffect(() => {
    const clearTransientPreview = () => setHoveredId(null);
    const clearHiddenPreview = () => {
      if (document.visibilityState === "hidden") clearTransientPreview();
    };
    window.addEventListener("blur", clearTransientPreview);
    window.addEventListener("resize", clearTransientPreview);
    window.addEventListener("scroll", clearTransientPreview, true);
    document.documentElement.addEventListener("pointerleave", clearTransientPreview);
    document.addEventListener("visibilitychange", clearHiddenPreview);
    return () => {
      window.removeEventListener("blur", clearTransientPreview);
      window.removeEventListener("resize", clearTransientPreview);
      window.removeEventListener("scroll", clearTransientPreview, true);
      document.documentElement.removeEventListener("pointerleave", clearTransientPreview);
      document.removeEventListener("visibilitychange", clearHiddenPreview);
    };
  }, []);

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
      const relativeRect = (rect: DOMRect): ConnectorRect => ({
        left: rect.left - canvasRect.left,
        top: rect.top - canvasRect.top,
        width: rect.width,
        height: rect.height,
      });
      const sourceConnectorRect = relativeRect(sourceRect);
      const nextConnections = selectedItem.relations.flatMap((relation) => {
        const target = itemRefs.current.get(relation.targetId);
        if (!target) return [];
        const targetRect = target.getBoundingClientRect();
        const targetConnectorRect = relativeRect(targetRect);
        const route = connectorForRelation(data, selectedItem.id, relation)
          ?? createDefaultConnector(sourceConnectorRect, targetConnectorRect);
        const points = resolveConnectorPoints(route, sourceConnectorRect, targetConnectorRect);
        return [{
          id: `${selectedItem.id}-${relation.targetId}`,
          targetId: relation.targetId,
          path: connectorPath(points),
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
  }, [data, selectedItem, laneData]);

  useLayoutEffect(() => {
    if (!activeGuidingLight || !canvasRef.current) {
      const frame = window.requestAnimationFrame(() => setGuidingLightTethers([]));
      return () => window.cancelAnimationFrame(frame);
    }

    const cell = guidingLightRefs.current.get(activeGuidingLight);
    if (!cell) {
      const frame = window.requestAnimationFrame(() => setGuidingLightTethers([]));
      return () => window.cancelAnimationFrame(frame);
    }

    let frame: number | null = null;
    const matchingItems = publicItems
      .filter((item) => item.guidingLights.includes(activeGuidingLight))
      .flatMap((item) => {
        const node = itemRefs.current.get(item.id);
        return node ? [{ item, node }] : [];
      });
    const updateTethers = () => {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;
      const cellRect = cell.getBoundingClientRect();
      const nextTethers = matchingItems.map(({ item, node }, index) => ({
        id: `${activeGuidingLight}-${item.id}`,
        path: guidingLightTetherGeometry(
          cellRect,
          node.getBoundingClientRect(),
          canvasRect,
          index,
          matchingItems.length,
        ).path,
      }));
      setGuidingLightTethers(nextTethers);
    };
    const scheduleUpdate = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        updateTethers();
      });
    };

    updateTethers();
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(cell);
    if (canvasRef.current) observer.observe(canvasRef.current);
    matchingItems.forEach(({ node }) => observer.observe(node));
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [activeGuidingLight, publicItems]);

  useLayoutEffect(() => {
    if (!selectedItem || !apertureNode) {
      const frame = window.requestAnimationFrame(() => setTetherPath(null));
      return () => window.cancelAnimationFrame(frame);
    }

    const source = itemRefs.current.get(selectedItem.id);
    if (!source) {
      const frame = window.requestAnimationFrame(() => setTetherPath(null));
      return () => window.cancelAnimationFrame(frame);
    }

    let trackingFrame: number | null = null;
    let settleFrame: number | null = null;
    const settleUntil = performance.now() + 650;
    const updateTether = () => {
      const sourceRect = source.getBoundingClientRect();
      const modalRect = apertureNode.getBoundingClientRect();
      if (sourceRect.width === 0 || sourceRect.height === 0 || modalRect.width === 0 || modalRect.height === 0) {
        setTetherPath(null);
        return;
      }
      setTetherPath(telemetryTetherGeometry(sourceRect, modalRect).path);
    };
    const scheduleUpdate = () => {
      if (trackingFrame !== null) return;
      trackingFrame = window.requestAnimationFrame(() => {
        trackingFrame = null;
        updateTether();
      });
    };
    const trackEntrance = () => {
      updateTether();
      if (performance.now() < settleUntil) settleFrame = window.requestAnimationFrame(trackEntrance);
    };

    settleFrame = window.requestAnimationFrame(trackEntrance);
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(source);
    observer.observe(apertureNode);
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("scroll", scheduleUpdate, true);
    return () => {
      if (trackingFrame !== null) window.cancelAnimationFrame(trackingFrame);
      if (settleFrame !== null) window.cancelAnimationFrame(settleFrame);
      observer.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate, true);
    };
  }, [selectedItem, apertureNode, telemetrySide, activeTab]);

  const registerApertureNode = useCallback((node: HTMLElement | null) => {
    apertureRef.current = node;
    setApertureNode(node);
  }, []);

  const setSideFromElement = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setTelemetrySide(rect.left + rect.width / 2 > window.innerWidth / 2 ? "left" : "right");
  };

  const previewItem = (item: PublicTimelineItem, element: HTMLElement) => {
    if (selectedItem || activeGuidingLight) return;
    setHoveredId(item.id);
    setSideFromElement(element);
  };

  const clearPreview = () => {
    setHoveredId(null);
    if (!selectedItem) return;
    const selectedNode = itemRefs.current.get(selectedItem.id);
    if (selectedNode) setSideFromElement(selectedNode);
  };

  const handleFocusPreview = (item: PublicTimelineItem, event: ReactFocusEvent<HTMLElement>) => {
    previewItem(item, event.currentTarget);
  };

  const handleCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-guiding-light]")) return;
    if (event.target === event.currentTarget || target.closest("[data-gantt-background]")) {
      setHoveredId(null);
      setSelectedId(null);
      setFocusedRelation(null);
      setSelectedRelation(null);
      setActiveGuidingLight(null);
    }
  };

  const selectItem = (item: PublicTimelineItem, element: HTMLElement) => {
    setSideFromElement(element);
    setSelectedId(item.id);
    setHoveredId(null);
    setActiveGuidingLight(null);
    setActiveTab("overview");
    setFocusedRelation(null);
    setSelectedRelation(null);
  };

  const selectGuidingLight = (guidingLight: GuidingLight) => {
    setActiveGuidingLight((current) => current === guidingLight ? null : guidingLight);
    setHoveredId(null);
    setSelectedId(null);
    setFocusedRelation(null);
    setSelectedRelation(null);
    setPreviewOpen(false);
  };

  const toggleRelation = (relationId: string) => {
    setSelectedRelation((current) => current === relationId ? null : relationId);
  };

  return (
    <main className="site-shell">
      <header className="masthead" data-panel="0">
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

      <PanelReplacement outgoing={
        <section className="hero" id="top" data-panel="1">
          <div data-panel-content>
            <div className="hero-kicker"><span>[01]</span> Magpie Literacy / Platform Data</div>
            <h1>
              Rebuild the system.<br />
              <span>Restore the trust.</span>
            </h1>
            <div className="hero-bottom">
              <p className="hero-summary">{data.meta.subtitle}. A nine-month record of product leadership across engineering, research, operations, and the curve balls in between to migrate all three dashboards, restore partner trust, and prepare the platform for K–8.</p>
              <dl className="hero-metrics" data-panel-part="tri-shelf">
                <div><dt>Window</dt><dd>09 months</dd></div>
                <div><dt>Work items</dt><dd>{publicItems.length}</dd></div>
                <div><dt>Role</dt><dd>Principal Product Manager</dd></div>
              </dl>
            </div>
          </div>
        </section>
      }>
      <section className="timeline-section" aria-labelledby="timeline-heading" data-panel="2">
        <div className="section-heading">
          <div>
            <span className="index-mark">[02]</span>
            <h2 id="timeline-heading">The work, in motion</h2>
          </div>

        </div>

        <div className="workbench">
          <div
            className="timeline-scroll-shell"
            data-scrollable={scrollMetrics.canScroll ? "true" : "false"}
            data-scrolled={scrollMetrics.progress > 0.006 ? "true" : "false"}
          >
            <div
              className="timeline-scroll-rail"
              aria-label="Timeline horizontal scroll position"
              style={{
                "--scroll-viewport": `${scrollMetrics.viewport * 100}%`,
                "--scroll-progress": scrollMetrics.progress,
              } as CSSProperties}
            >
              <span className="timeline-scroll-label">Scroll</span>
              <div className="timeline-scroll-control">
                <div className="timeline-scroll-window" aria-hidden="true" />
                <input
                  className="timeline-scroll-range"
                  type="range"
                  min="0"
                  max="1000"
                  step="1"
                  value={Math.round(scrollMetrics.progress * 1000)}
                  onChange={setTimelineProgress}
                  disabled={!scrollMetrics.canScroll}
                  aria-label="Scroll the timeline horizontally"
                  aria-controls="portfolio-timeline-scroll"
                  aria-valuetext={`${Math.round(scrollMetrics.progress * 100)} percent`}
                />
                <div className="timeline-scroll-months" aria-hidden="true">
                  <span>JAN</span><span>MAY</span><span>SEP</span>
                </div>
              </div>
              <span className="timeline-scroll-percent">{String(Math.round(scrollMetrics.progress * 100)).padStart(2, "0")}%</span>
            </div>
            <div className="timeline-depth-veil" aria-hidden="true" />
            <div id="portfolio-timeline-scroll" ref={timelineScrollRef} className="timeline-scroll" data-gantt-region onClick={handleCanvasClick}>
            <div className="timeline-canvas" ref={canvasRef} data-gantt-background>
              <div className="phase-row guiding-light-row">
                <div className="axis-spacer"><span>Guiding Light</span></div>
                <div ref={guidingLightTrackRef} className="guiding-light-track" role="group" aria-label="Focus timeline by Guiding Light">
                  <GuidingLightInkTrail trackRef={guidingLightTrackRef} disabled={Boolean(reduceMotion)} />
                  {GUIDING_LIGHTS.map((guidingLight, index) => (
                    <button
                      ref={(node) => {
                        if (node) guidingLightRefs.current.set(guidingLight, node);
                        else guidingLightRefs.current.delete(guidingLight);
                      }}
                      type="button"
                      className={`guiding-light-cell ${activeGuidingLight === guidingLight ? "is-active" : ""}`}
                      key={guidingLight}
                      data-guiding-light={guidingLight}
                      aria-pressed={activeGuidingLight === guidingLight}
                      onClick={() => selectGuidingLight(guidingLight)}
                    >
                      <span className="guiding-light-index">[0{index + 1}]</span>
                      <span className="guiding-light-name">{guidingLight}</span>
                    </button>
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
                  {laneData.map((lane, laneIndex) => {
                    const isLaneActive = activeLane === lane.lane;
                    return (
                      <section
                        className={`lane-row lane-${laneIndex + 1} ${isLaneActive ? "is-lane-active" : ""}`}
                        key={lane.lane}
                        style={{ "--lane-height": `${lane.count * 29 + 12}px`, "--lane-index": laneIndex } as CSSProperties}
                      >
                        <div className="lane-label" data-gantt-background>
                          <div className="lane-pixel-field" aria-hidden="true">
                            {PIXEL_FIELDS[laneIndex].map((pixel) => (
                              <span
                                key={pixel.index}
                                style={{
                                  "--pixel-in": `${pixel.delayIn}ms`,
                                  "--pixel-in-duration": `${pixel.durationIn}ms`,
                                  "--pixel-out": `${pixel.delayOut}ms`,
                                  "--pixel-out-duration": `${pixel.durationOut}ms`,
                                  "--pixel-tone": pixel.tone,
                                } as CSSProperties}
                              />
                            ))}
                          </div>
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
                            const isHovered = hoveredId === item.id;
                            const isRelated = relatedIds.has(item.id);
                            const isFocused = activeRelation === item.id;
                            const isGuidingMatch = guidingMatchIds.has(item.id);
                            const isMuted = activeGuidingLight
                              ? !isGuidingMatch
                              : Boolean(selectedItem) && (activeRelation
                                ? !isSelected && !isFocused
                                : !isSelected && !isRelated);
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
                                className={`timeline-item color-${item.colorToken} ${isSelected ? "is-selected" : ""} ${isHovered ? "is-hovered" : ""} ${isRelated ? "is-related" : ""} ${isFocused ? "is-relation-focus" : ""} ${isGuidingMatch ? "is-guiding-match" : ""} ${isMuted ? "is-muted" : ""}`}
                                style={style}
                                onPointerEnter={(event) => {
                                  if (event.pointerType !== "touch") previewItem(item, event.currentTarget);
                                }}
                                onPointerLeave={(event) => {
                                  if (event.pointerType !== "touch") clearPreview();
                                }}
                                onFocus={(event) => handleFocusPreview(item, event)}
                                onBlur={clearPreview}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  selectItem(item, event.currentTarget);
                                }}
                                data-timeline-item
                                aria-pressed={isSelected}
                                aria-label={`${item.name}, ${item.placement}`}
                              >
                                <span className="item-name">{item.name}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </section>
                    );
                  })}
                </div>

                <aside className={`future-rail ${activeLane && !LANE_ORDER.includes(activeLane) ? "is-lane-active" : ""}`} aria-label="In-flight and future work">
                  <div className="future-rail-intro">
                    <div className="lane-pixel-field" aria-hidden="true">
                      {PIXEL_FIELDS[5].map((pixel) => (
                        <span
                          key={pixel.index}
                          style={{
                            "--pixel-in": `${pixel.delayIn}ms`,
                            "--pixel-in-duration": `${pixel.durationIn}ms`,
                            "--pixel-out": `${pixel.delayOut}ms`,
                            "--pixel-out-duration": `${pixel.durationOut}ms`,
                            "--pixel-tone": pixel.tone,
                          } as CSSProperties}
                        />
                      ))}
                    </div>
                    <span className="index-mark">[06]</span>
                    <h3>Q4 groundwork</h3>
                    <p>Planned</p>
                  </div>
                  <div className="future-list">
                    {futureItems.map((item, index) => {
                      const isSelected = selectedId === item.id;
                      const isHovered = hoveredId === item.id;
                      const isRelated = relatedIds.has(item.id);
                      const isFocused = activeRelation === item.id;
                      const isGuidingMatch = guidingMatchIds.has(item.id);
                      const isMuted = activeGuidingLight
                        ? !isGuidingMatch
                        : Boolean(selectedItem) && (activeRelation
                          ? !isSelected && !isFocused
                          : !isSelected && !isRelated);
                      return (
                        <button
                          ref={(node) => {
                            if (node) itemRefs.current.set(item.id, node);
                            else itemRefs.current.delete(item.id);
                          }}
                          className={`future-item color-${item.colorToken} ${isSelected ? "is-selected" : ""} ${isHovered ? "is-hovered" : ""} ${isRelated ? "is-related" : ""} ${isFocused ? "is-relation-focus" : ""} ${isGuidingMatch ? "is-guiding-match" : ""} ${isMuted ? "is-muted" : ""}`}
                          type="button"
                          data-timeline-item
                          key={item.id}
                          aria-pressed={isSelected}
                          aria-label={`${item.name}, ${item.placement}`}
                          onPointerEnter={(event) => {
                            if (event.pointerType !== "touch") previewItem(item, event.currentTarget);
                          }}
                          onPointerLeave={(event) => {
                            if (event.pointerType !== "touch") clearPreview();
                          }}
                          onFocus={(event) => handleFocusPreview(item, event)}
                          onBlur={clearPreview}
                          onClick={(event) => {
                            event.stopPropagation();
                            selectItem(item, event.currentTarget);
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

              <svg className="guiding-light-tether-layer" aria-hidden="true">
                {activeGuidingLight && guidingLightTethers.map((tether, index) => (
                  <motion.path
                    key={tether.id}
                    d={tether.path}
                    initial={reduceMotion ? { opacity: 0.42 } : { pathLength: 0, opacity: 0 }}
                    animate={reduceMotion ? { opacity: 0 } : { pathLength: 1, opacity: [0, 0.52, 0] }}
                    transition={reduceMotion
                      ? { duration: 0.18 }
                      : { duration: TELEMETRY_TETHER_DURATION, times: [0, 0.58, 1], delay: index * 0.035 }}
                  />
                ))}
              </svg>

              <svg className="connection-layer" aria-hidden="true">
                {connections.map((connection) => (
                  <motion.path
                    key={connection.id}
                    className={`${activeRelation === connection.targetId ? "is-focused" : ""} ${activeRelation && activeRelation !== connection.targetId ? "is-dimmed" : ""}`}
                    d={connection.path}
                    initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: reduceMotion ? 0 : 0.35 }}
                  />
                ))}
              </svg>
            </div>
            </div>
          </div>
        </div>
      </section>

      <section className="outcome-strip">
        <div data-panel="3"><span className="index-mark">[03]</span><strong>Build the foundation</strong><p>Moved reporting from a brittle monolith toward a governed, testable architecture.</p></div>
        <div data-panel="4"><span className="index-mark">[04]</span><strong>Make the work legible</strong><p>Connected product decisions, customer evidence, operations, and technical delivery.</p></div>
        <div data-panel="5"><span className="index-mark">[05]</span><strong>Prepare for scale</strong><p>Turned stabilization work into the runway for K–8, self-service research, and Q4 growth.</p></div>
      </section>

      <footer>
        <span>{data.meta.owner} / {data.meta.period}</span>
        <span>Product leadership case record</span>
      </footer>
      </PanelReplacement>

      <div className={`telemetry-anchor side-${telemetrySide}`}>
        <AnimatePresence mode="wait">
          {displayItem && (
            <TelemetryAperture
              key={`${telemetryMode}-${displayItem.id}`}
              item={displayItem}
              allItems={publicItems}
              mode={telemetryMode}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              activeRelation={activeRelation}
              selectedRelation={selectedRelation}
              setRelationPreview={setFocusedRelation}
              toggleRelation={toggleRelation}
              onPreview={() => setPreviewOpen(true)}
              setApertureNode={registerApertureNode}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedItem && tetherPath && (
          <motion.svg className="telemetry-tether" aria-hidden="true">
            <motion.path
              key={selectedItem.id}
              d={tetherPath}
              initial={reduceMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
              animate={reduceMotion ? { opacity: 0 } : { pathLength: 1, opacity: [0, 0.72, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: TELEMETRY_TETHER_DURATION, times: [0, 0.6, 1], ease: [0.22, 1, 0.36, 1] }}
            />
          </motion.svg>
        )}
      </AnimatePresence>

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
                  <Image className={selectedItem.media.type === "gif" ? "media-no-upscale" : undefined} src={selectedItem.media.url} alt={selectedItem.media.alt} fill sizes="90vw" unoptimized />
                )
              ) : (
                <TelemetryMediaPlaceholder item={selectedItem} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
