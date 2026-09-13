"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { marketplaceArtifacts as artifacts } from "@/data/marketplace";
import { MarketplaceImage } from "./marketplace-artifact";
import { getMarketplaceFrame, marketplaceImageStops } from "./marketplace-sequence";
import styles from "./marketplace-confluence.module.css";

const images = [artifacts.ai, artifacts.appCenter, artifacts.library, artifacts.catalog];
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const hashId = () => { try { return decodeURIComponent(window.location.hash.slice(1)); } catch { return ""; } };

/** One reading DOM continues after the held opening; no screenshot or research duplicates. */
export function MarketplaceConfluence({ intro, children }: { intro: ReactNode; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const note = useRef<HTMLDetailsElement>(null);
  const go = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    const element = root.current!;
    const stage = element.querySelector<HTMLElement>("[data-confluence-stage]")!;
    const opening = element.querySelector<HTMLElement>("[data-opening]")!;
    const reading = element.querySelector<HTMLElement>("[data-sequence-reading]")!;
    const article = reading.querySelector<HTMLElement>("article");
    const runway = element.querySelector<HTMLElement>("[data-sequence-runway]")!;
    const probe = element.querySelector<HTMLElement>("[data-viewport-probe]")!;
    const navigation = reading.querySelector<HTMLElement>("[data-marketplace-navigation]");
    const links = [...reading.querySelectorAll<HTMLAnchorElement>("[data-nav-section]")];
    const frames = [...opening.querySelectorAll<HTMLElement>("[data-catalog-frame]")];
    const choices = [...opening.querySelectorAll<HTMLAnchorElement>("[data-image-choice]")];
    const origin = opening.querySelector<HTMLElement>("[data-catalog-origin]")!;
    const word = element.querySelector<HTMLElement>("[data-traveling-word]")!;
    const destination = reading.querySelector<HTMLElement>("[data-catalog-destination]");
    const masthead = element.closest("[data-portfolio-view]")?.querySelector<HTMLElement>(":scope > .masthead");
    const evidenceNote = note.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false, raf = 0, hashRaf = 0, measuring = false, initialized = false;
    let enhanced = false, headerHeight = 0, height = 0, travel = 0;
    let geometry: { x: number; y: number; dx: number; dy: number; scale: number } | null = null;
    let keyboard = false;

    const documentTop = () => runway.getBoundingClientRect().top + window.scrollY;
    const start = () => documentTop() - headerHeight;
    const artifactHash = () => images.some(image => hashId() === image.id);
    const isInspecting = () => !!element.querySelector("dialog[open]");
    const measureWord = () => {
      if (!destination) return;
      const from = origin.getBoundingClientRect(), to = destination.getBoundingClientRect(), box = stage.getBoundingClientRect();
      const font = getComputedStyle(origin), targetFont = getComputedStyle(destination);
      word.style.font = font.font; word.style.letterSpacing = font.letterSpacing;
      // The nav may already be sticky after release. Its label's local offset is
      // stable; its viewport position relative to a released stage is not.
      const navTop = navigation?.getBoundingClientRect().top ?? box.top;
      geometry = { x: from.left - box.left, y: from.top - box.top, dx: to.left - box.left, dy: to.top - navTop, scale: parseFloat(targetFont.fontSize) / parseFloat(font.fontSize) };
    };
    const setCurrentSection = (progress: number) => {
      let current = "repositories";
      if (enhanced && progress < 1) current = progress >= .84 ? "investigation" : "repositories";
      else {
        const threshold = headerHeight + (navigation?.offsetHeight ?? 0) + 80;
        for (const link of links) {
          const target = document.getElementById(link.hash.slice(1));
          if (target && target.getBoundingClientRect().top <= threshold) current = link.hash.slice(1);
        }
        if (window.scrollY > 0 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = links.at(-1)?.hash.slice(1) ?? current;
      }
      for (const link of links) {
        if (link.hash === `#${current}`) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    };
    const paint = () => {
      raf = 0;
      if (disposed || measuring || isInspecting()) return;
      const progress = enhanced ? clamp((window.scrollY - start()) / Math.max(1, travel)) : 0;
      let frame = getMarketplaceFrame(progress);
      // A keyboard reader keeps the focused original/note until leaving it.
      const focused = keyboard ? document.activeElement?.closest<HTMLElement>("[data-catalog-frame]") : null;
      if (enhanced && focused) frame = getMarketplaceFrame(marketplaceImageStops[Number(focused.dataset.catalogFrame)]);
      if (enhanced && keyboard && evidenceNote?.contains(document.activeElement)) frame = getMarketplaceFrame(.70);
      if (enhanced && keyboard && reading.contains(document.activeElement)) frame = getMarketplaceFrame(1);
      element.dataset.progress = String(progress); element.dataset.selected = String(frame.selected);
      element.dataset.scene = enhanced && frame.arrival > 0 ? "research" : frame.selected === 3 ? "product" : "source";
      element.style.setProperty("--separation", `${28 * (1 - frame.registration)}px`);
      element.style.setProperty("--line-opacity", String(1 - .65 * frame.registration));
      element.style.setProperty("--reveal", `${frame.reveal * 100}%`);
      element.style.setProperty("--wipe-progress", String(frame.reveal));
      element.dataset.wiping = String(enhanced && frame.from !== frame.to);
      frames.forEach((figure, index) => {
        const visible = !enhanced || index === frame.from || index === frame.to;
        const selected = !enhanced || index === frame.selected;
        const link = figure.querySelector<HTMLElement>("[data-marketplace-image]")!;
        const caption = figure.querySelector<HTMLElement>("figcaption")!;
        figure.hidden = !visible; figure.inert = !visible;
        figure.style.zIndex = enhanced && index === frame.to ? "2" : "1";
        link.style.clipPath = enhanced && frame.from !== frame.to && index === frame.to ? `inset(0 0 ${100 - frame.reveal * 100}% 0)` : "none";
        link.tabIndex = selected ? 0 : -1;
        if (selected) link.removeAttribute("aria-hidden"); else link.setAttribute("aria-hidden", "true");
        caption.hidden = !selected;
        caption.style.opacity = enhanced ? String(1 - .55 * Math.sin(frame.reveal * Math.PI) ** 2) : "1";
      });
      choices.forEach((choice, index) => {
        if (enhanced && frame.selected === index) choice.setAttribute("aria-current", "true");
        else choice.removeAttribute("aria-current");
      });
      opening.style.setProperty("--departure", enhanced ? String(frame.departure) : "1");
      opening.inert = enhanced && frame.departure === 0;
      if (article) { article.style.opacity = enhanced ? String(frame.arrival) : "1"; article.style.transform = enhanced ? `translateY(${(1 - frame.arrival) * 24}px)` : "none"; }
      reading.inert = enhanced && frame.arrival < .95;
      if (navigation) navigation.style.opacity = enhanced ? String(frame.nav) : "1";
      origin.style.visibility = enhanced && frame.handoff > 0 ? "hidden" : "visible";
      if (destination) destination.style.opacity = enhanced ? String(frame.wordBlend) : "1";
      word.style.visibility = "hidden";
      if (enhanced && geometry && frame.handoff > 0 && frame.handoff < 1) {
        const t = frame.handoff, x = geometry.x + (geometry.dx - geometry.x) * t, y = geometry.y + (geometry.dy - geometry.y) * t;
        word.style.visibility = "visible"; word.style.transform = `translate(${x}px, ${y}px) scale(${1 + (geometry.scale - 1) * t})`; word.style.opacity = String(1 - frame.wordBlend);
      }
      setCurrentSection(frame.arrival === 1 && progress < 1 ? 1 : progress);
    };
    const schedule = () => { if (!raf && !disposed) raf = requestAnimationFrame(paint); };
    const measure = () => {
      if (disposed || measuring || isInspecting()) return;
      measuring = true;
      const wasEnhanced = enhanced, oldStart = start(), oldTravel = travel, oldScrollY = window.scrollY;
      const oldProgress = oldTravel ? (oldScrollY - oldStart) / oldTravel : 0;
      const oldReadingTop = reading.getBoundingClientRect().top + window.scrollY;
      let oldSelected = Number(element.dataset.selected ?? 0);
      if (!wasEnhanced) {
        const visibleFrame = frames.findLast(figure => {
          const rect = figure.getBoundingClientRect();
          return rect.height > 0 && rect.top <= headerHeight + window.innerHeight * .4 && rect.bottom > headerHeight;
        });
        if (visibleFrame) oldSelected = Number(visibleFrame.dataset.catalogFrame);
      }
      headerHeight = masthead?.offsetHeight ?? 0;
      // Stable small-viewport units prevent browser-toolbar motion changing the runway.
      const viewport = Math.min(probe.offsetHeight || window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
      height = Math.max(1, viewport - headerHeight);
      element.style.setProperty("--stage-height", `${height}px`); element.style.setProperty("--masthead-height", `${headerHeight}px`);
      element.dataset.layout = "measure";
      const portrait = window.innerWidth >= 720 || viewport > window.innerWidth;
      const enoughSpace = height >= (window.innerWidth < 720 ? 660 : 540) && opening.offsetHeight > 0 && opening.offsetHeight <= height - 12;
      enhanced = !reduced.matches && !artifactHash() && portrait && enoughSpace;
      element.dataset.choreography = String(enhanced); element.dataset.layout = enhanced ? "animated" : "static";
      element.dataset.reason = enhanced ? "fits" : reduced.matches ? "reduced-motion" : artifactHash() ? "artifact-hash" : "viewport-fit";
      travel = height * (window.innerWidth < 720 ? 2.5 : 2.8);
      element.style.setProperty("--travel", `${travel}px`);
      element.style.setProperty("--continuation-height", `${enhanced ? Math.max(0, reading.offsetHeight - height) : 0}px`);
      measuring = false;
      // Restore all static figures before measuring their navigation positions.
      if (wasEnhanced !== enhanced) paint();
      measureWord();
      // Compact measurement can temporarily shorten the document and clamp scrollY.
      // Restore the saved reading position after the full runway returns.
      if (initialized && wasEnhanced && enhanced && (Math.abs(oldTravel - travel) > 1 || Math.abs(window.scrollY - oldScrollY) > 1)) {
        const y = oldProgress <= 1 ? start() + clamp(oldProgress) * travel : start() + travel + (oldScrollY - oldStart - oldTravel);
        window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
      } else if (initialized && wasEnhanced !== enhanced && !artifactHash()) {
        if (!enhanced) {
          if (oldProgress < .84) frames[oldSelected]?.scrollIntoView({ block: "start", behavior: "instant" });
          else window.scrollTo({ top: Math.max(0, reading.getBoundingClientRect().top + window.scrollY - headerHeight + Math.max(0, oldScrollY - oldStart - oldTravel)), behavior: "instant" });
        } else if (oldScrollY >= oldReadingTop - headerHeight) window.scrollTo({ top: Math.max(0, start() + travel + oldScrollY - oldReadingTop + headerHeight), behavior: "instant" });
        else if (oldScrollY > headerHeight) window.scrollTo({ top: Math.max(0, start() + travel * marketplaceImageStops[oldSelected]), behavior: "instant" });
      }
      initialized = true; element.dataset.ready = "true"; paint();
    };
    const land = (id: string, focus = false) => {
      const target = document.getElementById(id);
      if (!target) return;
      if (focus && id === "repositories" && reading.contains(document.activeElement)) (document.activeElement as HTMLElement).blur();
      if (enhanced && id === "repositories") window.scrollTo({ top: Math.max(0, start()), behavior: "instant" });
      else if (enhanced && reading.contains(target)) {
        const relative = target.getBoundingClientRect().top - stage.getBoundingClientRect().top;
        const navHeight = navigation?.offsetHeight ?? 0;
        const y = id === "investigation" ? start() + travel : documentTop() + travel + relative - headerHeight - navHeight - 24;
        window.scrollTo({ top: Math.max(0, y), behavior: "instant" });
      } else target.scrollIntoView({ block: "start", behavior: "instant" });
      paint();
      if (focus) {
        const destination = id === "repositories" ? choices[0] : links.find(link => link.hash === `#${id}`);
        destination?.focus({ preventScroll: true });
      }
    };
    const onHash = () => {
      cancelAnimationFrame(hashRaf);
      const id = hashId();
      if (!id) { measure(); return; }
      measure();
      hashRaf = requestAnimationFrame(() => { hashRaf = requestAnimationFrame(() => { hashRaf = 0; if (!disposed && hashId() === id) land(id); }); });
    };
    const activate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link || !element.contains(link)) return;
      const id = link.hash.slice(1);
      if (!document.getElementById(id)) return;
      event.preventDefault();
      if (window.location.hash !== link.hash) window.history.pushState(null, "", link.hash);
      if (artifactHash()) { onHash(); return; }
      measure(); land(id, link.hasAttribute("data-continue-research") || link.hasAttribute("data-nav-section"));
    };
    go.current = (index) => {
      if (enhanced) window.scrollTo({ top: Math.max(0, start() + travel * marketplaceImageStops[index]), behavior: "instant" });
      else frames[index].scrollIntoView({ block: "start", behavior: "instant" });
      paint();
    };
    const onKeyboard = (event: KeyboardEvent) => { if (event.key === "Tab" || event.key.startsWith("Arrow")) keyboard = true; };
    const onPointer = () => { keyboard = false; schedule(); };
    const onClose = () => { measure(); schedule(); };
    const onResize = () => measure();
    const observer = new ResizeObserver(measure);
    observer.observe(opening); observer.observe(reading); if (masthead) observer.observe(masthead);
    measure(); if (window.location.hash) onHash();
    reduced.addEventListener("change", onResize);
    window.addEventListener("scroll", schedule, { passive: true }); window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("pageshow", onResize); window.addEventListener("hashchange", onHash); window.addEventListener("popstate", onHash);
    document.addEventListener("keydown", onKeyboard); document.addEventListener("pointerdown", onPointer);
    element.addEventListener("click", activate); element.addEventListener("focusin", schedule); element.addEventListener("focusout", schedule); element.addEventListener("close", onClose, true);
    evidenceNote?.addEventListener("toggle", onResize);
    document.fonts?.ready.then(() => { if (!disposed) { measure(); if (window.location.hash) onHash(); } });
    return () => {
      disposed = true; go.current = () => {}; cancelAnimationFrame(raf); cancelAnimationFrame(hashRaf); observer.disconnect();
      reduced.removeEventListener("change", onResize);
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", onResize); window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("pageshow", onResize); window.removeEventListener("hashchange", onHash); window.removeEventListener("popstate", onHash);
      document.removeEventListener("keydown", onKeyboard); document.removeEventListener("pointerdown", onPointer);
      element.removeEventListener("click", activate); element.removeEventListener("focusin", schedule); element.removeEventListener("focusout", schedule); element.removeEventListener("close", onClose, true);
      evidenceNote?.removeEventListener("toggle", onResize);
    };
  }, []);

  return <div ref={root} className={styles.confluence} data-confluence data-layout="static" data-choreography="false" data-selected="0">
    <span className={styles.viewportProbe} data-viewport-probe aria-hidden="true" />
    <div className={styles.runway} data-sequence-runway><div className={styles.stage} data-confluence-stage>
      <div className={styles.opening} data-opening>
        <div className={styles.intro}>{intro}</div>
        <section id="repositories" className={styles.catalogs} aria-labelledby="repositories-heading" data-marketplace-section>
          <div className={styles.margin}>
            <h2 id="repositories-heading"><span data-heading-remainder>Three </span><span data-catalog-origin>catalogs</span><span data-heading-remainder>.<br /><span className={styles.muted}>One shared <br className={styles.desktopBreak} />Marketplace.</span></span></h2>
            <p className={styles.invitation}>Scroll through the catalogs.<br />Open an image to look closer.</p>
            <div className={styles.sources} role="group" aria-label="Catalog images">{images.map((artifact, index) => <a key={artifact.id} href={artifact.src} target="_blank" rel="noopener noreferrer" data-image-choice={index} data-source-choice={index < 3 ? index : undefined} data-product-choice={index === 3 ? "" : undefined} onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
              event.preventDefault(); go.current(index);
            }}><svg viewBox="0 0 26 26" aria-hidden="true"><path d="M1 9V1H9 M17 1H25V9 M25 17V25H17 M9 25H1V17" /><path d="M6 13H20 M13 6V20" /></svg><span>{index === 3 ? "Shared Marketplace" : artifact.label}</span></a>)}</div>
            <a href="#investigation" className={styles.continue} data-continue-research>Continue to Research</a>
          </div>
          <div className={styles.evidence}>
            <div className={styles.registration} aria-hidden="true"><span /><span /></div>
            <div className={styles.field}>{images.map((artifact, index) => <figure key={artifact.id} id={artifact.id} className={styles.image} data-catalog-frame={index} data-marketplace-artifact>
              <MarketplaceImage artifact={artifact} priority />
              <figcaption><span>{index === 3 ? "Shared product / original presentation" : `Source catalog / ${String(index + 1).padStart(2, "0")}`}</span><h3>{index === 3 ? "The shared Marketplace" : artifact.label}</h3><p>{index === 3 ? "One catalog foundation for discovery, trust signals, and provider-managed listings." : artifact.caption}</p></figcaption>
            </figure>)}<span className={styles.readingLine} aria-hidden="true" /></div>
            <details ref={note} className={styles.evidenceNote} onKeyDown={(event) => { if (event.key === "Escape" && note.current?.open) { note.current.open = false; note.current.querySelector("summary")?.focus(); } }}>
              <summary><span className={styles.noteMark} aria-hidden="true" />What came together</summary>
              <div><p>Product information, publishing rules, and provider workflows supported the shared catalog. Legacy data continued into the shared backend during the transition.</p><p><strong>Edu App Center was sunset.</strong> The source record does not establish that all three catalogs were retired.</p><button type="button" onClick={() => { if (note.current) { note.current.open = false; note.current.querySelector("summary")?.focus(); } }}>Close note</button></div>
            </details>
          </div>
        </section>
      </div>
      <div className={styles.reading} data-sequence-reading>{children}</div>
      <span className={styles.word} data-traveling-word aria-hidden="true">catalogs</span>
    </div></div>
    <div className={styles.continuation} aria-hidden="true" />
  </div>;
}
