"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import type { ProjectSectionKind } from "@/lib/portfolio-types";
import styles from "./ccp.module.css";

const relations = [{ step: "new-create", decision: "local-creation" }, { step: "new-match", decision: "global-matching" }];

export function ProjectSurface({ id, kind, className, enabled, children }: { id: string; kind: ProjectSectionKind; className: string; enabled: boolean; children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const [connection, setConnection] = useState<{ key: string; path: string; x: number; y: number } | null>(null);

  useEffect(() => {
    const section = root.current!;
    if (!enabled || (kind !== "approach" && kind !== "impact")) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
      section.style.setProperty("--paper-shift", `${preference.matches ? 0 : (progress - .5) * 12}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(section);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    preference.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      preference.removeEventListener("change", schedule);
    };
  }, [enabled, kind]);

  useEffect(() => {
    const section = root.current!;
    if (!enabled || kind !== "solution") return;
    let pointer: typeof relations[number] | undefined;
    let focused: typeof relations[number] | undefined;
    const locate = (target: EventTarget | null) => {
      const element = target instanceof Element ? target.closest<HTMLElement>("a[data-related-step], [data-flow-step]") : null;
      const step = element?.dataset.relatedStep ?? element?.dataset.flowStep;
      return relations.find((relation) => relation.step === step);
    };
    const draw = () => {
      const selected = focused ?? pointer;
      section.dataset.relatedStep = selected?.step ?? "";
      if (!selected) { setConnection(null); return; }
      const source = section.querySelector<HTMLElement>(`[id="${selected.step}"]`);
      const target = section.querySelector<HTMLElement>(`[id="${selected.decision}"]`);
      if (!source || !target) return;
      const parent = section.getBoundingClientRect();
      const a = source.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      const x1 = a.left - parent.left + Math.min(28, a.width / 2);
      const y1 = a.bottom - parent.top + 6;
      const x2 = b.left - parent.left + 12;
      const y2 = b.top - parent.top - 10;
      const middle = y1 + (y2 - y1) * .52;
      // Stay in the open margin on stacked layouts; never pass through another step.
      const stacked = matchMedia("(max-width: 760px)").matches;
      const path = stacked ? `M ${a.left - parent.left + 2} ${a.top - parent.top + 9} H -8 V ${y2} H ${x2}` : `M ${x1} ${y1} V ${middle} H ${x2} V ${y2}`;
      setConnection({ key: selected.step, path, x: x2, y: y2 });
    };
    const over = (event: PointerEvent) => { if (event.pointerType !== "touch") { pointer = locate(event.target); draw(); } };
    const out = (event: PointerEvent) => { if (event.pointerType !== "touch") { pointer = locate(event.relatedTarget); draw(); } };
    const focus = (event: FocusEvent) => { focused = locate(event.target); draw(); };
    const blur = (event: FocusEvent) => { focused = locate(event.relatedTarget); draw(); };
    section.addEventListener("pointerover", over);
    section.addEventListener("pointerout", out);
    section.addEventListener("focusin", focus);
    section.addEventListener("focusout", blur);
    const resize = new ResizeObserver(draw); resize.observe(section);
    return () => {
      resize.disconnect();
      section.removeEventListener("pointerover", over); section.removeEventListener("pointerout", out);
      section.removeEventListener("focusin", focus); section.removeEventListener("focusout", blur);
    };
  }, [enabled, kind]);

  return <section ref={root} id={id} className={className} data-project-section={kind} aria-labelledby={`${id}-heading`}>
    {children}
    {connection && <svg key={connection.key} className={styles.decisionTrace} aria-hidden="true" data-decision-trace>
      <path d={connection.path} pathLength="1" />
      <rect x={connection.x - 1.5} y={connection.y - 1.5} width="3" height="3" />
    </svg>}
  </section>;
}
