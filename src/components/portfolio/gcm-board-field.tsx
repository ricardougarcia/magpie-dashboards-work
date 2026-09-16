"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { gcmBoardGeometry, type GcmBoardOrigin } from "./gcm-board-geometry";
import styles from "./gcm-board-cluster.module.css";

type Connection = { active: boolean; origin: GcmBoardOrigin; pinned: GcmBoardOrigin | null };
const initial: Connection = { active: false, origin: "gcm", pinned: null };
const Relationship = createContext<{ pinned: GcmBoardOrigin | null; toggle: (origin: GcmBoardOrigin) => void }>({ pinned: null, toggle: () => {} });

const entryFor = (target: EventTarget | null) => target instanceof Element ? target.closest<HTMLElement>("[data-gcm-entry]")?.dataset.gcmEntry as GcmBoardOrigin | undefined : undefined;

export function GcmBoardRelationship({ origin }: { origin: GcmBoardOrigin }) {
  const relationship = useContext(Relationship);
  return <button type="button" className={styles.related} aria-pressed={relationship.pinned === origin} aria-describedby="gcm-board-relationship" onClick={() => relationship.toggle(origin)}>
    {origin === "gcm" ? "Related discovery [03.B]" : "Related MVP [03.A]"}
  </button>;
}

/** The six authored regions stay in normal flow; only the measured line changes. */
export function GcmBoardField({ children, className }: { children: ReactNode; className: string }) {
  const root = useRef<HTMLDivElement>(null);
  const interaction = useRef<{ hovered: GcmBoardOrigin | null; focused: GcmBoardOrigin | null; pinned: GcmBoardOrigin | null; origin: GcmBoardOrigin }>({ hovered: null, focused: null, pinned: null, origin: "gcm" });
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [connection, setConnection] = useState(initial);
  const [geometry, setGeometry] = useState<ReturnType<typeof gcmBoardGeometry> | null>(null);

  function display() {
    const state = interaction.current;
    const active = state.pinned || state.focused || state.hovered;
    if (active) state.origin = active;
    setConnection({ active: !!active, origin: state.origin, pinned: state.pinned });
  }

  function dismiss() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    interaction.current.hovered = interaction.current.focused = interaction.current.pinned = null;
    display();
  }

  function toggle(origin: GcmBoardOrigin) {
    if (interaction.current.pinned === origin) dismiss();
    else { interaction.current.pinned = origin; display(); }
  }

  useEffect(() => {
    const element = root.current;
    const gcm = element?.querySelector<HTMLElement>('[data-gcm-entry="gcm"]');
    const pmf = element?.querySelector<HTMLElement>('[data-gcm-entry="pmf"]');
    if (!element || !gcm || !pmf) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setGeometry(gcmBoardGeometry(element.getBoundingClientRect(), gcm.getBoundingClientRect(), pmf.getBoundingClientRect(), window.matchMedia("(max-width: 900px)").matches, connection.origin));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(schedule);
    // Images and font reflow can move either entry without resizing the viewport.
    observer?.observe(element);
    observer?.observe(gcm);
    observer?.observe(pmf);
    window.addEventListener("resize", schedule, { passive: true });
    schedule();
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); window.removeEventListener("resize", schedule); };
  }, [connection.origin]);

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!entryFor(event.target)) {
        interaction.current.hovered = interaction.current.focused = interaction.current.pinned = null;
        setConnection((value) => ({ ...value, active: false, pinned: null }));
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      interaction.current.hovered = interaction.current.focused = interaction.current.pinned = null;
      setConnection((value) => ({ ...value, active: false, pinned: null }));
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  return <Relationship.Provider value={{ pinned: connection.pinned, toggle }}>
    <div ref={root} className={`${className} ${styles.field}`} data-gcm-connected={connection.active} data-gcm-origin={connection.origin}
      onPointerOver={(event) => {
        if (event.pointerType !== "mouse") return;
        const entry = entryFor(event.target);
        if (!entry || entry === entryFor(event.relatedTarget)) return;
        if (leaveTimer.current) clearTimeout(leaveTimer.current);
        interaction.current.hovered = entry; display();
      }}
      onPointerOut={(event) => {
        if (event.pointerType !== "mouse" || !entryFor(event.target) || entryFor(event.target) === entryFor(event.relatedTarget)) return;
        interaction.current.hovered = null;
        leaveTimer.current = setTimeout(display, 100);
      }}
      onFocus={(event) => { const entry = entryFor(event.target); if (entry) { interaction.current.focused = entry; display(); } }}
      onBlur={(event) => { if (entryFor(event.target) !== entryFor(event.relatedTarget)) { interaction.current.focused = null; display(); } }}>
      {children}
      <svg className={styles.connector} aria-hidden="true" data-gcm-connector>
        {geometry && <g key={connection.origin}>
          <path d={geometry.path} pathLength="1" />
          <circle cx={geometry.start.x} cy={geometry.start.y} r="2.3" />
          <circle cx={geometry.end.x} cy={geometry.end.y} r="2.3" />
        </g>}
      </svg>
      <p id="gcm-board-relationship" className={styles.relationshipDescription}>03.B / Discovery informed 03.A / The GCM MVP. Two separate work samples.</p>
    </div>
  </Relationship.Provider>;
}
