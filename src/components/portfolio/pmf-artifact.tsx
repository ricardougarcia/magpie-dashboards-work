"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import type { PmfAsset } from "@/data/pmf";
import styles from "./pmf.module.css";

export function PmfArtifact({ artifact }: { artifact: PmfAsset }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const titleId = useId();

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
  return <figure className={styles.artifactFigure}>
    <button ref={trigger} type="button" className={styles.artifact} aria-label={`View overview: ${artifact.title}`} aria-haspopup="dialog" onClick={() => { dialog.current?.showModal(); setOpen(true); }}>
      <Image src={artifact.src} alt={artifact.alt} width={artifact.width} height={artifact.height} unoptimized className={styles.artifactImage} />
      <span className={styles.artifactAction}><span>View overview</span><span className={styles.inspectMark} aria-hidden="true" /></span>
    </button>
    <figcaption className={styles.artifactCaption}><span>{artifact.caption}</span><span>Original artifact · details withheld</span></figcaption>
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
        <div><h2 id={titleId}>{artifact.title}</h2><p>Original artifact · details withheld</p></div>
        <button type="button" onClick={close} autoFocus>Close<span className={styles.closeMark} aria-hidden="true" /></button>
      </div>
      <div className={styles.dialogImage}><Image src={artifact.src} alt={artifact.alt} width={artifact.width} height={artifact.height} unoptimized /></div>
    </dialog>
  </figure>;
}
