"use client";

import { useEffect, useRef } from "react";
import { getResearchFrame, researchNeeds, researchStops } from "./marketplace-research-sequence";
import styles from "./marketplace-research-lens.module.css";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function MarketplaceResearchLens() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = root.current!;
    const stage = element.querySelector<HTMLElement>("[data-lens-stage]")!;
    const field = element.querySelector<HTMLElement>("[data-lens-field]")!;
    const controls = element.querySelector<HTMLElement>("[data-lens-controls]")!;
    const zones = [...element.querySelectorAll<HTMLButtonElement>("[data-lens-zone]")];
    const choices = [...element.querySelectorAll<HTMLButtonElement>("[data-lens-choice]")];
    const notes = [...element.querySelectorAll<HTMLElement>("[data-lens-note]")];
    const focusFrame = element.querySelector<HTMLElement>("[data-lens-frame]")!;
    const connectors = element.querySelector<SVGSVGElement>("[data-lens-connectors]")!;
    const paths = [...connectors.querySelectorAll("path")];
    const marker = element.querySelector<HTMLElement>("[data-lens-marker]")!;
    const shared = element.querySelector<HTMLElement>("[data-lens-shared]")!;
    const caption = element.querySelector<HTMLElement>("[data-lens-caption]")!;
    const status = element.querySelector<HTMLElement>("[data-lens-status]")!;
    const outer = element.closest<HTMLElement>("[data-confluence]");
    const outerStage = outer?.querySelector<HTMLElement>("[data-confluence-stage]");
    const outerRunway = outer?.querySelector<HTMLElement>("[data-sequence-runway]");
    const masthead = element.closest("[data-portfolio-view]")?.querySelector<HTMLElement>(":scope > .masthead");
    const navigation = outer?.querySelector<HTMLElement>("[data-marketplace-navigation]");
    const viewportProbe = element.querySelector<HTMLElement>("[data-lens-viewport]")!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false, enhanced = false, measuring = false, restoringPosition = false, raf = 0, measureRaf = 0, motionRaf = 0;
    let stickyTop = 0, travel = 0, progress = 0, topic = 0, initialized = false;
    let manual: { from: number; to: number; time: number; expectedY: number } | null = null;
    let hoverTimer: ReturnType<typeof setTimeout> | undefined, hoverZone: HTMLElement | null = null;

    // During Catalogs' hold, a viewport rect gains scrollY without moving. Derive
    // this section's future document position from that outer runway instead.
    const start = () => {
      if (outer?.dataset.layout === "animated" && outerStage && outerRunway) {
        const outerTravel = parseFloat(outer.style.getPropertyValue("--travel")) || 0;
        const relativeTop = element.getBoundingClientRect().top - outerStage.getBoundingClientRect().top;
        return outerRunway.getBoundingClientRect().top + window.scrollY + outerTravel + relativeTop - stickyTop;
      }
      return element.getBoundingClientRect().top + window.scrollY - stickyTop;
    };
    const viewportKey = () => `${window.innerWidth}:${window.innerHeight}:${window.visualViewport?.height ?? window.innerHeight}`;
    const readPosition = () => {
      const y = window.scrollY, startY = start();
      const currentProgress = enhanced ? (y - startY) / Math.max(1, travel) : 0;
      const readingNote = notes.reduce((nearest, note) => Math.abs(note.getBoundingClientRect().top - stickyTop) < Math.abs(nearest.getBoundingClientRect().top - stickyTop) ? note : nearest, notes[0]);
      return {
        viewport: viewportKey(), enhanced, y, start: startY, travel,
        end: startY + (enhanced ? travel : element.offsetHeight), progress: currentProgress,
        topic: enhanced ? getResearchFrame(currentProgress).topic : Number(readingNote.dataset.topic),
        perspective: (enhanced ? currentProgress >= .5 ? "provider" : "educator" : readingNote.dataset.perspective) as "educator" | "provider",
        noteOffset: enhanced ? 0 : readingNote.getBoundingClientRect().top - stickyTop,
        followingTop: document.getElementById("orchestration")?.getBoundingClientRect().top,
      };
    };
    let lastPosition: ReturnType<typeof readPosition> | null = null;
    let pendingPosition: ReturnType<typeof readPosition> | null = null, restoreRaf = 0;
    const rememberPosition = () => {
      // Parent resize handlers can rebase or clamp scrolling before our scheduled
      // measurement. Keep the last position from the old viewport until restored.
      if (!restoringPosition && !measureRaf && (!lastPosition || lastPosition.viewport === viewportKey())) lastPosition = readPosition();
    };
    const stopHover = () => { clearTimeout(hoverTimer); hoverTimer = undefined; hoverZone = null; };
    const stopManual = () => { stopHover(); manual = null; cancelAnimationFrame(motionRaf); motionRaf = 0; };
    const stopRestoration = () => {
      cancelAnimationFrame(restoreRaf); restoreRaf = 0; pendingPosition = null; restoringPosition = false;
      if (initialized && !disposed) lastPosition = readPosition();
    };
    const draw = () => {
      raf = 0;
      if (disposed || measuring) return;
      progress = enhanced ? clamp((window.scrollY - start()) / Math.max(1, travel)) : 0;
      const frame = getResearchFrame(progress, field.clientWidth <= 780);
      topic = frame.topic;
      element.dataset.progress = String(progress); element.dataset.topic = String(topic);
      element.dataset.perspective = enhanced ? frame.perspective : "both";
      notes.forEach(note => {
        const selected = !enhanced || Number(note.dataset.topic) === topic;
        const opacity = !enhanced ? 1 : note.dataset.perspective === "educator" ? frame.educator : frame.provider;
        note.hidden = !selected;
        note.style.opacity = String(opacity);
        const direction = note.dataset.perspective === "educator" ? -frame.lens : 1 - frame.lens;
        note.style.transform = enhanced ? `translateX(${direction * 12 * (1 - frame.shared)}px)` : "none";
        note.setAttribute("aria-hidden", String(!selected || opacity < .35));
      });
      for (const button of choices) { button.disabled = !enhanced; button.setAttribute("aria-pressed", String(enhanced && (frame.perspective === "both" || button.dataset.lensChoice === frame.perspective))); }
      zones.forEach((button, index) => { button.disabled = !enhanced; button.setAttribute("aria-pressed", String(enhanced && index === topic)); });
      shared.style.opacity = enhanced ? String(frame.shared) : "1";
      shared.style.transform = enhanced ? `translateY(${12 * (1 - frame.shared)}px)` : "none";
      shared.setAttribute("aria-hidden", String(enhanced && frame.shared < .5));
      caption.textContent = enhanced ? researchNeeds[topic].label : "Three paired needs / One listing";
      if (!enhanced) { rememberPosition(); return; }
      const fieldRect = field.getBoundingClientRect(), rect = zones[topic].getBoundingClientRect();
      const x = rect.left - fieldRect.left, y = rect.top - fieldRect.top, midY = y + rect.height / 2;
      focusFrame.style.left = `${x - 5}px`; focusFrame.style.top = `${y - 3}px`;
      focusFrame.style.width = `${rect.width + 10}px`; focusFrame.style.height = `${rect.height + 6}px`;
      connectors.setAttribute("viewBox", `0 0 ${fieldRect.width} ${fieldRect.height}`);
      for (const [index, perspective] of ["educator", "provider"].entries()) {
        const note = notes.find(note => note.dataset.perspective === perspective && Number(note.dataset.topic) === topic)!;
        const noteRect = note.getBoundingClientRect(), noteY = noteRect.top - fieldRect.top + noteRect.height / 2;
        const isLeft = noteRect.left < rect.left;
        const source = isLeft ? noteRect.right - fieldRect.left + 2 : noteRect.left - fieldRect.left - 2;
        const endpoint = isLeft ? x - 5 : x + rect.width + 5;
        const bend = isLeft ? x - 16 : x + rect.width + 16;
        paths[index].setAttribute("d", `M ${source} ${noteY} H ${bend} V ${midY} H ${endpoint}`);
        paths[index].style.opacity = String((index ? frame.provider : frame.educator) * .7);
      }
      marker.style.width = `${44 + (controls.clientWidth - 44) * frame.shared}px`;
      marker.style.transform = `translateX(${(controls.clientWidth - 44) * frame.lens * (1 - frame.shared)}px)`;
      rememberPosition();
    };
    const schedule = () => { if (!raf && !disposed) raf = requestAnimationFrame(draw); };
    const restorePosition = (previous: ReturnType<typeof readPosition>) => {
      const following = document.getElementById("orchestration");
      let y: number;
      if (previous.y > previous.end && following && previous.followingTop !== undefined) {
        y = window.scrollY + following.getBoundingClientRect().top - previous.followingTop;
      } else if (previous.enhanced && enhanced) {
        y = start() + clamp(previous.progress) * travel;
      } else if (enhanced) {
        y = start() + researchStops[previous.perspective][previous.topic] * travel;
      } else {
        const selected = notes.find(note => Number(note.dataset.topic) === previous.topic && note.dataset.perspective === previous.perspective)!;
        y = selected.getBoundingClientRect().top + window.scrollY - stickyTop - previous.noteOffset;
      }
      window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
    };
    const deferRestoration = (previous: ReturnType<typeof readPosition>) => {
      pendingPosition ??= previous;
      if (restoreRaf) return;
      // The new runway also resizes Catalogs' reading container. Allow its
      // observer to settle, then reapply once; repeated measurements do not
      // restart this bounded two-frame deadline.
      restoreRaf = requestAnimationFrame(() => {
        restoreRaf = requestAnimationFrame(() => {
          restoreRaf = 0;
          if (disposed || !pendingPosition) return;
          draw(); restorePosition(pendingPosition);
          pendingPosition = null; restoringPosition = false;
          draw(); lastPosition = readPosition();
        });
      });
    };
    const measure = () => {
      measureRaf = 0;
      if (disposed || measuring) return;
      measuring = true;
      restoringPosition = true;
      const viewportChanged = !!lastPosition && lastPosition.viewport !== viewportKey();
      const previous = pendingPosition ?? (viewportChanged ? lastPosition! : readPosition());
      stopManual();
      stickyTop = (masthead?.offsetHeight ?? 0) + (navigation?.offsetHeight ?? 0) + 16;
      const viewport = Math.min(viewportProbe.offsetHeight || window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
      const available = viewport - stickyTop - 16;
      element.style.setProperty("--lens-top", `${stickyTop}px`);
      element.dataset.mode = "measure";
      const stageHeight = stage.offsetHeight;
      enhanced = !reduced.matches && stageHeight > 0 && stageHeight <= available && field.clientWidth >= 640;
      element.dataset.mode = enhanced ? "animated" : "reading";
      element.dataset.reason = enhanced ? "fits" : reduced.matches ? "reduced-motion" : "viewport-fit";
      travel = enhanced ? Math.max(1200, available * 3) : 0;
      element.style.setProperty("--lens-travel", `${travel}px`);
      element.style.setProperty("--lens-height", `${stageHeight}px`);
      measuring = false;
      draw(); // Finalize visibility before measuring any reading-mode destination.
      // A resize while reading must not move to a different need or lose the
      // following section when the Research runway changes height.
      if (initialized && (viewportChanged || previous.enhanced !== enhanced || Math.abs(previous.travel - travel) > 1) && previous.y >= previous.start) {
        restorePosition(previous);
        if (viewportChanged) deferRestoration(previous);
      }
      initialized = true; draw();
      if (!pendingPosition) { restoringPosition = false; lastPosition = readPosition(); }
    };
    const scheduleMeasure = () => { if (!measureRaf && !disposed) measureRaf = requestAnimationFrame(measure); };
    const go = (target: number) => {
      if (!enhanced) return;
      stopManual(); stopRestoration();
      manual = { from: window.scrollY, to: Math.max(0, start() + target * travel), time: performance.now(), expectedY: window.scrollY };
      const tick = (now: number) => {
        if (!manual || disposed) return;
        const t = clamp((now - manual.time) / 850), eased = 1 - (1 - t) ** 3;
        manual.expectedY = manual.from + (manual.to - manual.from) * eased;
        window.scrollTo({ top: manual.expectedY, behavior: "instant" });
        draw();
        if (t < 1) motionRaf = requestAnimationFrame(tick); else { manual = null; motionRaf = 0; }
      };
      motionRaf = requestAnimationFrame(tick);
    };
    const choose = (button: HTMLElement) => {
      const perspective = button.dataset.lensChoice ?? (progress >= .5 ? "provider" : "educator");
      const selectedTopic = button.dataset.lensZone === undefined ? topic : Number(button.dataset.lensZone);
      go(researchStops[perspective as keyof typeof researchStops][selectedTopic]);
      status.textContent = `${perspective === "educator" ? "Educator" : "Provider"} perspective: ${researchNeeds[selectedTopic].label.slice(4)}`;
    };
    const onClick = (event: MouseEvent) => {
      const button = (event.target as Element).closest<HTMLElement>("[data-lens-choice], [data-lens-zone]");
      if (button) choose(button);
      else if ((event.target as Element).closest("a")) { stopManual(); stopRestoration(); }
    };
    const onFocus = (event: FocusEvent) => { const target = event.target as HTMLElement; if (target.hasAttribute("data-lens-zone")) choose(target); };
    const onPointerMove = (event: PointerEvent) => {
      const button = (event.target as Element).closest<HTMLElement>("[data-lens-zone]");
      if (!button || event.pointerType !== "mouse" || !enhanced) { stopHover(); return; }
      if ((event.movementX || event.movementY) && !manual && Number(button.dataset.lensZone) !== topic && hoverZone !== button) {
        stopHover(); hoverZone = button;
        hoverTimer = setTimeout(() => { if (!disposed && enhanced && hoverZone === button) choose(button); }, 120);
      }
    };
    const onPointerOut = (event: PointerEvent) => { if (!(event.relatedTarget instanceof Element) || event.relatedTarget.closest("[data-lens-zone]") !== hoverZone) stopHover(); };
    const onScroll = () => { if (manual && Math.abs(window.scrollY - manual.expectedY) > 2) stopManual(); schedule(); };
    const onUserScroll = () => { stopManual(); stopRestoration(); };
    const onKey = (event: KeyboardEvent) => { stopHover(); stopRestoration(); if (["PageDown", "PageUp", "Home", "End", "ArrowDown", "ArrowUp", "Escape"].includes(event.key)) stopManual(); };
    const onHidden = () => { if (document.hidden) { stopManual(); stopRestoration(); } };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(stage); if (navigation) observer.observe(navigation);
    const outerObserver = new MutationObserver(scheduleMeasure);
    if (outer) outerObserver.observe(outer, { attributes: true, attributeFilter: ["data-ready", "data-layout"] });
    element.addEventListener("click", onClick); element.addEventListener("focusin", onFocus); element.addEventListener("pointermove", onPointerMove); element.addEventListener("pointerout", onPointerOut);
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", scheduleMeasure);
    window.visualViewport?.addEventListener("resize", scheduleMeasure); window.addEventListener("pageshow", scheduleMeasure);
    window.addEventListener("wheel", onUserScroll, { passive: true }); window.addEventListener("touchstart", onUserScroll, { passive: true });
    document.addEventListener("keydown", onKey); document.addEventListener("visibilitychange", onHidden);
    reduced.addEventListener("change", scheduleMeasure);
    measure(); document.fonts?.ready.then(() => { if (!disposed) scheduleMeasure(); });
    return () => {
      disposed = true; stopManual(); stopRestoration(); cancelAnimationFrame(raf); cancelAnimationFrame(measureRaf); observer.disconnect(); outerObserver.disconnect();
      element.removeEventListener("click", onClick); element.removeEventListener("focusin", onFocus); element.removeEventListener("pointermove", onPointerMove); element.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", scheduleMeasure); window.removeEventListener("pageshow", scheduleMeasure);
      window.visualViewport?.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("wheel", onUserScroll); window.removeEventListener("touchstart", onUserScroll);
      document.removeEventListener("keydown", onKey); document.removeEventListener("visibilitychange", onHidden); reduced.removeEventListener("change", scheduleMeasure);
    };
  }, []);

  return <div id="people" ref={root} className={styles.lens} data-research-lens data-mode="reading" data-progress="0">
    <span className={styles.viewport} data-lens-viewport aria-hidden="true" />
    <div className={styles.stage} data-lens-stage>
      <div className={styles.choices} data-lens-controls role="group" aria-label="Choose a perspective">
        <button type="button" data-lens-choice="educator" aria-pressed="false" disabled>Educator<span>Finding a fit</span></button>
        <span className={styles.center}>ONE LISTING</span>
        <button type="button" data-lens-choice="provider" aria-pressed="false" disabled>Provider<span>Being represented</span></button>
        <span className={styles.marker} data-lens-marker aria-hidden="true" />
      </div>
      <div className={styles.field} data-lens-field>
        <figure className={styles.product} aria-label="Illustrative ed-tech product listing with three research annotation areas">
          <div className={styles.chrome}><span>Marketplace / Product detail</span><span>ILLUSTRATIVE</span></div>
          <button type="button" className={styles.zone} data-lens-zone="0" aria-label="Explore discovery needs on this listing" aria-pressed="false" disabled>
            <span className={styles.identity}><span className={styles.productMark} aria-hidden="true" /><span><strong>Learning tool</strong><span className={styles.byline}>By a product provider</span></span><span className={styles.code}>A</span></span>
            <span className={styles.attributes}><span><small>Subject</small>Learning area</span><span><small>Education level</small>Learner group</span></span>
          </button>
          <button type="button" className={styles.zone} data-lens-zone="1" aria-label="Explore evaluation and representation needs on this listing" aria-pressed="false" disabled>
            <span className={styles.zoneHeading}>Product overview <span className={styles.code}>B</span></span>
            <span className={styles.overview}>What this tool helps people do.</span>
            <span className={styles.wireLines} aria-hidden="true"><i /><i /></span>
            <span className={styles.trust}><span>Interoperability</span><span>Privacy</span><span>Efficacy</span></span>
          </button>
          <button type="button" className={`${styles.zone} ${styles.contact}`} data-lens-zone="2" aria-label="Explore contact and inquiry needs on this listing" aria-pressed="false" disabled><span className={styles.contactAction}>Contact provider</span><span className={styles.code}>C</span></button>
          <figcaption>Conceptual listing · no specific product or certification</figcaption>
        </figure>
        {researchNeeds.flatMap((need, topic) => (["educator", "provider"] as const).map(perspective => <div key={`${perspective}-${topic}`} className={styles.note} data-lens-note data-topic={topic} data-perspective={perspective}>
          <span className={styles.noteLabel}>{need[perspective].label}</span><h3>{need[perspective].title}</h3><p>{need[perspective].body}</p>
        </div>))}
        <svg className={styles.connectors} data-lens-connectors aria-hidden="true"><path /><path /></svg>
        <span className={styles.focusFrame} data-lens-frame aria-hidden="true" />
      </div>
      <div className={styles.shared} data-lens-shared><p>Different needs.<br /><span>The same point of connection.</span></p><span>What an educator needs to understand is also what a provider needs to represent.</span></div>
      <div className={styles.bottomLine}><span data-lens-caption>Three paired needs / One listing</span><a href="#orchestration">Continue to Delivery</a></div>
      <p className="sr-only" data-lens-status role="status" aria-live="polite" />
    </div>
  </div>;
}
