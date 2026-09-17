"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { PmfAsset } from "@/data/pmf";
import styles from "./pmf.module.css";

export function PmfArtifact({ artifact, sequence }: { artifact: PmfAsset; sequence?: readonly PmfAsset[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selectors = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const titleId = useId();
  const paneId = useId();
  const frames = sequence?.length ? sequence : [artifact];
  const current = frames[selected] ?? frames[0];
  const gallery = frames.length > 1;
  const disclosure = current.disclosure ?? "Original artifact · details withheld";

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [open]);

  const close = () => dialog.current?.close();
  return <figure className={styles.artifactFigure} data-pmf-gallery={gallery ? "prototype" : undefined}>
    <button id={paneId} ref={trigger} type="button" className={styles.artifact} aria-label={`${gallery ? "View image" : "View overview"}: ${current.title}`} aria-haspopup="dialog" onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
      {gallery ? <span className={styles.artifactFrames}>
        {frames.map((frame, index) => <Image key={frame.src} src={frame.src} alt={index === selected ? frame.alt : ""} aria-hidden={index !== selected} width={frame.width} height={frame.height} unoptimized loading="eager" className={styles.artifactImage} data-active={index === selected} />)}
      </span> : <Image src={current.src} alt={current.alt} width={current.width} height={current.height} unoptimized className={styles.artifactImage} />}
      <span className={styles.artifactAction}><span>{gallery ? "View image" : "View overview"}</span><span className={styles.inspectMark} aria-hidden="true" /></span>
    </button>
    {gallery && <div className={styles.artifactSelectors} role="group" aria-label="Prototype views">
      {frames.map((frame, index) => <button
        key={frame.src}
        ref={(element) => { selectors.current[index] = element; }}
        type="button"
        className={styles.artifactSelector}
        aria-pressed={selected === index}
        aria-controls={paneId}
        tabIndex={selected === index ? 0 : -1}
        onPointerEnter={(event) => { if (event.pointerType === "mouse") setSelected(index); }}
        onFocus={() => setSelected(index)}
        onClick={() => setSelected(index)}
        onKeyDown={(event) => {
          const next = event.key === "Home" ? 0 : event.key === "End" ? frames.length - 1 : event.key === "ArrowRight" ? (index + 1) % frames.length : event.key === "ArrowLeft" ? (index + frames.length - 1) % frames.length : null;
          if (next === null) return;
          event.preventDefault();
          selectors.current[next]?.focus({ preventScroll: true });
          setSelected(next);
        }}
      >
        <Image src={frame.src} alt="" width={frame.width} height={frame.height} unoptimized />
        <span>{frame.label ?? frame.title}</span>
      </button>)}
    </div>}
    <figcaption className={styles.artifactCaption}>
      {gallery ? <span className={styles.artifactCaptions} aria-live="polite" aria-atomic="true">{frames.map((frame, index) => <span key={frame.src} data-active={selected === index} aria-hidden={selected !== index}>{frame.caption}</span>)}</span> : <span>{current.caption}</span>}
      <span>{disclosure}</span>
    </figcaption>
    <dialog
      ref={dialog}
      className={styles.artifactDialog}
      aria-labelledby={titleId}
      onClose={() => { setOpen(false); trigger.current?.focus({ preventScroll: true }); }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        // Close is the overview's only interactive control. Keep keyboard focus
        // on the active surface rather than cycling through browser chrome.
        event.preventDefault();
        dialog.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }}
      onClick={(event) => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close(); } }}
    >
      <div className={styles.dialogHeader}>
        <div><h2 id={titleId}>{current.title}</h2><p>{disclosure}</p></div>
        <button type="button" onClick={close} autoFocus>Close<span className={styles.closeMark} aria-hidden="true" /></button>
      </div>
      <div className={styles.dialogImage}><Image src={current.src} alt={current.alt} width={current.width} height={current.height} unoptimized /></div>
    </dialog>
  </figure>;
}
