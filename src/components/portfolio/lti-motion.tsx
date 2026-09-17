"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./lti.module.css";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function ltiBeatProgress(top: number, height: number, viewport: number) {
  return {
    phase: clamp((viewport * .7 - top) / Math.max(1, height + viewport * .1)),
    join: clamp((viewport * .48 - top) / Math.max(1, viewport * .38)),
  };
}

export function ltiWorkstreamProgress(top: number, viewport: number) {
  return clamp((viewport * .5 - top) / Math.max(1, viewport * .36));
}

/** Stable, untransformed wrappers keep reversed scroll from feeding back on itself. */
export function LtiMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const beats = [...element.querySelectorAll<HTMLElement>("[data-lti-beat]")];
    const workstreams = element.querySelector<HTMLElement>("[data-lti-workstreams]");
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let disposed = false;
    const update = () => {
      frame = 0;
      if (disposed) return;
      const viewport = window.innerHeight;
      const maximum = Math.max(1, document.documentElement.scrollHeight - viewport);
      const finished = window.scrollY >= maximum - 1;
      const progress = beats.map((beat) => {
        const box = beat.getBoundingClientRect();
        return media.matches || finished ? { phase: 1, join: 1 } : ltiBeatProgress(box.top, box.height, viewport);
      });
      const join = media.matches || finished ? 1 : ltiWorkstreamProgress(workstreams?.getBoundingClientRect().top ?? viewport, viewport);
      beats.forEach((beat, index) => {
        beat.style.setProperty("--phase", progress[index].phase.toFixed(4));
        beat.style.setProperty("--join", progress[index].join.toFixed(4));
      });
      workstreams?.style.setProperty("--join", join.toFixed(4));
      element.style.setProperty("--reading-progress", String(clamp(window.scrollY / maximum)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    beats.forEach((beat) => observer.observe(beat));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    media.addEventListener("change", schedule);
    document.fonts?.ready.then(() => { if (!disposed) schedule(); });
    update();
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      media.removeEventListener("change", schedule);
    };
  }, []);
  return <div ref={root} className={styles.motion} data-lti-motion>
    <div className={styles.progress} aria-hidden="true"><span /></div>
    {children}
  </div>;
}

const workstreams = [
  { name: "Integration", tasks: ["Verify fields", "Support LTI 1.3", "Configure"], note: "Give each configuration a supported path." },
  { name: "Provider experience", tasks: ["Provider interviews", "Publish configurations", "Provider launch"], note: "Preserve existing configurations and provider trust." },
  { name: "Marketplace", tasks: ["Match tool records", "Clean and tag", "Make tools discoverable"], note: "Make integrations legible at the point of discovery." },
];

export function LtiWorkstreams() {
  const [pinned, setPinned] = useState<string | null>(null);
  return <>
    <div className={styles["workstream-joint"]} data-lti-workstreams role="group" aria-label="Three connected workstreams, a reading map based on the planning artifact"
      onKeyDown={(event) => { if (event.key === "Escape") setPinned(null); }}>
      {workstreams.map((work, index) => <button key={work.name} className={styles["work-box"]} type="button" aria-pressed={pinned === work.name}
        onClick={() => setPinned((current) => current === work.name ? null : work.name)}>
        <span className={styles["work-name"]}>{work.name}</span>
        <span className={styles["work-task"]}>{work.tasks.map((task) => <span key={task} style={{ display: "block" }}>{task}</span>)}</span>
        <span className={styles["work-note"]}>{work.note}</span>
        {index < 2 && <i className={styles.contact} aria-hidden="true" />}
      </button>)}
    </div>
    <div className={styles["joint-caption"]}><span>Three connected workstreams</span><span>Reading map · based on W002</span></div>
  </>;
}
