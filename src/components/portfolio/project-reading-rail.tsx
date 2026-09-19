"use client";

import { useEffect, useRef, useState } from "react";
import { PortfolioLink } from "./portfolio-link";
import styles from "./portfolio.module.css";

export function ProjectReadingRail({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const nav = useRef<HTMLElement>(null);
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const links = [...nav.current!.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    const targets = links.map((link) => document.getElementById(link.hash.slice(1)));
    let frame = 0;
    let disposed = false;
    const update = () => {
      frame = 0;
      const threshold = Math.min(160, window.innerHeight * .25);
      let index = 0;
      targets.forEach((target, position) => {
        if (target && target.getBoundingClientRect().top <= threshold) index = position;
      });
      // A short final section cannot reach the reading threshold at the page end.
      if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) index = links.length - 1;
      const link = links[index];
      if (!link) return;
      setActive(link.hash.slice(1));
      if (marker.current) {
        marker.current.style.transform = `translate(${link.offsetLeft - 9}px, ${link.offsetTop + link.offsetHeight / 2 - 9}px)`;
        marker.current.style.opacity = "1";
      }
    };
    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    targets.forEach((target) => { if (target) observer.observe(target); });
    observer.observe(nav.current!);
    schedule();
    document.fonts?.ready.then(schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    window.addEventListener("hashchange", schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      window.removeEventListener("hashchange", schedule);
    };
  }, [sections]);

  return <aside className={styles.sectionRail}>
    <nav ref={nav} aria-label="Project sections">
      <p className={styles.eyebrow}>In this Project</p>
      <div className={styles.readingIndex}>
        <span ref={marker} className={styles.readingMarker} aria-hidden="true" />
        <ol>{sections.map((section, index) => <li key={section.id}>
          <a href={`#${section.id}`} aria-current={active === section.id ? "location" : undefined}>
            <span>{String(index + 1).padStart(2, "0")}</span>{section.title}
          </a>
        </li>)}</ol>
      </div>
      <PortfolioLink href="/drawer" className={styles.railReturn}>← Board</PortfolioLink>
    </nav>
  </aside>;
}
