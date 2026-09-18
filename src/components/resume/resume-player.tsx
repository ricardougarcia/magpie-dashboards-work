"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { ArrowDownToLine, Maximize2, Minimize2, RotateCcw, SkipForward } from "lucide-react";
import { createResumeRenderer, RESUME_DURATION, type ResumeDocument } from "@/lib/resume-motion";
import { ResumeDownloadDialog } from "./resume-download-dialog";
import styles from "./resume.module.css";

export function ResumePlayer({ children }: { children: ReactNode }) {
  const root = useRef<HTMLElement>(null);
  const finish = useRef<() => void>(() => {});
  const [replay, setReplay] = useState(0);
  const [complete, setComplete] = useState(false);
  const [actualSize, setActualSize] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);

  useEffect(() => {
    const element = root.current!;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const controller = new AbortController();
    let frame = 0;
    let disposed = false;
    let started = 0;
    let elapsed = 0;
    let renderers: ReturnType<typeof createResumeRenderer>[] = [];
    let vectors: ResumeDocument | undefined;
    let stopped = false;

    const settle = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      element.dataset.state = "complete";
      setComplete(true);
      renderers.forEach((renderer) => renderer.destroy());
      renderers = [];
    };
    finish.current = settle;

    const resize = () => {
      if (!vectors || stopped) return;
      renderers.forEach((renderer) => renderer.destroy());
      const canvases = [...element.querySelectorAll<HTMLCanvasElement>("canvas")];
      renderers = canvases.map((canvas, index) => {
        const width = canvas.parentElement!.clientWidth;
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(width * 792 / 612 * ratio);
        return createResumeRenderer(canvas, vectors!.pages[index], "construction-1");
      });
      renderers.forEach((renderer) => renderer.draw(elapsed));
    };

    const tick = (now: number) => {
      if (disposed || stopped) return;
      if (!started) started = now;
      elapsed = now - started;
      if (elapsed >= RESUME_DURATION) { settle(); return; }
      try {
        renderers.forEach((renderer) => renderer.draw(elapsed));
      } catch {
        settle();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const onPreference = () => { if (preference.matches) settle(); };
    const onVisibility = () => { if (document.hidden) settle(); };
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") settle(); };
    const resizeObserver = new ResizeObserver(resize);
    const fallback = window.setTimeout(settle, 10000);
    const firstSheet = element.querySelector<HTMLElement>("[data-resume-sheet]");
    if (firstSheet) resizeObserver.observe(firstSheet);
    preference.addEventListener("change", onPreference);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeprint", settle);
    window.addEventListener("keydown", onKey);

    element.dataset.state = "loading";
    if (preference.matches) settle();
    else {
      fetch("/resume-assets/resume-vectors.json", { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error("Resume vectors unavailable");
          return response.json() as Promise<ResumeDocument>;
        })
        .then((data) => {
          if (disposed || stopped) return;
          vectors = data;
          resize();
          element.dataset.state = "building";
          frame = requestAnimationFrame(tick);
        })
        .catch(() => { if (!disposed) settle(); });
    }

    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
      resizeObserver.disconnect();
      renderers.forEach((renderer) => renderer.destroy());
      preference.removeEventListener("change", onPreference);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeprint", settle);
      window.removeEventListener("keydown", onKey);
    };
  }, [replay]);

  function startAgain() {
    setComplete(false);
    if (root.current) root.current.dataset.state = "loading";
    setReplay((value) => value + 1);
  }

  return (
    <main ref={root} className={styles.resume} data-treatment="construction-1" data-size={actualSize ? "actual" : "fit"}>
      <div className={styles.viewport} tabIndex={actualSize ? 0 : undefined} aria-label={actualSize ? "Resume at full size. Scroll horizontally to read." : undefined} onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("[data-resume-download-trigger]")) {
          finish.current();
          setDownloadOpen(true);
        }
      }}>
        <div className={styles.pages}>{children}</div>
      </div>
      <nav className={styles.controls} aria-label="Resume controls">
        <button type="button" onClick={() => startAgain()} aria-label="Replay resume construction" title="Replay">
          <RotateCcw size={15} strokeWidth={1.5} /><span>Replay</span>
        </button>
        <button type="button" onClick={() => finish.current()} disabled={complete} aria-label="Show complete resume" title="Show complete resume (Escape)">
          <SkipForward size={15} strokeWidth={1.5} /><span>Finish</span>
        </button>
        <button type="button" onClick={() => setActualSize((value) => !value)} aria-pressed={actualSize} aria-label={actualSize ? "Fit resume to screen" : "View resume at full size"} title={actualSize ? "Fit to screen" : "Full size"}>
          {actualSize ? <Minimize2 size={15} strokeWidth={1.5} /> : <Maximize2 size={15} strokeWidth={1.5} />}<span>{actualSize ? "Fit" : "100%"}</span>
        </button>
        <a href="/resume-assets/Rico_Garcia_Resume.pdf" download aria-label="Download original resume PDF" title="Download original PDF"><ArrowDownToLine size={15} strokeWidth={1.5} /><span>PDF</span></a>
      </nav>
      {downloadOpen && <ResumeDownloadDialog onDismiss={() => setDownloadOpen(false)} />}
      <span className={styles.transcript} role="status">{complete ? "Resume complete." : "Resume construction in progress. Press Escape or select Finish to show it immediately."}</span>
    </main>
  );
}
