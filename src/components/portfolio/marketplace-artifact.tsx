"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { Artifact } from "@/lib/portfolio-types";
import styles from "./marketplace-artifact.module.css";

type ImageProps = { artifact: Artifact; priority?: boolean };

/** The original link remains usable before hydration and on modified activation. */
export function MarketplaceImage({ artifact, priority = false, triggerLabel }: ImageProps & { triggerLabel?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const reveal = useRef<Animation | null>(null);
  const backdropPress = useRef(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [actualSize, setActualSize] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const id = useId();

  useEffect(() => {
    const activeReveal = reveal;
    return () => { activeReveal.current?.cancel(); };
  }, []);

  const cancelReveal = () => {
    reveal.current?.cancel();
    reveal.current = null;
  };

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const surface = dialog.current;
    if (!surface || typeof surface.showModal !== "function") return;
    try {
      if (!surface.open) surface.showModal();
    } catch {
      // Preserve native navigation if the browser cannot open the inspection.
      return;
    }
    event.preventDefault();
    cancelReveal();
    setHasOpened(true);
    setActualSize(false);
    closeButton.current?.focus({ preventScroll: true });
    if (viewport.current) {
      viewport.current.scrollTop = 0;
      viewport.current.scrollLeft = 0;
    }
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reducedMotion && typeof paper.current?.animate === "function") {
      const bounds = surface.getBoundingClientRect();
      const source = event.currentTarget.getBoundingClientRect();
      const clamp = (value: number, limit: number) => Math.max(0, Math.min(value, limit));
      const insets = [
        clamp(source.top - bounds.top, bounds.height),
        clamp(bounds.right - source.right, bounds.width),
        clamp(bounds.bottom - source.bottom, bounds.height),
        clamp(source.left - bounds.left, bounds.width),
      ].map((value) => `${value}px`).join(" ");
      try {
        reveal.current = paper.current.animate([
          { clipPath: `inset(${insets})`, opacity: .75 },
          { clipPath: "inset(0px 0px 0px 0px)", opacity: 1 },
        ], { duration: 360, easing: "cubic-bezier(.22,1,.36,1)" });
      } catch {
        // The open original and its controls remain available without WAAPI.
      }
    }
  };

  const close = () => { cancelReveal(); dialog.current?.close(); };
  const outside = (x: number, y: number) => {
    const bounds = dialog.current!.getBoundingClientRect();
    return x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom;
  };

  return <>
    <a ref={trigger} className={styles.imageLink} href={artifact.src} target="_blank" rel="noopener noreferrer"
      aria-label={triggerLabel ?? `Inspect original: ${artifact.label}`} aria-haspopup="dialog" onClick={open} data-marketplace-image>
      <Image className={styles.previewImage} src={artifact.src} alt={artifact.alt} width={artifact.width} height={artifact.height}
        sizes="(max-width: 720px) 100vw, 70vw" loading={priority ? "eager" : "lazy"} />
    </a>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-caption`}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={() => { cancelReveal(); backdropPress.current = false; trigger.current?.focus({ preventScroll: true }); }}
      onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget && outside(event.clientX, event.clientY); }}
      onClick={(event) => {
        const dismiss = backdropPress.current && event.target === event.currentTarget && outside(event.clientX, event.clientY);
        backdropPress.current = false;
        if (dismiss) close();
      }} data-marketplace-inspection>
      <button ref={closeButton} className={styles.close} type="button" onClick={close} aria-label="Close image inspection">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <div ref={paper} className={styles.inspectionPaper} data-inspection-paper onFocusCapture={cancelReveal} onPointerDownCapture={cancelReveal}>
      <header className={styles.dialogHeader}>
        <h2 id={`${id}-title`} className={styles.dialogTitle}>{artifact.label}</h2>
        <span className={styles.closeSpace} aria-hidden="true" />
        <div className={styles.tools}>
          <button type="button" aria-pressed={actualSize} aria-controls={`${id}-viewport`} onClick={() => {
            setActualSize((value) => !value);
            if (viewport.current) { viewport.current.scrollTop = 0; viewport.current.scrollLeft = 0; }
          }}>Actual size</button>
          <span className={styles.dimensions}>{artifact.width} × {artifact.height} px</span>
          <a href={artifact.src} target="_blank" rel="noopener noreferrer" aria-label={`Open original: ${artifact.label} (opens in a new tab)`}>Open original in a new tab</a>
        </div>
      </header>
      <div ref={viewport} id={`${id}-viewport`} className={styles.imageViewport} tabIndex={0} role="region"
        aria-label={`${artifact.label}: ${actualSize ? "actual size, scroll to inspect" : "complete image"}`}>
        <div className={styles.imageSurface} data-actual-size={actualSize} style={{ "--original-width": `${artifact.width}px`, "--original-height": `${artifact.height}px` } as CSSProperties}>
          {hasOpened && <Image className={styles.original} src={artifact.src} alt={artifact.alt} width={artifact.width} height={artifact.height}
            unoptimized loading="eager" onLoad={() => setLoadFailed(false)} onError={() => setLoadFailed(true)} />}
        </div>
      </div>
      <footer className={styles.dialogFooter}>
        {loadFailed && <p role="status">The image could not load here. Use the original link to try opening the file directly.</p>}
        <p id={`${id}-caption`}>{artifact.caption}</p>
      </footer>
      </div>
    </dialog>
  </>;
}

export function MarketplaceArtifact({ artifact, code, type, className, priority }: ImageProps & { code: string; type: string; className?: string }) {
  return <figure id={artifact.id} className={`${styles.figure}${className ? ` ${className}` : ""}`} data-marketplace-artifact>
    <div className={styles.mount}>
      <div className={styles.register}><span>{code}</span><span>{type}</span></div>
      <MarketplaceImage artifact={artifact} priority={priority} />
    </div>
    <figcaption className={styles.caption}>
      <strong>{artifact.label}</strong>
      <p>{artifact.caption}</p>
      <a href={artifact.src} target="_blank" rel="noopener noreferrer" aria-label={`Inspect original: ${artifact.label} (opens in a new tab)`}>Inspect original</a>
    </figcaption>
  </figure>;
}
