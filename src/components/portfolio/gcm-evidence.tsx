"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gcmAssets, gcmBehaviors, gcmDecisions, gcmDemoSrc } from "@/data/gcm";
import styles from "./gcm.module.css";

export function GcmEvidence() {
  const [selected, setSelected] = useState(0);
  const [changed, setChanged] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const decision = gcmDecisions[selected];
  const cancelHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };
  useEffect(() => () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); }, []);
  const select = (index: number) => {
    cancelHover();
    if (index === selected) return;
    if (video.current && !video.current.paused) video.current.pause();
    setChanged(true); setSelected(index);
  };

  return <section id="product-work" className={`${styles.section} ${styles.readingSection}`} data-gcm-reading-section="product-work" data-gcm-steps="1" aria-labelledby="gcm-work-heading">
    <div className={styles.readingStage} data-gcm-reading-stage>
    <header className={styles.sectionHead}><div><p className={styles.meta}>02 / The product work</p><h2 id="gcm-work-heading">Make the work<br />behind the demo visible.</h2></div><p>Relevant data. A connected system. Answers that could be evaluated.</p></header>
    <div className={styles.evidenceChoices} role="group" aria-label="Explore the work behind the demo">
      {gcmDecisions.map((item, index) => <button key={item.id} type="button" aria-pressed={index === selected} aria-controls="gcm-evidence-panel"
        onPointerEnter={(event) => {
          if (event.pointerType !== "mouse") return;
          cancelHover();
          hoverTimer.current = setTimeout(() => select(index), 120);
        }} onPointerLeave={cancelHover} onPointerDown={cancelHover} onFocus={() => select(index)} onClick={() => select(index)}>
        {String(index).padStart(2, "0")} / {item.label}
      </button>)}
    </div>
    <div id="gcm-evidence-panel" className={styles.evidenceLayout} data-gcm-evidence={decision.id}>
      <div>
        <div className={styles.evidenceStage}>
          <div hidden={decision.id !== "demo"} className={`${styles.evidenceView} ${changed && decision.id === "demo" ? styles.evidenceEnter : ""}`}>
            <video ref={video} className={styles.video} controls playsInline preload="none" poster={gcmAssets.poster} aria-label="Original GCM product demonstration, 3 minutes 38 seconds" aria-describedby="gcm-demo-description" onError={() => setVideoError(true)}>
              <source src={gcmDemoSrc} type="video/mp4" />
              Your browser does not support embedded video. Open the original recording below.
            </video>
          </div>
          <div hidden={decision.id !== "data"} className={`${styles.evidenceView} ${changed && decision.id === "data" ? styles.evidenceEnter : ""}`}>
            <a href={gcmAssets.data} target="_blank" rel="noreferrer" aria-label="Open full-size data coverage from the original GCM demonstration"><Image src={gcmAssets.data} alt="Frame from the original GCM demonstration showing data coverage and sources." fill sizes="(max-width: 760px) 92vw, 60vw" className={styles.evidenceImage} /></a>
          </div>
          <div hidden={decision.id !== "integration"} className={`${styles.evidenceView} ${changed && decision.id === "integration" ? styles.evidenceEnter : ""}`}>
            <div className={styles.integrationDrawing}><span className={styles.meta}>Conceptual integration</span><div><strong>LibreChat<br />+ LLM</strong><p>Interpret the request.<br />Represent the response.</p></div><div><strong>MCP</strong><p>Connect the request<br />to the model’s tools.</p></div><div><strong className={styles.gcmLabel}>GCM</strong><p>Imputation.<br />Probability queries.<br />Comparisons.</p></div></div>
          </div>
          <div hidden={decision.id !== "evaluation"} className={`${styles.evidenceView} ${changed && decision.id === "evaluation" ? styles.evidenceEnter : ""}`}>
            <div className={styles.evaluationExcerpt}><span className={styles.meta}>From the expected-behavior framework</span><h3>The LLM should…</h3><ol>{gcmBehaviors.map((item) => <li key={item.id}>{item.title}.</li>)}</ol></div>
          </div>
        </div>
        <div className={styles.evidenceCaption}><span>{decision.caption}</span>
          {decision.id === "demo" && <a href={gcmDemoSrc} target="_blank" rel="noreferrer">Open original recording</a>}
          {decision.id === "data" && <a href={gcmAssets.data} target="_blank" rel="noreferrer">Inspect original frame</a>}
          {decision.id === "evaluation" && <a href={gcmAssets.expected} target="_blank" rel="noreferrer">Inspect original framework</a>}
        </div>
        {videoError && decision.id === "demo" && <p role="status" className={styles.mediaNotice}>The embedded recording could not load. Use “Open original recording” to view it directly.</p>}
        {decision.id === "demo" && <details className={styles.demoDescription}><summary>Read the demonstration overview</summary><p id="gcm-demo-description">The recording demonstrates SaferData’s Generative Consumer Model through a conversational interface. It shows the available consumer data and sources, then explores the model through natural-language questions. The demo illustrates probability queries and comparisons; the Data, Integration, and Evaluation views explain the product work behind the experience.</p></details>}
      </div>
      <aside className={styles.decisionNote} aria-label={`${decision.label}: product contribution`}><div key={decision.id} className={changed ? styles.decisionEnter : undefined}>
        <p className={styles.register}>{decision.kicker}</p><h3>{decision.title}</h3><p>{decision.copy}</p><p className={styles.why}>{decision.why}</p>
      </div></aside>
    </div>
    </div>
  </section>;
}
