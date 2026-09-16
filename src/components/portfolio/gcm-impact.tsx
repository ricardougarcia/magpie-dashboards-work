"use client";

import { useEffect, useRef } from "react";
import { gcmOutcomes } from "@/data/gcm";
import styles from "./gcm.module.css";

/** Readable static outcomes gain one restrained arrival, with no scroll pinning. */
export function GcmImpact() {
  const root = useRef<HTMLElement>(null);

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
    <p className={styles.meta}>The response / Published case-study outcomes</p>
    <h2 id="gcm-impact-heading" data-gcm-impact-arrival>From demonstration<br />to commitments.</h2>
    <dl className={styles.outcomes}>{gcmOutcomes.map(outcome => <div key={outcome.label} data-gcm-impact-arrival>
      <dt>{outcome.label}</dt><dd className={outcome.words ? styles.wordOutcome : undefined}>{outcome.value}</dd>
    </div>)}</dl>
  </section>;
}
