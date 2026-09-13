"use client";

import { useEffect, useRef, useState } from "react";
import { marketplaceArtifacts as artifacts } from "@/data/marketplace";
import { MarketplaceImage } from "./marketplace-artifact";
import styles from "./marketplace-confluence.module.css";

const sources = [artifacts.ai, artifacts.appCenter, artifacts.library];
const clamp = (value: number) => Math.min(1, Math.max(0, value));

/** Frames register; the original screenshots never morph or imply record-level migration. */
export function MarketplaceConfluence() {
  const root = useRef<HTMLElement>(null);
  const note = useRef<HTMLDetailsElement>(null);
  const [selected, setSelected] = useState(0);
  const [productActive, setProductActive] = useState(false);
  const manual = useRef<{ product: boolean; y: number } | null>(null);
  const update = useRef<() => void>(() => {});

  useEffect(() => {
    const element = root.current!;
    const stage = element.querySelector<HTMLElement>("[data-confluence-stage]")!;
    const media = window.matchMedia("(min-width: 1000px) and (min-height: 760px) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let hashFrame = 0;
    let disposed = false;
    const paint = () => {
      frame = 0;
      if (disposed) return;
      const artifactHash = [artifacts.catalog, ...sources].some(artifact => window.location.hash === `#${artifact.id}`);
      const choreographed = media.matches && !artifactHash;
      element.dataset.choreography = String(choreographed);
      // An open original is a reading task: scroll restoration must not swap its trigger.
      if (element.querySelector("dialog[open]")) return;
      if (manual.current && Math.abs(window.scrollY - manual.current.y) > 40) manual.current = null;
      element.style.setProperty("--stage-height", `${stage.offsetHeight}px`);
      const distance = Math.max(1, element.offsetHeight - stage.offsetHeight);
      const progress = clamp((24 - element.getBoundingClientRect().top) / distance);
      const registration = clamp((progress - .20) / .40);
      let reveal = manual.current ? Number(manual.current.product) : clamp((progress - .60) / .25);
      const sourceLayer = element.querySelector<HTMLElement>("[data-source-layer]")!;
      const productLayer = element.querySelector<HTMLElement>("[data-product-layer]")!;
      // Keep the focused original available until focus leaves its reading layer.
      if (choreographed && sourceLayer.contains(document.activeElement)) reveal = 0;
      if (choreographed && productLayer.contains(document.activeElement)) reveal = 1;
      element.style.setProperty("--separation", `${(1 - registration) * 28}px`);
      element.style.setProperty("--reveal", `${reveal * 100}%`);
      element.style.setProperty("--line-opacity", String(1 - registration * .65));
      const product = choreographed && reveal >= .65;
      const scene = product ? "product" : "source";
      if (element.dataset.scene !== scene) setProductActive(product);
      element.dataset.scene = scene;
      // During the wipe, pointer hit testing follows each visible clipped original.
      // Keyboard/AT get one reading layer; a modal is a sibling of its image link.
      productLayer.inert = choreographed && reveal === 0;
      sourceLayer.inert = choreographed && reveal === 1;
      for (const [layer, inactive] of [[sourceLayer, choreographed && product], [productLayer, choreographed && !product]] as const) {
        layer.querySelectorAll<HTMLElement>("[data-marketplace-image]").forEach(link => {
          link.tabIndex = inactive ? -1 : 0;
          if (inactive) link.setAttribute("aria-hidden", "true");
          else link.removeAttribute("aria-hidden");
        });
      }
    };
    const schedule = () => { if (!frame && !disposed) frame = window.requestAnimationFrame(paint); };
    update.current = paint;
    element.dataset.ready = "true";
    paint();
    media.addEventListener("change", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("pageshow", schedule);
    element.addEventListener("focusin", schedule);
    element.addEventListener("focusout", schedule);
    const onHash = () => {
      window.cancelAnimationFrame(hashFrame);
      hashFrame = 0;
      const id = window.location.hash.slice(1);
      const index = sources.findIndex(source => source.id === id);
      if (id === artifacts.catalog.id || index >= 0) {
        if (index >= 0) setSelected(index);
        manual.current = { product: id === artifacts.catalog.id, y: window.scrollY };
        paint();
        window.cancelAnimationFrame(hashFrame);
        // A hidden source has no anchor geometry until React commits its selection.
        hashFrame = window.requestAnimationFrame(() => {
          hashFrame = window.requestAnimationFrame(() => {
            hashFrame = 0;
            if (!disposed && window.location.hash === `#${id}`) document.getElementById(id)?.scrollIntoView({ block: "start", behavior: "instant" });
          });
        });
      }
    };
    window.addEventListener("hashchange", onHash);
    onHash();
    const resize = new ResizeObserver(schedule);
    resize.observe(stage);
    document.fonts?.ready.then(schedule);
    return () => {
      disposed = true;
      update.current = () => {};
      window.cancelAnimationFrame(frame);
      window.cancelAnimationFrame(hashFrame);
      media.removeEventListener("change", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      window.removeEventListener("hashchange", onHash);
      element.removeEventListener("focusin", schedule);
      element.removeEventListener("focusout", schedule);
      resize.disconnect();
    };
  }, []);

  const choose = (index: number) => {
    setSelected(index);
    manual.current = { product: false, y: window.scrollY };
    update.current();
  };

  return <section ref={root} id="repositories" className={styles.confluence} aria-labelledby="repositories-heading" data-marketplace-section data-confluence data-scene="source" data-choreography="false">
    <div className={styles.stage} data-confluence-stage>
      <div className={styles.margin}>
        <h2 id="repositories-heading">Three catalogs.<br /><span>One shared <br />Marketplace.</span></h2>
        <p className={styles.invitation}>Choose a catalog. <br />Open the image to look closer.</p>
        <div className={styles.sources} role="group" aria-label="Source catalogs">
          {sources.map((artifact, index) => <a key={artifact.id} href={artifact.src} target="_blank" rel="noopener noreferrer" aria-current={!productActive && selected === index ? "true" : undefined} onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            event.preventDefault(); choose(index);
          }} data-source-choice={index}>
            <svg viewBox="0 0 26 26" aria-hidden="true"><path d="M1 9V1H9 M17 1H25V9 M25 17V25H17 M9 25H1V17" /><path d="M6 13H20 M13 6V20" /></svg>
            <span>{artifact.label}</span>
          </a>)}
        </div>
        <button className={styles.productChoice} type="button" onClick={() => { manual.current = { product: true, y: window.scrollY }; update.current(); }} data-product-choice aria-pressed={productActive}>{productActive ? "Shared Marketplace in view" : "View the shared Marketplace"}</button>
        <p className={styles.scrollHint}>Scroll to bring the frames together<span aria-hidden="true" /></p>
      </div>
      <div className={styles.evidence}>
        <div className={styles.registration} aria-hidden="true"><span /><span /><span /></div>
        <div className={styles.field}>
          <div className={styles.sourceLayer} data-source-layer>
            {sources.map((artifact, index) => <figure key={artifact.id} id={artifact.id} className={styles.source} hidden={selected !== index} data-marketplace-artifact>
              <MarketplaceImage artifact={artifact} priority={index === 0} />
            </figure>)}
          </div>
          <figure className={styles.productLayer} id={artifacts.catalog.id} data-product-layer data-marketplace-artifact>
            <MarketplaceImage artifact={artifacts.catalog} priority />
          </figure>
          <span className={styles.readingLine} aria-hidden="true" />
        </div>
        <div className={styles.caption}>
          <div className={styles.sourceCaption}><span>Source catalog / {String(selected + 1).padStart(2, "0")}</span><h3>{sources[selected].label}</h3><p>{sources[selected].caption}</p></div>
          <div className={styles.productCaption}><span>Shared product / original presentation</span><h3>The shared Marketplace</h3><p>One catalog foundation for discovery, trust signals, and provider-managed listings.</p></div>
          <details ref={note} className={styles.evidenceNote} onKeyDown={(event) => { if (event.key === "Escape" && note.current?.open) { note.current.open = false; note.current.querySelector("summary")?.focus(); } }}>
            <summary><span className={styles.noteMark} aria-hidden="true" />What came together</summary>
            <div><p>Product information, publishing rules, and provider workflows supported the shared catalog. Legacy data continued into the shared backend during the transition.</p><p><strong>Edu App Center was sunset.</strong> The source record does not establish that all three catalogs were retired.</p><button type="button" onClick={() => { if (note.current) { note.current.open = false; note.current.querySelector("summary")?.focus(); } }}>Close note</button></div>
          </details>
        </div>
      </div>
    </div>
  </section>;
}
