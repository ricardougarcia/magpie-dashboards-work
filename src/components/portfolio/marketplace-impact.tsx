"use client";

import { useEffect, useRef } from "react";
import styles from "./marketplace-impact.module.css";

const outcomes = [
  { value: "#1", unit: "", label: "Edtech Marketplace", context: "Largest private catalog of interoperable edtech tools" },
  { value: "102", unit: "%", label: "Partner-listing growth", context: "Reported over five months" },
  { value: "$2M+", unit: "", label: "Partnership revenue", context: "Reported in the first year" },
  { value: "+95", unit: "%", label: "User sentiment", context: "Positive reception from interviewed users" },
  { value: "40+", unit: " hr/wk", label: "Maintenance effort saved", context: "Across separate environments" },
];

/** Final values are readable before hydration; motion only marks their arrival. */
export function MarketplaceImpact() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = root.current!;
    if (typeof IntersectionObserver === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;
    const animations = new Set<Animation>();
    const observer = new IntersectionObserver(entries => {
      const arriving = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => Number((a.target as HTMLElement).dataset.impactOutcome) - Number((b.target as HTMLElement).dataset.impactOutcome));
      arriving.forEach((entry, index) => {
        observer.unobserve(entry.target);
        const value = entry.target.querySelector<HTMLElement>("[data-impact-value]");
        if (reduced.matches || typeof value?.animate !== "function") return;
        try {
          const animation = value.animate([
            { clipPath: "inset(0 0 30% 0)", transform: "translateY(6px)" },
            { clipPath: "inset(0 0 0 0)", transform: "translateY(0)" },
          ], { duration: 420, delay: index * 80, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        } catch {
          // Unsupported animation never suppresses the reported outcome.
        }
      });
    }, { threshold: .25, rootMargin: "0px 0px -24px 0px" });

    const settle = () => {
      animations.forEach(animation => animation.cancel());
      animations.clear();
    };
    const preferenceChanged = () => {
      if (reduced.matches) { observer.disconnect(); settle(); }
    };
    element.querySelectorAll("[data-impact-outcome]").forEach(item => observer.observe(item));
    reduced.addEventListener("change", preferenceChanged);
    window.addEventListener("beforeprint", settle);
    return () => {
      observer.disconnect();
      settle();
      reduced.removeEventListener("change", preferenceChanged);
      window.removeEventListener("beforeprint", settle);
    };
  }, []);

  return <section ref={root} id="impact" className={styles.impact} aria-labelledby="impact-heading" data-marketplace-section>
    <header id="shared-product" className={styles.heading}>
      <h2 id="impact-heading">A shared destination.<br /><span>Less fragmented work.</span></h2>
    </header>
    <dl className={styles.outcomes} aria-label="Reported Marketplace outcomes">
      {outcomes.map((outcome, index) => <div key={outcome.label} className={styles.outcome} data-impact-outcome={index}>
        <dt>{outcome.label}</dt>
        <dd className={styles.figure}><span data-impact-value>{outcome.value}<span className={styles.unit}>{outcome.unit}</span></span></dd>
        <dd className={styles.context}>{outcome.context}</dd>
      </div>)}
    </dl>
    <div className={styles.closing}>
      <details className={styles.sources}>
        <summary>About the reported outcomes<span aria-hidden="true" /></summary>
        <p>These outcomes are reported in the original published case study, with maintenance savings updated to 40+ hours per week by the project owner. The source record does not include an independent ranking basis, underlying listing counts, revenue attribution, interview sample or sentiment methodology, or a time-measurement method. User sentiment is not an NPS score or a measured percentage improvement. These results describe the broader delivery effort, not an isolated individual contribution.</p>
      </details>
      <p id="reflection" className={styles.reflection}>Three catalogs brought together.<br />A stronger foundation for both sides.</p>
    </div>
  </section>;
}
