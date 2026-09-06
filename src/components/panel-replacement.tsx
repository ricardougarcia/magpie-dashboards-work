"use client";

import {
  createContext,
  type CSSProperties,
  type ReactNode,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { PANEL_REPLACEMENT_DEFAULTS, panelReplacementGeometry, panelReplacementState } from "@/lib/panel-replacement";

type PersistentEntry = { slot: HTMLDivElement; surface: HTMLDivElement };
type PersistenceContext = {
  layer: HTMLDivElement | null;
  register: (entry: PersistentEntry) => () => void;
};

const PanelPersistenceContext = createContext<PersistenceContext | null>(null);

export function PanelReplacement({
  outgoing,
  children,
  outgoingSpeed = PANEL_REPLACEMENT_DEFAULTS.outgoingSpeed,
  opacityFloor = PANEL_REPLACEMENT_DEFAULTS.opacityFloor,
}: {
  outgoing: ReactNode;
  children: ReactNode;
  outgoingSpeed?: number;
  opacityFloor?: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const outgoingRef = useRef<HTMLDivElement>(null);
  const incomingRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const entries = useRef(new Set<PersistentEntry>());
  const scheduleMeasurement = useRef(() => {});
  const [layer, setLayer] = useState<HTMLDivElement | null>(null);
  const context = useMemo(() => ({
    layer,
    register: (entry: PersistentEntry) => {
      entries.current.add(entry);
      scheduleMeasurement.current();
      return () => {
        entries.current.delete(entry);
        scheduleMeasurement.current();
      };
    },
  }), [layer]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const outgoingPanel = outgoingRef.current;
    const incoming = incomingRef.current;
    const viewport = viewportRef.current;
    if (!root || !outgoingPanel || !incoming || !viewport) return;
    const content = outgoingPanel.querySelector<HTMLElement>("[data-panel-content]") ?? outgoingPanel;
    const motion = outgoingPanel.querySelector<HTMLElement>(".panel-outgoing-motion")!;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const nativeTimeline = typeof CSS !== "undefined" && CSS.supports("animation-timeline", "scroll(root block)") && CSS.supports("animation-range", "0px 100px");
    root.dataset.panelDriver = nativeTimeline ? "native" : "fallback";
    let frame: number | null = null;
    let needsMeasurement = true;
    let disposed = false;
    let incomingTop = 0;
    let contentTop = 0;
    let viewportHeight = 0;

    const update = () => {
      frame = null;
      if (disposed) return;
      const scrollY = Math.max(0, window.scrollY);
      if (needsMeasurement) {
        needsMeasurement = false;
        const rootRect = root.getBoundingClientRect();
        incomingTop = incoming.getBoundingClientRect().top + scrollY;
        // Measure Panel 1's current rendered offset, including browser-driven animation.
        const renderedShift = motion.getBoundingClientRect().top - outgoingPanel.getBoundingClientRect().top;
        contentTop = content.getBoundingClientRect().top + scrollY - renderedShift;
        // Mobile browser chrome changes innerHeight during a gesture. Use the
        // small viewport so that revealing the toolbar cannot retime Panel 1.
        viewportHeight = viewport.getBoundingClientRect().height;
        const geometry = panelReplacementGeometry({ incomingTop, contentTop, viewportHeight, outgoingSpeed, opacityFloor });
        // Panel 1 slots stay in flow; their live content belongs to a separate, unfaded layer.
        const positions = [...entries.current].map(({ slot, surface }) => {
          const rect = slot.getBoundingClientRect();
          const compensation = outgoingPanel.contains(slot) ? renderedShift : 0;
          return { surface, left: rect.left - rootRect.left, top: rect.top - rootRect.top - compensation, width: rect.width };
        });
        for (const position of positions) {
          position.surface.style.left = `${position.left}px`;
          position.surface.style.top = `${position.top}px`;
          position.surface.style.width = `${position.width}px`;
        }
        if (nativeTimeline) {
          // Panel 1 visual updates now run with native scrolling, not a later JS frame.
          root.style.setProperty("--panel-range-start", `${geometry.start}px`);
          root.style.setProperty("--panel-range-end", `${geometry.end}px`);
          root.style.setProperty("--panel-fade-end", `${geometry.fadeEnd}px`);
          root.style.setProperty("--panel-shift-end", `${geometry.distance}px`);
          root.style.setProperty("--panel-pin-end", `${geometry.end - geometry.start}px`);
          root.style.setProperty("--panel-opacity-floor", String(geometry.floor));
        }
      }

      const state = panelReplacementState({ scrollY, incomingTop, contentTop, viewportHeight, outgoingSpeed, opacityFloor, reducedMotion: preference.matches });
      if (!nativeTimeline) {
        root.style.setProperty("--panel-shift", `${state.shift}px`);
        root.style.setProperty("--panel-opacity", String(state.opacity));
        root.style.setProperty("--panel-progress", String(state.progress));
        root.style.setProperty("--panel-pin-shift", `${state.pinShift}px`);
      }
      if (root.dataset.panelReplaced !== String(state.replaced)) root.dataset.panelReplaced = String(state.replaced);
      const motionMode = preference.matches ? "reduced" : "active";
      if (root.dataset.panelMotion !== motionMode) root.dataset.panelMotion = motionMode;
      if (content.inert !== state.replaced) content.inert = state.replaced;
      for (const { surface } of entries.current) {
        const before = surface.querySelector<HTMLElement>("[data-panel-morph-before]");
        const after = surface.querySelector<HTMLElement>("[data-panel-morph-after]");
        if (before && after) {
          const morphed = state.progress >= 0.5;
          if (before.inert !== morphed) before.inert = morphed;
          if (after.inert !== !morphed) after.inert = !morphed;
          if (before.getAttribute("aria-hidden") !== String(morphed)) before.setAttribute("aria-hidden", String(morphed));
          if (after.getAttribute("aria-hidden") !== String(!morphed)) after.setAttribute("aria-hidden", String(!morphed));
        }
      }
    };
    const schedule = () => {
      if (frame === null) frame = window.requestAnimationFrame(update);
    };
    const measure = () => {
      needsMeasurement = true;
      schedule();
    };
    scheduleMeasurement.current = measure;
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    observer.observe(outgoingPanel);
    observer.observe(content);
    observer.observe(viewport);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", measure);
    window.addEventListener("pageshow", measure);
    preference.addEventListener("change", measure);
    document.fonts?.ready.then(() => { if (!disposed) measure(); });
    return () => {
      disposed = true;
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", measure);
      window.removeEventListener("pageshow", measure);
      preference.removeEventListener("change", measure);
      scheduleMeasurement.current = () => {};
      content.inert = false;
      for (const property of ["--panel-shift", "--panel-opacity", "--panel-progress", "--panel-pin-shift", "--panel-range-start", "--panel-range-end", "--panel-fade-end", "--panel-shift-end", "--panel-pin-end", "--panel-opacity-floor"]) {
        root.style.removeProperty(property);
      }
      delete root.dataset.panelReplaced;
      delete root.dataset.panelMotion;
      delete root.dataset.panelDriver;
    };
  }, [outgoingSpeed, opacityFloor]);

  return (
    <PanelPersistenceContext value={context}>
      <div className="panel-replacement" ref={rootRef}>
        <div className="panel-viewport-measure" ref={viewportRef} aria-hidden="true" />
        <div className="panel-outgoing" ref={outgoingRef}>
          <div className="panel-outgoing-motion">{outgoing}</div>
        </div>
        <div className="panel-incoming-sheet" ref={incomingRef}>{children}</div>
        <div className="panel-persistence-layer" ref={setLayer} />
      </div>
    </PanelPersistenceContext>
  );
}

// Opt-in tags for later Panel 1 / Panel 2 instructions. No page element uses them yet.
export function PanelPersistentElement({
  mode,
  children,
  replacement,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
} & ({ mode: "pinned"; replacement?: never } | { mode: "morph-in-place"; replacement: ReactNode })) {
  const context = useContext(PanelPersistenceContext);
  const slotRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    const surface = surfaceRef.current;
    if (!context?.layer || !slot || !surface) return;
    const syncHeight = () => {
      slot.style.height = `${surface.getBoundingClientRect().height}px`;
    };
    syncHeight();
    const observer = new ResizeObserver(syncHeight);
    observer.observe(surface);
    const unregister = context.register({ slot, surface });
    return () => { observer.disconnect(); unregister(); };
  }, [context]);

  if (!context) throw new Error("PanelPersistentElement must be inside PanelReplacement.");
  const content = mode === "morph-in-place" ? (
    <div className="panel-morph-content">
      <div data-panel-morph-before>{children}</div>
      <div data-panel-morph-after inert aria-hidden="true">{replacement}</div>
    </div>
  ) : children;

  return (
    <>
      <div className={className} style={style} ref={slotRef} data-panel-persistence-slot={context.layer ? "active" : "pending"}>
        {!context.layer && content}
      </div>
      {context.layer && createPortal(
        <div className={`panel-persistent-element ${className ?? ""}`} style={style} data-panel-persistence={mode} ref={surfaceRef}>
          {content}
        </div>,
        context.layer,
      )}
    </>
  );
}
