"use client";

import Image from "next/image";
import { useLayoutEffect, useRef, useState } from "react";
import type { Artifact } from "@/lib/portfolio-types";
import styles from "./region.module.css";

export function ArtifactCrop({ artifact, detail, magnification = 1 }: { artifact: Artifact; detail: NonNullable<Artifact["details"]>[number]; magnification?: number }) {
  const { x, y, width, height } = detail.crop;
  return <div className={styles.crop} style={{ aspectRatio: `${artifact.width * width} / ${artifact.height * height}` }}>
    <Image src={artifact.src} alt={`${detail.label}: ${detail.caption}`} width={artifact.width} height={artifact.height} sizes={`(max-width: 760px) ${250 * magnification}vw, ${2400 * magnification}px`} style={{ width: `${100 / width}%`, maxWidth: "none", left: `${-100 * x / width}%`, top: `${-100 * y / height}%` }} />
  </div>;
}

export function ArtifactViewer({ artifact }: { artifact: Artifact }) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  const detail = artifact.details?.find((entry) => entry.id === detailId);
  const crop = detail?.crop ?? { x: 0, y: 0, width: 1, height: 1 };
  const ratio = artifact.width * crop.width / (artifact.height * crop.height);
  const viewportId = `${artifact.id}-viewport`;
  useLayoutEffect(() => {
    if (viewport.current) {
      viewport.current.scrollLeft = (viewport.current.scrollWidth - viewport.current.clientWidth) / 2;
      viewport.current.scrollTop = 0;
    }
  }, [zoom, detailId]);
  const selectView = (id: string | null) => { setDetailId(id); setZoom(1); };
  return <div className={styles.viewer}>
    <div className={styles.viewerControls} role="group" aria-label={`${artifact.label} views`}>
      <button type="button" aria-pressed={!detail} aria-controls={viewportId} onClick={() => selectView(null)}>Overview</button>
      {artifact.details?.map((entry) => <button key={entry.id} type="button" aria-pressed={entry.id === detail?.id} aria-controls={viewportId} onClick={() => selectView(entry.id)}>{entry.label}</button>)}
    </div>
    <div className={styles.zoomControls} role="group" aria-label="Map magnification">
      <span>{zoom > 1 ? "Scroll / swipe to inspect" : "Complete view"}</span>
      <button type="button" disabled={zoom === 1} aria-label="Zoom out on map" onClick={() => setZoom((value) => Math.max(1, value - 1))}>−</button>
      <output aria-label="Map zoom">{zoom}×</output>
      <button type="button" disabled={zoom === 4} aria-label="Zoom in on map" onClick={() => setZoom((value) => Math.min(4, value + 1))}>+</button>
    </div>
    <div ref={viewport} id={viewportId} className={styles.viewerViewport} tabIndex={0} role="region" aria-label={`${detail?.label ?? artifact.label}, ${zoom} times magnification`} style={{ aspectRatio: String(ratio) }}>
      <div className={styles.viewerSurface} style={{ width: `${zoom * 100}%` }}>
      <div className={styles.viewerMap} data-map-camera style={{ paddingTop: `${100 / ratio}%` }}>
        <Image src={artifact.src} alt={detail ? `${detail.label}: ${detail.caption}` : artifact.alt} width={artifact.width} height={artifact.height} sizes="(max-width: 760px) 1000vw, 6000px" style={{ width: `${100 / crop.width}%`, left: `${-100 * crop.x / crop.width}%`, top: `${-100 * crop.y / crop.height}%` }} />
      </div>
      </div>
    </div>
    <div className={styles.viewerCaption}>
      <p aria-live="polite">{detail?.caption ?? artifact.caption}</p>
      {detail ? <div className={styles.locator} aria-label={`${detail.label} location within the full map`} role="img">
        <Image src={artifact.src} alt="" width={artifact.width} height={artifact.height} sizes="112px" />
        <span style={{ left: `${detail.crop.x * 100}%`, top: `${detail.crop.y * 100}%`, width: `${detail.crop.width * 100}%`, height: `${detail.crop.height * 100}%` }} />
      </div> : <span className={styles.viewHint}>Choose a detail to inspect ↗</span>}
    </div>
  </div>;
}
