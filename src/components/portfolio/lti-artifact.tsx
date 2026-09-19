"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import type { LtiAsset, LtiInspectionView } from "@/data/lti";
import styles from "./lti-artifact.module.css";

type LtiArtifactProps = {
  artifact: LtiAsset;
  views?: readonly LtiInspectionView[];
  inspectionHint?: string;
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

/** A working original-file link progressively enhanced with source inspection. */
export function LtiArtifact({ artifact, views, inspectionHint, compact = false, className, priority = false }: LtiArtifactProps) {
  const figure = useRef<HTMLElement>(null);
  const pointerInside = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const reveal = useRef<Animation | null>(null);
  const backdropPress = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [actualSize, setActualSize] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [noteDismissed, setNoteDismissed] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);
  const id = useId();
  const selectedView = views?.[viewIndex];
  const selectedAsset = selectedView?.artifact ?? artifact;
  const region = selectedView?.region;
  const imageWidth = region?.width ?? selectedAsset.width;
  const imageHeight = region?.height ?? selectedAsset.height;
  const viewLabel = selectedView?.label ?? selectedAsset.label;
  const relatedSources = views?.filter((view, index, all) => view.artifact.src !== artifact.src && all.findIndex((entry) => entry.artifact.src === view.artifact.src) === index);

  useEffect(() => {
    if (compact) return;
    const dismissNote = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || dialog.current?.open) return;
      if (pointerInside.current || figure.current?.contains(document.activeElement)) setNoteDismissed(true);
    };
    window.addEventListener("keydown", dismissNote);
    return () => window.removeEventListener("keydown", dismissNote);
  }, [compact]);

  useEffect(() => {
    const activeReveal = reveal;
    const preference = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const settle = () => {
      if (!preference?.matches) return;
      activeReveal.current?.cancel();
      activeReveal.current = null;
    };
    preference?.addEventListener?.("change", settle);
    return () => {
      preference?.removeEventListener?.("change", settle);
      activeReveal.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const rootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = rootOverflow;
    };
  }, [isOpen]);

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
      // Preserve the original-file link when modal inspection is unavailable.
      return;
    }
    event.preventDefault();
    cancelReveal();
    setIsOpen(true);
    setHasOpened(true);
    setActualSize(false);
    setViewIndex(0);
    setLoadFailed(false);
    closeButton.current?.focus({ preventScroll: true });
    if (viewport.current) {
      viewport.current.scrollTop = 0;
      viewport.current.scrollLeft = 0;
    }
    if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches && typeof paper.current?.animate === "function") {
      try {
        reveal.current = paper.current.animate([
          { opacity: .35, clipPath: "inset(0 0 9% 0)" },
          { opacity: 1, clipPath: "inset(0)" },
        ], { duration: 320, easing: "cubic-bezier(.16,1,.3,1)" });
      } catch {
        // The settled paper and its controls remain available without WAAPI.
      }
    }
  };

  const close = () => { cancelReveal(); dialog.current?.close(); };
  const outside = (x: number, y: number) => {
    const bounds = dialog.current!.getBoundingClientRect();
    return x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom;
  };

  return <figure ref={figure} id={artifact.id} className={`${styles.figure}${compact ? ` ${styles.compact}` : ""}${className ? ` ${className}` : ""}`} data-lti-artifact={artifact.code} data-note-dismissed={noteDismissed}
    onPointerEnter={() => { pointerInside.current = true; }}
    onPointerLeave={() => {
      pointerInside.current = false;
      if (!figure.current?.contains(document.activeElement)) setNoteDismissed(false);
    }}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget) && !pointerInside.current) setNoteDismissed(false);
    }}>
    <a ref={trigger} className={styles.source} href={artifact.src} target="_blank" rel="noopener noreferrer"
      aria-label={compact ? "Open original planning sheet" : `Inspect source: ${artifact.label}`} aria-haspopup="dialog" onClick={open} data-lti-source>
      <Image className={styles.preview} src={artifact.src} alt={artifact.alt} width={artifact.width} height={artifact.height}
        sizes={compact ? "(max-width: 600px) 140px, 200px" : "(max-width: 720px) 90vw, 70vw"}
        loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} data-lti-preview />
      <span className={styles.caption}>
        {compact ? "Open original planning sheet" : <><span>{artifact.code} / {artifact.label}</span><span>Inspect source</span></>}
      </span>
      {inspectionHint && <span className={styles.inspectionHint}>{inspectionHint}</span>}
    </a>
    <dialog ref={dialog} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={(event) => { event.preventDefault(); close(); }}
      onClose={() => {
        cancelReveal();
        backdropPress.current = false;
        setIsOpen(false);
        trigger.current?.focus({ preventScroll: true });
      }}
      onPointerDown={(event) => { backdropPress.current = event.target === event.currentTarget && outside(event.clientX, event.clientY); }}
      onClick={(event) => {
        const dismiss = backdropPress.current && event.target === event.currentTarget && outside(event.clientX, event.clientY);
        backdropPress.current = false;
        if (dismiss) close();
      }} data-lti-inspection>
      <button ref={closeButton} className={styles.close} type="button" onClick={close} aria-label="Close source inspection">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none"><path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.5" /></svg>
      </button>
      <div ref={paper} className={styles.inspectionPaper} data-lti-inspection-paper onFocusCapture={cancelReveal} onPointerDownCapture={cancelReveal}>
        <header className={styles.dialogHeader}>
          <h2 id={`${id}-title`} className={styles.dialogTitle}>{selectedAsset.label}</h2>
          <span className={styles.closeSpace} aria-hidden="true" />
          <div className={styles.tools}>
            <button type="button" aria-pressed={actualSize} aria-controls={`${id}-viewport`} onClick={() => {
              setActualSize((value) => !value);
              if (viewport.current) { viewport.current.scrollTop = 0; viewport.current.scrollLeft = 0; }
            }}>Actual size</button>
            <span className={styles.dimensions}>{imageWidth} × {imageHeight} px{region ? " · Source detail" : ""}</span>
            <a href={selectedAsset.src} target="_blank" rel="noopener noreferrer" aria-label={`Open original: ${selectedAsset.label} (opens in a new tab)`}>Open complete original</a>
          </div>
        </header>
        <div className={styles.inspectionBody} data-has-views={!!views?.length}>
          {!!views?.length && <nav className={styles.views} aria-label="Explore source views">
            {views.map((view, index) => <button key={view.id} type="button" aria-pressed={index === viewIndex}
              aria-controls={`${id}-viewport`} data-lti-view={view.id} onClick={() => {
                cancelReveal();
                setViewIndex(index);
                setActualSize(false);
                setLoadFailed(false);
                if (viewport.current) { viewport.current.scrollTop = 0; viewport.current.scrollLeft = 0; }
              }}>{view.label}</button>)}
          </nav>}
        <div ref={viewport} id={`${id}-viewport`} className={styles.imageViewport} tabIndex={0} role="region"
          aria-label={`${viewLabel}: ${actualSize ? "actual size, scroll to inspect" : region ? "source detail" : "complete image"}`}>
          <div className={styles.imageSurface} data-actual-size={actualSize} style={{ "--original-width": `${imageWidth}px`, "--original-height": `${imageHeight}px` } as CSSProperties}>
            {hasOpened && (region ? <svg key={selectedView.id} className={styles.original} role="img" aria-label={`${viewLabel}. ${selectedAsset.alt}`}
              width={imageWidth} height={imageHeight} viewBox={`${region.x} ${region.y} ${region.width} ${region.height}`}>
              <image href={selectedAsset.src} x="0" y="0" width={selectedAsset.width} height={selectedAsset.height}
                onLoad={() => setLoadFailed(false)} onError={() => setLoadFailed(true)} />
            </svg> : <Image key={selectedAsset.src} className={styles.original} src={selectedAsset.src} alt={selectedAsset.alt} width={selectedAsset.width} height={selectedAsset.height}
              unoptimized loading="eager" onLoad={() => setLoadFailed(false)} onError={() => setLoadFailed(true)} />)}
          </div>
        </div>
        </div>
        <footer className={styles.dialogFooter} tabIndex={0} aria-label="Source explanation">
          {loadFailed && <p role="status">The image could not load here. Open the original file to inspect it directly.</p>}
          <div aria-live="polite" aria-atomic="true">
            {selectedView && <p className={styles.viewTitle}>{viewLabel}</p>}
            <p id={`${id}-description`}>{selectedView?.note ?? artifact.caption}</p>
          </div>
        </footer>
      </div>
    </dialog>
    {!compact && <figcaption className={styles.note}>{artifact.caption}</figcaption>}
    {!!relatedSources?.length && <noscript><div className={styles.fallbackSources}>Related sources: {relatedSources.map((view) => <a key={view.artifact.id} href={view.artifact.src} target="_blank" rel="noopener noreferrer">{view.artifact.label}</a>)}</div></noscript>}
  </figure>;
}
