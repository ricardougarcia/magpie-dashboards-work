"use client";

import { useEffect, useRef, useState } from "react";
import { GcmImpactInk } from "./gcm-impact-ink";
import { gcmOutcomes } from "@/data/gcm";
import styles from "./gcm.module.css";
import inkStyles from "./gcm-impact.module.css";

/** Readable static outcomes gain one restrained arrival, with no scroll pinning. */
export function GcmImpact() {
  const root = useRef<HTMLElement>(null);
  const inkTrack = useRef<HTMLDivElement>(null);
  const [inkEnabled, setInkEnabled] = useState(false);

  useEffect(() => {
    const track = inkTrack.current;
    if (!track || typeof ResizeObserver === "undefined" || typeof IntersectionObserver === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let visible = false;
    let printing = false;
    const update = () => setInkEnabled(visible && !printing && !document.hidden && !reduced.matches && finePointer.matches);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    const beforePrint = () => { printing = true; update(); };
    const afterPrint = () => { printing = false; update(); };
    observer.observe(track);
    reduced.addEventListener("change", update);
    finePointer.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);
    return () => {
      observer.disconnect();
      reduced.removeEventListener("change", update);
      finePointer.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  useEffect(() => {
    const element = root.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || typeof IntersectionObserver === "undefined") return;
    const animations = new Set<Animation>();
    const seen = new Set<Element>();
    const observer = new IntersectionObserver(entries => {
      const entering = entries.filter(entry => entry.isIntersecting && entry.intersectionRatio >= .45 && !seen.has(entry.target));
      entering.forEach((entry, index) => {
        seen.add(entry.target);
        observer.unobserve(entry.target);
        const target = entry.target as HTMLElement;
        if (reduced.matches || document.hidden || typeof target.animate !== "function") return;
        try {
          const animation = target.animate([
            { opacity: .45, transform: "translateY(6px)", clipPath: "inset(0 0 24% 0)" },
            { opacity: 1, transform: "translateY(0)", clipPath: "inset(0 0 0 0)" },
          ], { duration: 520, delay: Math.min(index * 65, 390), easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        } catch {
          // Unsupported animation leaves every result visible.
        }
      });
    }, { threshold: [0, .45], rootMargin: "0px 0px -28px 0px" });
    const settle = () => {
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    };
    const preferenceChanged = () => { if (reduced.matches) settle(); };
    element.querySelectorAll("[data-gcm-impact-arrival]").forEach(item => observer.observe(item));
    reduced.addEventListener("change", preferenceChanged);
    window.addEventListener("beforeprint", settle);
    return () => {
      settle();
      reduced.removeEventListener("change", preferenceChanged);
      window.removeEventListener("beforeprint", settle);
    };
  }, []);

  return <section ref={root} id="impact" className={styles.section} aria-labelledby="gcm-impact-heading">
    <div ref={inkTrack} className={inkStyles.field} data-gcm-impact-ink>
    {inkEnabled && <GcmImpactInk trackRef={inkTrack} />}
    <p className={styles.meta}>The response / Published case-study outcomes</p>
    <h2 id="gcm-impact-heading" data-gcm-impact-arrival>From demonstration<br />to commitments.</h2>
    <dl className={styles.outcomes}>{gcmOutcomes.map(outcome => <div key={outcome.label} data-gcm-impact-arrival>
      <dt>{outcome.label}</dt><dd className={outcome.words ? styles.wordOutcome : undefined}>{outcome.value}</dd>
    </div>)}</dl>
    </div>
  </section>;
}
