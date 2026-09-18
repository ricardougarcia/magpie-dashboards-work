"use client";

import { ArrowDownRight, ArrowRight, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { GUIDING_LIGHTS, type GuidingLight } from "@/lib/timeline-types";
import { resolveGuidingLightNarratives } from "@/lib/guiding-light-narratives";
import styles from "./magpie-guiding-light-guide.module.css";

export function GuidingLightIntroduction({ onBegin, onExplore }: { onBegin: () => void; onExplore: () => void }) {
  return (
    <section className={`hero ${styles.introduction}`} id="top" data-panel="1">
      <div data-panel-content>
        <div className="hero-kicker"><span>[01]</span> Magpie Literacy / Platform Data</div>
        <h1>Every connection <br /><span>carries a decision.</span></h1>
        <p className={styles.statement}>Rebuild the system. Restore the trust.</p>
        <div className={styles.introColumns}>
          <p className={styles.introCopy}>Research informed priorities. Repairs protected educators. Testing made recovery repeatable. Shared practices prepared the team for growth. Much of this work was invisible in the interface, but consequential to the product.</p>
          <div className={styles.invitation} data-guiding-light-guide>
            <div className={styles.principleMap} aria-hidden="true">
              <svg viewBox="0 0 500 130" preserveAspectRatio="none"><path d="M8 35 H491 V68 H85 V112 H320" /></svg>
              <ol>{GUIDING_LIGHTS.map((light, index) => <li key={light}><span>0{index + 1}</span> {light}<i /></li>)}</ol>
            </div>
            <a className={styles.begin} href="#timeline-heading" onClick={(event) => { event.preventDefault(); onBegin(); }}>Begin with the Guiding Lights <ArrowRight size={16} aria-hidden="true" /></a>
            <a className={styles.explore} href="#timeline-heading" onClick={(event) => { event.preventDefault(); onExplore(); }}>Explore the connected work <ArrowDownRight size={16} aria-hidden="true" /></a>
            <p className={styles.hint}>Five principles introduce the approach. Select any work item to inspect its purpose and connections.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function GuidingLightControls({ light, status, onBack, onNext, onPlay, onPause }: {
  light: GuidingLight | null; status: string; onBack: () => void; onNext: () => void; onPlay: () => void; onPause: () => void;
}) {
  const index = light ? GUIDING_LIGHTS.indexOf(light) : -1;
  const playing = status === "playing";
  const complete = status === "complete";
  return (
    <nav className={styles.controls} aria-label="Guiding Lights playback" data-guiding-light-guide>
      <span className={styles.position}>{index < 0 ? "GUIDING LIGHTS" : `0${index + 1} / 05`}</span>
      <button type="button" onClick={onBack} disabled={index <= 0} aria-label="Previous Guiding Light"><ChevronLeft size={18} /></button>
      <button type="button" className={styles.play} onClick={playing ? onPause : onPlay} aria-label={playing ? "Pause Guiding Lights" : complete ? "Replay Guiding Lights" : "Play Guiding Lights"}>
        {playing ? <Pause size={15} /> : complete ? <RotateCcw size={15} /> : <Play size={15} />}
        {playing ? "Pause" : complete ? "Replay" : status === "paused" && light ? "Resume" : "Play"}
      </button>
      <button type="button" onClick={onNext} disabled={index < 0 || complete} aria-label={index === 4 ? "Finish Guiding Lights" : "Next Guiding Light"}><ChevronRight size={18} /></button>
    </nav>
  );
}

export function GuidingLightNarrative({ light, narratives, playing, onExplore, onReplay }: {
  light: GuidingLight | null; narratives: ReturnType<typeof resolveGuidingLightNarratives>; playing: boolean; onExplore: () => void; onReplay: () => void;
}) {
  const narrative = narratives[light ?? "Learn"];
  const index = GUIDING_LIGHTS.indexOf(light ?? "Learn") + 1;
  return (
    <div className={`${styles.expansion} ${light ? styles.expanded : ""}`} aria-hidden={!light} inert={!light} data-guiding-light-guide>
      <div className={styles.clip}>
        <div className={styles.narrative} aria-live={playing ? "off" : "polite"} aria-atomic="true">
          <div className={styles.lightIndex}>0{index} / {light ?? "Learn"}<span className={styles.readingLine} aria-hidden="true" /></div>
          <div className={styles.story} key={light}>
            <h3>{narrative.heading}</h3>
            <p>{narrative.narrative}</p>
            <div className={styles.contribution}><span>Sole contributor</span><p>{narrative.soleContributor}</p></div>
            {light === "Grow" && <div className={styles.ending}>
              <div className={styles.scale}><svg viewBox="0 0 150 32" aria-hidden="true"><path d="M1 0 V25 H143" /><rect x="140" y="21" width="8" height="8" /></svg><span>[06]</span> Prepare for scale</div>
              <p className={styles.endTitle}>The introduction ends. The connections continue.</p>
              <p className={styles.endHint}>Inspect any work item to see what it enabled.</p>
              <div className={styles.endActions}><button type="button" onClick={onExplore}>Explore the connected work <ArrowDownRight size={15} /></button><button type="button" onClick={onReplay}>Replay the Guiding Lights <RotateCcw size={14} /></button></div>
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
}
