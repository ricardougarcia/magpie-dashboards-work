"use client";

import { useEffect, useRef } from "react";
import styles from "./project-page-motion.module.css";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function ProjectPageMotion({ sections }: { sections: { id: string; title: string }[] }) {
  const map = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = map.current!;
    const page = element.closest("main")!;
    const targets = sections.map(({ id }) => page.querySelector<HTMLElement>(`[id="${id}"]`)!);
    const content = targets.map((target) => target.querySelector<HTMLElement>("[data-section-content]")!);
    const marker = element.querySelector<SVGRectElement>("[data-page-window]")!;
    const regions = [...element.querySelectorAll<SVGRectElement>("[data-mini-region]")];
    const links = [...element.querySelectorAll<HTMLAnchorElement>("[data-mini-link]")];
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const nav = page.querySelector<HTMLElement>('nav[aria-label="Project sections"]');
    let frame = 0;
    let disposed = false;
    let anchor = document.getElementById(location.hash.slice(1));
    const update = () => {
      frame = 0;
      if (disposed) return;
      const height = document.documentElement.scrollHeight;
      const viewport = innerHeight;
      const scroll = Math.max(0, scrollY);
      const rects = targets.map((target) => target.getBoundingClientRect());
      const navBottom = nav?.getBoundingClientRect().bottom ?? 0;
      const anchorContent = anchor?.closest<HTMLElement>("[data-section-content]");
      const anchorIndex = anchorContent ? content.indexOf(anchorContent) : -1;
      let anchorBottom = 0;
      if (anchor && anchorContent && anchorIndex >= 0) {
        const shell = targets[anchorIndex];
        const shift = anchorContent.getBoundingClientRect().top - rects[anchorIndex].top - shell.clientTop - (parseFloat(getComputedStyle(shell).paddingTop) || 0);
        anchorBottom = anchor.getBoundingClientRect().bottom - shift;
      }
      const scale = 144 / Math.max(1, height);
      let current = 0;
      rects.forEach((rect, index) => { if (rect.top <= Math.min(160, viewport * .25)) current = index; });
      if (scroll > 0 && scroll + viewport >= height - 2) current = rects.length - 1;
      // The section shell stays in document flow. Only its contents slow down as
      // they clear the next section edge; the grid, anchors, and rail stay stable.
      rects.forEach((rect, index) => {
        const next = rects[index + 1];
        let progress = next && !preference.matches
          ? clamp(Math.min(-rect.top - 80, viewport / 3 - next.top) / Math.max(1, viewport * .5)) : 0;
        // A linked detail stays at its native anchor position while it is read.
        // Resume the section's scroll motion gradually as that detail leaves view.
        if (index === anchorIndex) progress *= clamp((80 - anchorBottom) / 160);
        content[index].style.setProperty("--section-shift", `${progress * Math.min(120, viewport * .16)}px`);
        content[index].style.setProperty("--section-opacity", String(1 - progress * .28));
        const top = index === 0 ? 0 : rect.top + scroll;
        const bottom = index === rects.length - 1 ? height : rects[index + 1].top + scroll;
        regions[index].setAttribute("y", String(3 + top * scale));
        regions[index].setAttribute("height", String(Math.max(1, (bottom - top) * scale - 2)));
        regions[index].dataset.current = String(index === current);
        links[index].style.top = `${(3 + top * scale) / 1.5}%`;
        links[index].style.height = `${(bottom - top) * scale / 1.5}%`;
        if (index === current) links[index].setAttribute("aria-current", "location");
        else links[index].removeAttribute("aria-current");
      });
      marker.setAttribute("y", String(3 + scroll * scale));
      marker.setAttribute("height", String(Math.min(144, viewport * scale)));
      // Stay below the sticky index even on short desktop windows. On mobile
      // CSS reduces the diagram to an eight-pixel strip inside the page margin.
      const available = Math.max(0, viewport - Math.max(0, navBottom) - 32);
      element.style.setProperty("--mini-height", `${Math.min(150, Math.max(44, available))}px`);
      element.dataset.compact = String(available < 90);
      element.dataset.ready = "true";
    };
    const schedule = () => { if (!frame && !disposed) frame = requestAnimationFrame(update); };
    const beforeNavigation = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.defaultPrevented) return;
      const href = event.target instanceof Element ? event.target.closest("a")?.getAttribute("href") : null;
      if (!href?.startsWith("#")) return;
      const target = document.getElementById(href.slice(1));
      if (!target || !page.contains(target)) return;
      anchor = target;
      // Native navigation must measure the resting layout, including same-hash clicks.
      content.forEach((item) => { item.style.setProperty("--section-shift", "0px"); item.style.setProperty("--section-opacity", "1"); });
    };
    const onHash = () => { anchor = document.getElementById(location.hash.slice(1)); schedule(); };
    const observer = new ResizeObserver(schedule);
    observer.observe(page); targets.forEach((target) => observer.observe(target));
    if (nav) observer.observe(nav);
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    document.addEventListener("click", beforeNavigation, true);
    window.addEventListener("hashchange", onHash);
    preference.addEventListener("change", schedule);
    document.fonts?.ready.then(schedule);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect();
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); window.removeEventListener("pageshow", schedule);
      document.removeEventListener("click", beforeNavigation, true); window.removeEventListener("hashchange", onHash);
      preference.removeEventListener("change", schedule);
      content.forEach((item) => { item.style.removeProperty("--section-shift"); item.style.removeProperty("--section-opacity"); });
    };
  }, [sections]);

  return <nav ref={map} className={styles.miniMap} data-page-minimap aria-label="Page mini-map">
    <svg viewBox="0 0 48 150" preserveAspectRatio="none" aria-hidden="true">
      {sections.map(({ id }) => <rect key={id} data-mini-region={id} x="5" width="36" />)}
      <rect data-page-window x="2" width="42" />
    </svg>
    <div className={styles.links}>
      {sections.map(({ id, title }, index) => <a key={id} href={`#${id}`} data-mini-link={id} aria-label={`${String(index + 1).padStart(2, "0")} ${title}`}>
        <span>{String(index + 1).padStart(2, "0")} / {title}</span>
      </a>)}
    </div>
    <span className={styles.caption} aria-hidden="true">CCP / PAGE</span>
  </nav>;
}
