"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./pmf-diagrams.module.css";

const capabilities = [
  {
    label: "Population segmentation",
    purpose: "Explore how people make sense of population groups and distributions.",
  },
  {
    label: "Attribute generation",
    purpose: "Explore where a newly generated attribute could support a useful application.",
  },
  {
    label: "Probabilistic inference",
    purpose: "Make probabilistic output understandable enough to discuss its usefulness.",
  },
  {
    label: "Data imputation",
    purpose: "Explore how missing data and confidence information affect trust.",
  },
];

/** Public capability labels, not a reproduction of the proprietary concept map. */
export function PmfCapabilityMap() {
  const [selected, setSelected] = useState(0);
  const descriptionId = useId();

  return <figure className={styles.diagram} data-pmf-capability-map>
    <div className={styles.capabilityDrawing}>
      <span className={styles.modelLabel}>One<br />model</span>
      <svg className={styles.capabilityPaths} viewBox="0 0 440 192" preserveAspectRatio="none" aria-hidden="true">
        {capabilities.map((capability, index) => <path
          key={capability.label}
          d={`M76 96 C116 96 104 ${24 + index * 48} 142 ${24 + index * 48}`}
          className={selected === index ? styles.selectedPath : undefined}
        />)}
        <circle cx="76" cy="96" r="3" />
      </svg>
      <div className={styles.capabilityChoices} role="group" aria-label="Explore the model’s capabilities">
        {capabilities.map((capability, index) => <button
          key={capability.label}
          type="button"
          className={styles.capabilityChoice}
          aria-pressed={selected === index}
          aria-controls={descriptionId}
          aria-describedby={selected === index ? descriptionId : undefined}
          onPointerEnter={(event) => { if (event.pointerType === "mouse") setSelected(index); }}
          onFocus={() => setSelected(index)}
          onClick={() => setSelected(index)}
        >
          <span className={styles.capabilityPoint} aria-hidden="true" />
          <span>{capability.label}</span>
        </button>)}
      </div>
    </div>
    <div className={styles.purpose} id={descriptionId} aria-live="polite" aria-atomic="true">
      <span className={styles.purposeLabel}>Research purpose</span>
      <p key={selected}>{capabilities[selected].purpose}</p>
    </div>
    <figcaption className={styles.caption}>Illustrative reconstruction</figcaption>
  </figure>;
}

/** Two contextual inputs converge, without encoding a ranking or claiming PMF. */
export function PmfOpportunityMap() {
  const diagramRef = useRef<HTMLElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const diagram = diagramRef.current;
    if (!diagram) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let inView = true;
    let printing = false;

    const paint = () => {
      frame = 0;
      if (reduced.matches || printing) {
        diagram.style.setProperty("--pmf-map-progress", "1");
        return;
      }
      const bounds = diagram.getBoundingClientRect();
      const viewport = window.visualViewport?.height ?? window.innerHeight;
      const progress = Math.min(1, Math.max(0, (viewport * .85 - bounds.top) / Math.max(viewport * .5, bounds.height * .65)));
      diagram.style.setProperty("--pmf-map-progress", String(progress));
    };
    const queue = () => {
      if (frame || document.hidden || !inView) return;
      frame = requestAnimationFrame(paint);
    };
    const onPreference = () => { cancelAnimationFrame(frame); frame = 0; paint(); };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else queue();
    };
    const onBeforePrint = () => { printing = true; onPreference(); };
    const onAfterPrint = () => { printing = false; onPreference(); };
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) queue();
    }, { rootMargin: "40px" });
    observer?.observe(diagram);
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    window.visualViewport?.addEventListener("resize", queue);
    window.addEventListener("pageshow", queue);
    window.addEventListener("beforeprint", onBeforePrint);
    window.addEventListener("afterprint", onAfterPrint);
    document.addEventListener("visibilitychange", onVisibility);
    reduced.addEventListener("change", onPreference);
    paint();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      window.visualViewport?.removeEventListener("resize", queue);
      window.removeEventListener("pageshow", queue);
      window.removeEventListener("beforeprint", onBeforePrint);
      window.removeEventListener("afterprint", onAfterPrint);
      document.removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onPreference);
    };
  }, []);

  return <figure ref={diagramRef} className={`${styles.diagram} ${styles.opportunity}`} data-pmf-opportunity-map>
    <div className={styles.inquiryLabels} aria-hidden="true"><span>User research</span><span>Market analysis</span></div>
    <svg className={styles.opportunityDrawing} viewBox="0 0 440 176" preserveAspectRatio="none" role="img" aria-labelledby={titleId} aria-describedby={descriptionId}>
      <title id={titleId}>Two lines of inquiry inform an initial MVP direction</title>
      <desc id={descriptionId}>User research and market analysis are considered together. This illustrative diagram shows the relationship, not measured scores or a finding of product–market fit.</desc>
      <g className={styles.mapBase}>
        <path d="M110 0 V32 C110 92 220 66 220 132 V176" />
        <path d="M330 0 V32 C330 92 220 66 220 132 V176" />
        <circle cx="110" cy="5" r="3" /><circle cx="330" cy="5" r="3" />
        <circle cx="220" cy="132" r="5" />
      </g>
      <g className={styles.mapDraw}>
        <path pathLength="1" d="M110 0 V32 C110 92 220 66 220 132 V176" />
        <path pathLength="1" d="M330 0 V32 C330 92 220 66 220 132 V176" />
      </g>
    </svg>
    <div className={styles.direction}><span className={styles.directionPoint} aria-hidden="true" /><strong>Initial MVP direction</strong><span>Informed by both perspectives</span></div>
    <figcaption className={styles.caption}>Illustrative reconstruction</figcaption>
  </figure>;
}
