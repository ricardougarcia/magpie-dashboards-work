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
import { PANEL_REPLACEMENT_DEFAULTS, panelReplacementState } from "@/lib/panel-replacement";

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
    if (!root || !outgoingPanel || !incoming) return;
    const content = outgoingPanel.querySelector<HTMLElement>("[data-panel-content]") ?? outgoingPanel;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame: number | null = null;
    let needsMeasurement = true;
    let disposed = false;
    let shift = 0;
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
        const renderedShift = preference.matches ? 0 : shift;
        contentTop = content.getBoundingClientRect().top + scrollY - renderedShift;
        viewportHeight = window.innerHeight;
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
      }

      const state = panelReplacementState({ scrollY, incomingTop, contentTop, viewportHeight, outgoingSpeed, opacityFloor, reducedMotion: preference.matches });
      shift = state.shift;
      root.style.setProperty("--panel-shift", `${state.shift}px`);
      root.style.setProperty("--panel-opacity", String(state.opacity));
      root.style.setProperty("--panel-progress", String(state.progress));
      root.style.setProperty("--panel-pin-shift", `${state.pinShift}px`);
      root.dataset.panelReplaced = String(state.replaced);
      root.dataset.panelMotion = preference.matches ? "reduced" : "active";
      content.inert = state.replaced;
      for (const { surface } of entries.current) {
        const before = surface.querySelector<HTMLElement>("[data-panel-morph-before]");
        const after = surface.querySelector<HTMLElement>("[data-panel-morph-after]");
        if (before && after) {
          before.inert = state.progress >= 0.5;
          after.inert = state.progress < 0.5;
          before.setAttribute("aria-hidden", String(state.progress >= 0.5));
          after.setAttribute("aria-hidden", String(state.progress < 0.5));
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
      for (const property of ["--panel-shift", "--panel-opacity", "--panel-progress", "--panel-pin-shift"]) {
        root.style.removeProperty(property);
      }
      delete root.dataset.panelReplaced;
      delete root.dataset.panelMotion;
    };
  }, [outgoingSpeed, opacityFloor]);

  return (
    <PanelPersistenceContext value={context}>
      <div className="panel-replacement" ref={rootRef}>
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
