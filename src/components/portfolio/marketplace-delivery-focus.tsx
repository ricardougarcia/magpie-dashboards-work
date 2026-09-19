"use client";

import { useEffect, useRef } from "react";
import { marketplaceArtifacts as artifacts, marketplaceWorkstreams } from "@/data/marketplace";
import { MarketplaceArtifact, MarketplaceImage } from "./marketplace-artifact";
import { paintScrollProgress, ScrollProgress } from "./scroll-progress";
import styles from "./marketplace-delivery-focus.module.css";

export const DELIVERY_HOVER_DELAY = 120;
export const DELIVERY_PANEL_DURATION = 380;
export const DELIVERY_FRAME_DURATION = 650;
const conceptTriggerLabel = "Explore the in-platform discovery concept · A051";
const deliveryStops = [0, .28, .56, .84] as const;

/** The original four bodies and anchor destinations remain readable without JavaScript. */
export function MarketplaceDeliveryFocus() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = root.current!;
    const choices = [...element.querySelectorAll<HTMLAnchorElement>("[data-delivery-choice]")];
    const panels = [...element.querySelectorAll<HTMLElement>("[data-delivery-panel]")];
    const index = element.querySelector<HTMLElement>("[data-delivery-index]")!;
    const frame = element.querySelector<HTMLElement>("[data-delivery-frame]")!;
    const status = element.querySelector<HTMLElement>("[data-delivery-status]")!;
    const workspace = element.querySelector<HTMLElement>("[data-delivery-workspace]")!;
    const stage = element.querySelector<HTMLElement>("[data-delivery-stage]")!;
    const confluence = element.closest<HTMLElement>("[data-confluence]");
    const masthead = element.closest("[data-portfolio-view]")?.querySelector<HTMLElement>(":scope > .masthead");
    const navigation = confluence?.querySelector<HTMLElement>("[data-marketplace-navigation]");
    const details = [...element.querySelectorAll<HTMLDetailsElement>("[data-delivery-detail]")];
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hover = window.matchMedia("(hover: hover)");
    const wide = window.matchMedia("(min-width: 721px)");
    let selected = 0, disposed = false, keyboardMode = false;
    let dwell: ReturnType<typeof setTimeout> | undefined;
    let reveal: Animation | null = null;
    let scrollRaf = 0, pinned = false, scrollTop = 0, travel = 0, measuring = false;
    let lastScrollY = window.scrollY, entered = false;
    const disclosureMotion = new Map<HTMLDetailsElement, { open: boolean; height: Animation | null; body: Animation | null }>();

    const cancelIntent = () => { clearTimeout(dwell); dwell = undefined; };
    const settleReveal = () => { reveal?.cancel(); reveal = null; };
    const settleDisclosure = (detail: HTMLDetailsElement, reset = false) => {
      const motion = disclosureMotion.get(detail);
      disclosureMotion.delete(detail);
      motion?.height?.cancel(); motion?.body?.cancel();
      detail.style.height = "";
      detail.style.overflow = "";
      if (reset || motion) detail.open = reset ? false : motion!.open;
    };
    const toggleDisclosure = (detail: HTMLDetailsElement) => {
      cancelIntent();
      const open = !(disclosureMotion.get(detail)?.open ?? detail.open);
      const start = detail.getBoundingClientRect().height;
      settleDisclosure(detail);
      const summary = detail.querySelector<HTMLElement>("summary")!;
      const body = detail.querySelector<HTMLElement>("[data-delivery-detail-body]")!;
      if (reduced.matches || typeof detail.animate !== "function") { detail.open = open; return; }
      detail.open = true;
      const end = open ? detail.getBoundingClientRect().height : summary.getBoundingClientRect().height;
      const motion = { open, height: null as Animation | null, body: null as Animation | null };
      disclosureMotion.set(detail, motion);
      detail.style.overflow = "hidden";
      try {
        motion.height = detail.animate([{ height: `${start}px` }, { height: `${end}px` }], {
          duration: 350, easing: "cubic-bezier(.16,1,.3,1)",
        });
        if (open && typeof body.animate === "function") motion.body = body.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180, delay: 70, fill: "backwards" });
        motion.height.onfinish = () => {
          if (!disposed && disclosureMotion.get(detail) === motion) settleDisclosure(detail);
        };
      } catch {
        settleDisclosure(detail);
      }
    };
    const positionFrame = () => {
      if (disposed) return;
      const choice = choices[selected];
      frame.style.transform = `translateY(${choice.offsetTop}px)`;
      frame.style.height = `${Math.max(0, choice.offsetHeight - 24)}px`;
    };
    const select = (next: number, source: "initial" | "hover" | "focus" | "click" | "hash" | "scroll") => {
      cancelIntent();
      if (disposed || (next === selected && source !== "initial")) return;
      // A pointer passing across the index must not remove a keyboard user's
      // focused disclosure from the accessibility tree.
      if ((source === "hover" || source === "scroll") && keyboardMode && panels[selected].contains(document.activeElement)) return;
      settleReveal();
      selected = next;
      if (source !== "initial") details.forEach(detail => settleDisclosure(detail, true));
      element.dataset.selected = marketplaceWorkstreams[next].id;
      if (source !== "scroll") paintScrollProgress(element, deliveryStops[next], next);
      choices.forEach((choice, i) => {
        choice.setAttribute("role", "button");
        choice.setAttribute("aria-pressed", String(i === next));
        choice.setAttribute("aria-expanded", String(i === next));
      });
      panels.forEach((panel, i) => {
        const active = i === next;
        panel.dataset.active = String(active);
        panel.setAttribute("aria-hidden", String(!active));
        panel.inert = !active;
        panel.toggleAttribute("inert", !active);
      });
      positionFrame();
      if (source === "focus" || source === "click") status.textContent = `${marketplaceWorkstreams[next].number}: ${marketplaceWorkstreams[next].label}`;
      if (source !== "initial" && source !== "hash" && !reduced.matches && typeof panels[next].animate === "function") {
        try {
          reveal = panels[next].animate([
            { opacity: .3, clipPath: "inset(0 12% 0 0)", transform: "translateX(8px)" },
            { opacity: 1, clipPath: "inset(0 0 0 0)", transform: "translateX(0)" },
          ], { duration: DELIVERY_PANEL_DURATION, easing: "cubic-bezier(.16,1,.3,1)" });
        } catch {
          // Selection and all content remain usable when WAAPI is unavailable.
        }
      }
    };
    const readingAvailable = () => !element.closest("[inert]") &&
      !(confluence?.dataset.layout === "animated" && Number(confluence.dataset.progress ?? 0) < 1);
    const start = () => element.getBoundingClientRect().top + window.scrollY - scrollTop;
    const paintScroll = () => {
      scrollRaf = 0;
      const moved = Math.abs(window.scrollY - lastScrollY) > .5;
      lastScrollY = window.scrollY;
      if (disposed || !pinned || !moved || !readingAvailable() || element.querySelector("dialog[open]")) return;
      const distance = window.scrollY - start();
      if (distance < 0 && !entered) return;
      entered = distance >= 0;
      const progress = Math.max(0, Math.min(1, distance / travel));
      const next = deliveryStops.findLastIndex(stop => progress >= stop);
      select(Math.max(0, next), "scroll");
      paintScrollProgress(element, progress, selected);
    };
    const scheduleScroll = () => { if (!scrollRaf && !disposed) scrollRaf = requestAnimationFrame(paintScroll); };
    const measureScroll = () => {
      if (disposed || measuring || element.querySelector("dialog[open]")) return;
      measuring = true;
      const oldPinned = pinned, oldTravel = travel;
      const oldTop = element.getBoundingClientRect().top + window.scrollY;
      const oldHeight = element.offsetHeight;
      const after = oldPinned && window.scrollY >= oldTop + oldTravel - scrollTop;
      scrollTop = (masthead?.offsetHeight ?? 62) + (navigation?.offsetHeight ?? 70);
      const viewport = Math.min(window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
      const height = stage.offsetHeight;
      // Every part of the section must fit, including an expanded disclosure.
      // Small viewports keep the existing direct-selection reading layout.
      pinned = wide.matches && !reduced.matches && height > 0 && height <= viewport - scrollTop - 12;
      travel = Math.max(600, (viewport - scrollTop) * 1.45);
      element.style.setProperty("--delivery-top", `${scrollTop}px`);
      element.style.setProperty("--delivery-height", `${height}px`);
      element.style.setProperty("--delivery-travel", `${travel}px`);
      element.dataset.scroll = pinned ? "pinned" : "natural";
      if (oldPinned !== pinned || oldTravel !== travel) {
        // Preserve the article's position when a resize changes a runway above
        // the reader. No wheel interception or synthetic scroll accumulation.
        if (after && oldHeight > 0) {
          const delta = element.offsetHeight - oldHeight;
          if (Math.abs(delta) > 1) window.scrollTo({ top: Math.max(0, window.scrollY + delta), behavior: "instant" });
        } else if (oldPinned && !pinned && entered) {
          window.scrollTo({ top: Math.max(0, oldTop - scrollTop), behavior: "instant" });
        }
        lastScrollY = window.scrollY;
      }
      measuring = false;
    };
    const landSelection = (next: number) => {
      if (!pinned || !readingAvailable()) return;
      window.scrollTo({ top: Math.max(0, start() + travel * deliveryStops[next]), behavior: "instant" });
      lastScrollY = window.scrollY;
      entered = true;
      paintScrollProgress(element, deliveryStops[next], next);
    };
    const navigate = (event: Event) => {
      const next = marketplaceWorkstreams.findIndex(work => work.id === (event as CustomEvent<string>).detail);
      if (next < 0) return;
      select(next, "hash");
      landSelection(next);
    };
    const hashSelection = () => {
      cancelIntent();
      let id = "";
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const next = marketplaceWorkstreams.findIndex(work => work.id === id);
      if (next >= 0) select(next, "hash");
    };
    const preferenceChanged = () => {
      cancelIntent();
      element.dataset.reduced = String(reduced.matches);
      if (reduced.matches) { settleReveal(); details.forEach(detail => settleDisclosure(detail)); }
      positionFrame();
      measureScroll();
    };
    const resized = () => { cancelIntent(); positionFrame(); measureScroll(); };
    const keyboardInput = () => { keyboardMode = true; cancelIntent(); };
    const pointerInput = () => { keyboardMode = false; cancelIntent(); };
    const revealWorkspace = () => {
      if (wide.matches) return;
      const shell = element.closest("[data-portfolio-view]");
      const masthead = shell?.querySelector<HTMLElement>(":scope > .masthead");
      const navigation = element.closest("[data-confluence]")?.querySelector<HTMLElement>("[data-marketplace-navigation]");
      const top = (masthead?.offsetHeight ?? 62) + (navigation?.offsetHeight ?? 63);
      const viewport = window.visualViewport?.height ?? window.innerHeight;
      workspace.style.scrollMarginTop = `${top + Math.max(0, viewport - top) * .03}px`;
      workspace.scrollIntoView?.({ block: "start", behavior: "instant" });
    };
    const cleanups = choices.map((choice, i) => {
      const enter = (event: PointerEvent) => {
        cancelIntent();
        if (!hover.matches || !wide.matches || (event.pointerType !== "mouse" && event.pointerType !== "pen")) return;
        dwell = setTimeout(() => { if (!disposed && choice.isConnected) select(i, "hover"); }, DELIVERY_HOVER_DELAY);
      };
      const focus = () => select(i, "focus");
      const click = (event: MouseEvent) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        select(i, "click");
        landSelection(i);
        revealWorkspace();
      };
      const key = (event: KeyboardEvent) => {
        if (event.key !== " " && event.key !== "Enter") return;
        event.preventDefault();
        select(i, "click");
        landSelection(i);
        revealWorkspace();
      };
      choice.addEventListener("pointerenter", enter);
      choice.addEventListener("pointerleave", cancelIntent);
      choice.addEventListener("focus", focus);
      choice.addEventListener("click", click);
      choice.addEventListener("keydown", key);
      return () => {
        choice.removeEventListener("pointerenter", enter);
        choice.removeEventListener("pointerleave", cancelIntent);
        choice.removeEventListener("focus", focus);
        choice.removeEventListener("click", click);
        choice.removeEventListener("keydown", key);
      };
    });
    const detailCleanups = details.map(detail => {
      const summary = detail.querySelector<HTMLElement>("summary")!;
      const click = (event: MouseEvent) => { event.preventDefault(); toggleDisclosure(detail); };
      summary.addEventListener("click", click);
      return () => summary.removeEventListener("click", click);
    });
    panels.forEach(panel => panel.addEventListener("pointerenter", cancelIntent));
    document.addEventListener("wheel", cancelIntent, { passive: true });
    document.addEventListener("touchstart", cancelIntent, { passive: true });
    document.addEventListener("keydown", keyboardInput, true);
    document.addEventListener("pointerdown", pointerInput, true);
    window.addEventListener("blur", cancelIntent);
    window.addEventListener("hashchange", hashSelection);
    window.addEventListener("popstate", hashSelection);
    window.addEventListener("resize", resized);
    window.addEventListener("scroll", scheduleScroll, { passive: true });
    window.visualViewport?.addEventListener("resize", resized);
    element.addEventListener("close", resized, true);
    element.addEventListener("delivery-navigate", navigate);
    [reduced, hover, wide].forEach(query => query.addEventListener("change", preferenceChanged));
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(resized) : null;
    observer?.observe(index);
    observer?.observe(stage);
    if (masthead) observer?.observe(masthead);
    if (navigation) observer?.observe(navigation);
    choices.forEach(choice => observer?.observe(choice));
    element.style.setProperty("--delivery-frame-duration", `${DELIVERY_FRAME_DURATION}ms`);
    preferenceChanged();
    select(0, "initial");
    element.dataset.mode = "focused";
    measureScroll();
    hashSelection();
    document.fonts?.ready.then(() => { if (!disposed) resized(); });

    return () => {
      disposed = true;
      cancelIntent(); settleReveal(); observer?.disconnect(); cancelAnimationFrame(scrollRaf);
      details.forEach(detail => settleDisclosure(detail));
      detailCleanups.forEach(cleanup => cleanup());
      cleanups.forEach(cleanup => cleanup());
      panels.forEach(panel => {
        panel.removeEventListener("pointerenter", cancelIntent);
        panel.removeAttribute("aria-hidden");
        panel.removeAttribute("data-active");
        panel.inert = false;
        panel.removeAttribute("inert");
      });
      choices.forEach(choice => { choice.removeAttribute("role"); choice.removeAttribute("aria-pressed"); choice.removeAttribute("aria-expanded"); });
      document.removeEventListener("wheel", cancelIntent);
      document.removeEventListener("touchstart", cancelIntent);
      document.removeEventListener("keydown", keyboardInput, true);
      document.removeEventListener("pointerdown", pointerInput, true);
      window.removeEventListener("blur", cancelIntent);
      window.removeEventListener("hashchange", hashSelection);
      window.removeEventListener("popstate", hashSelection);
      window.removeEventListener("resize", resized);
      window.removeEventListener("scroll", scheduleScroll);
      window.visualViewport?.removeEventListener("resize", resized);
      element.removeEventListener("close", resized, true);
      element.removeEventListener("delivery-navigate", navigate);
      [reduced, hover, wide].forEach(query => query.removeEventListener("change", preferenceChanged));
      element.dataset.mode = "reading";
      element.dataset.scroll = "natural";
    };
  }, []);

  return <section ref={root} id="orchestration" className={styles.delivery} aria-labelledby="orchestration-heading"
    data-marketplace-section data-delivery-focus data-mode="reading" data-scroll="natural" data-selected={marketplaceWorkstreams[0].id}>
    <div className={styles.stage} data-delivery-stage>
    <header className={styles.heading}>
      <h2 id="orchestration-heading">The work between<br />three and one.</h2>
      <p>Catalog consolidation, provider workflows, and the legacy transition had to advance together.</p>
    </header>
    <div className={styles.main}>
      <div className={styles.statement}>
        <p className={styles.claim}>The transition<br />was part of<br /><span>the product.</span></p>
        <p className={styles.legacy}>Legacy data continued into the shared backend during the sunset period. The Marketplace launched alongside the sunsetting of Edu App Center.</p>
      </div>
      <div className={styles.workspace} data-delivery-workspace>
        <div className={styles.index} role="group" aria-label="Choose a delivery workstream" data-delivery-index>
          {marketplaceWorkstreams.map(work => <a key={work.id} className={styles.choice} href={`#${work.id}`}
            data-delivery-choice={work.id} aria-controls={work.id}>
            <span>{work.number}</span><span>{work.title}</span>
          </a>)}
          <span className={styles.frame} aria-hidden="true" data-delivery-frame />
        </div>
        <div className={styles.panels} data-delivery-tray>
          {marketplaceWorkstreams.map(work => <div key={work.id} id={work.id} className={styles.panel}
            data-delivery-panel={work.id} role="region" aria-labelledby={`${work.id}-heading`}>
            <p className={styles.panelMeta}><span>{work.number}</span>{work.label}</p>
            <h3 id={`${work.id}-heading`}>{work.title}</h3>
            <p className={styles.body}>{work.body}</p>
            <details className={styles.detail} data-delivery-detail>
              <summary>{work.detailLabel}<span aria-hidden="true" /></summary>
              <div className={styles.detailBody} data-delivery-detail-body><p>{work.detail}</p></div>
            </details>
          </div>)}
        </div>
        <p className={styles.status} role="status" aria-live="polite" data-delivery-status />
      </div>
      <div className={styles.planning}>
        <h3>Make the requirements inspectable.</h3>
        <p>The public discovery plan connects research themes with structure, priorities, and open questions.</p>
        <MarketplaceArtifact artifact={artifacts.publicPlan} code="A044" type="Annotated plan" className={styles.plan} />
        <figure id={artifacts.canvasPlan.id} className={styles.concept} data-marketplace-artifact data-delivery-concept>
          <div className={styles.conceptLink}>
            <span aria-hidden="true">{conceptTriggerLabel}</span>
            <MarketplaceImage artifact={artifacts.canvasPlan} triggerLabel={conceptTriggerLabel} />
          </div>
          <figcaption className={styles.status}>
            <strong>{artifacts.canvasPlan.label}</strong><p>{artifacts.canvasPlan.caption}</p>
          </figcaption>
        </figure>
      </div>
    </div>
    <ScrollProgress labels={marketplaceWorkstreams.map(work => work.number)} nextLabel="Continue to Impact" nextHref="#impact" className={styles.scrollCue} />
    </div>
  </section>;
}
