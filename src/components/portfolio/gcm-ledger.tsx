"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { gcmBehaviors, type GcmComponent } from "@/data/gcm";
import styles from "./gcm.module.css";

const components: { id: GcmComponent; action: string; name: string; description: string }[] = [
  { id: "llm", action: "Interpret", name: "LLM", description: "Conversational layer via LibreChat" },
  { id: "mcp", action: "Connect", name: "MCP", description: "Structured requests and constraints" },
  { id: "gcm", action: "Model", name: "GCM", description: "Generative Consumer Model" },
];

export function GcmLedger() {
  const root = useRef<HTMLElement>(null);
  const [selected, setSelected] = useState(0);
  const [touched, setTouched] = useState(false);
  const behavior = gcmBehaviors[selected];
  const select = (index: number) => {
    if (index === selected) return;
    setTouched(true);
    setSelected(index);
  };

  useLayoutEffect(() => {
    const section = root.current!;
    const advance = (event: Event) => {
      const index = (event as CustomEvent<number>).detail;
      if (!Number.isInteger(index) || index < 0 || index >= gcmBehaviors.length) return;
      setSelected(index);
      setTouched(true);
    };
    section.addEventListener("gcm-scroll-behavior", advance);
    return () => section.removeEventListener("gcm-scroll-behavior", advance);
  }, []);
  const choose = (index: number) => {
    select(index);
    root.current?.dispatchEvent(new CustomEvent("gcm-select-behavior", { detail: index, bubbles: true }));
  };

  return <section ref={root} id="reliability" className={`${styles.section} ${styles.readingSection}`} data-gcm-reading-section="reliability" data-gcm-steps={gcmBehaviors.length} aria-labelledby="gcm-reliability-heading">
    <div className={styles.readingStage} data-gcm-reading-stage>
    <header className={styles.sectionHead}><div><p className={styles.meta}>01 / Reliability by design</p><h2 id="gcm-reliability-heading">Define what a reliable<br />answer requires.</h2></div><p>I designed the expected behaviors and structured evaluations across the demo workflow.</p></header>
    <div className={styles.ledger}>
      <div className={styles.behaviorList} role="group" aria-label="Explore expected behaviors" style={{ "--selected": selected } as CSSProperties}>
        <span className={styles.behaviorMarker} aria-hidden="true" />
        {gcmBehaviors.map((item, index) => <button key={item.id} type="button" className={styles.behavior}
          aria-pressed={selected === index} aria-controls="gcm-responsibilities" aria-describedby={selected === index ? "gcm-requirement" : undefined}
          onPointerEnter={(event) => { if (event.pointerType === "mouse" && root.current?.dataset.gcmHolding !== "true") select(index); }} onFocus={() => choose(index)} onClick={() => choose(index)}>
          <span>{String(index + 1).padStart(2, "0")}</span>{item.title}
        </button>)}
      </div>
      <div id="gcm-responsibilities" className={styles.architecture} data-gcm-selection={behavior.id}>
        <div className={styles.architectureHeading}><span className={styles.meta}>Inside the demonstration</span><span className={styles.meta}>Conceptual responsibilities</span></div>
        <div className={styles.systemNodes} role="group" aria-label={`Responsibilities for ${behavior.title}`}>
          {components.map((component) => <div key={component.id} className={`${styles.node} ${component.id === "gcm" ? styles.modelNode : ""}`} data-component={component.id} data-active={behavior.components.includes(component.id)}>
            <span className={styles.meta}>{component.action}</span><strong>{component.name}</strong><p>{component.description}</p>
          </div>)}
        </div>
        <div className={styles.foundation}><span>Docker / Modular setup</span><span>GCM / Relevant consumer data</span></div>
        <div className={styles.requirement}><div key={behavior.id} className={touched ? styles.requirementEnter : undefined}>
          <span className={styles.requirementOwner}>{String(selected + 1).padStart(2, "0")} / {behavior.owner}</span><h3>{behavior.requirement}</h3><p id="gcm-requirement">{behavior.description}</p>
        </div></div>
      </div>
    </div>
    <p className={styles.ledgerCaption}>Expected behaviors / Evaluation framework · Component highlights describe responsibilities.</p>
    </div>
  </section>;
}
