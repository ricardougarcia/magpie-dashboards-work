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
    const pending = new Set<HTMLElement>();
    const article = element.closest("article");
    const reading = article?.parentElement;
    let arrival: ReturnType<typeof setTimeout> | undefined;
    let disposed = false;
    const reveal = () => {
      arrival = undefined;
      if (disposed || reduced.matches || document.hidden || element.closest("[inert]")) return;
      if (article && Number(getComputedStyle(article).opacity) < .95) return;
      const arriving = [...pending].sort((a, b) => Number(a.dataset.impactOutcome) - Number(b.dataset.impactOutcome));
      arriving.forEach((outcome, index) => {
        pending.delete(outcome);
        observer.unobserve(outcome);
        const value = outcome.querySelector<HTMLElement>("[data-impact-value]");
        if (reduced.matches || typeof value?.animate !== "function") return;
        try {
          const animation = value.animate([
            { clipPath: "inset(100% 0 0 0)", transform: "translateY(6px)" },
            { clipPath: "inset(0 0 0 0)", transform: "translateY(0)" },
          ], { duration: 420, delay: index * 80, easing: "cubic-bezier(.16,1,.3,1)", fill: "backwards" });
          animations.add(animation);
          animation.onfinish = () => animations.delete(animation);
        } catch {
          // Unsupported animation never suppresses the reported outcome.
        }
      });
    };
    // Let native anchor travel and the Catalogs handoff settle before using
    // the one-time reveal. A mere viewport-edge intersection is not arrival.
    const schedule = () => {
      clearTimeout(arrival);
      if (!disposed && pending.size) arrival = setTimeout(reveal, 100);
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const outcome = entry.target as HTMLElement;
        if (entry.isIntersecting && entry.intersectionRatio >= .6) pending.add(outcome);
        else pending.delete(outcome);
      });
      schedule();
    }, { threshold: [0, .6], rootMargin: "0px 0px -48px 0px" });
    const visibility = new MutationObserver(schedule);
    if (article) visibility.observe(article, { attributes: true, attributeFilter: ["style"] });
    if (reading) visibility.observe(reading, { attributes: true, attributeFilter: ["inert"] });

    const settle = () => {
      clearTimeout(arrival);
      pending.clear();
      animations.forEach(animation => animation.cancel());
      animations.clear();
    };
    const preferenceChanged = () => {
      if (reduced.matches) { observer.disconnect(); settle(); }
    };
    element.querySelectorAll("[data-impact-outcome]").forEach(item => observer.observe(item));
    reduced.addEventListener("change", preferenceChanged);
    window.addEventListener("scroll", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("beforeprint", settle);
    return () => {
      disposed = true;
      observer.disconnect();
      visibility.disconnect();
      settle();
      reduced.removeEventListener("change", preferenceChanged);
      window.removeEventListener("scroll", schedule);
      document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("beforeprint", settle);
    };
  }, []);

  return <section ref={root} id="impact" className={styles.impact} aria-labelledby="impact-heading" data-marketplace-section>
    <header id="shared-product" className={styles.heading}>
      <h2 id="impact-heading">A shared destination.<br /><span>Less fragmented work.</span></h2>
    </header>
    <div className={styles.results}>
      <dl className={styles.outcomes} aria-label="Reported Marketplace outcomes">
      {outcomes.map((outcome, index) => <div key={outcome.label} className={styles.outcome} data-impact-outcome={index}>
        <dt>{outcome.label}</dt>
        <dd className={styles.figure}><span data-impact-value>{outcome.value}<span className={styles.unit}>{outcome.unit}</span></span></dd>
        <dd className={styles.context}>{outcome.context}</dd>
      </div>)}
      </dl>
      <p id="reflection" className={styles.reflection}>Three catalogs brought together.<span>A stronger foundation<br />for both sides.</span></p>
    </div>
  </section>;
}
