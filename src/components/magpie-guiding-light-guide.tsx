"use client";

import { ArrowDown, ArrowDownRight, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { GUIDING_LIGHTS, type GuidingLight } from "@/lib/timeline-types";
import { resolveGuidingLightNarratives } from "@/lib/guiding-light-narratives";
import styles from "./magpie-guiding-light-guide.module.css";

export function GuidingLightIntroduction({ onGuide, onExplore }: { onGuide: () => void; onExplore: () => void }) {
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
          </div>
        </div>
        <div className={styles.choices} data-guiding-light-guide>
          <a className={styles.choice} href="#timeline-heading" aria-label="Explore the connected work freely" onClick={(event) => { event.preventDefault(); onExplore(); }}>
            <span className={styles.choiceCopy}><span>Explore the connected work freely.</span><span>Select any Gantt item to see its purpose, connections, and supporting artifacts.</span></span>
          </a>
          <span className={styles.or}>or</span>
          <a className={`${styles.choice} ${styles.guideChoice}`} href="#guiding-lights-play" aria-label="Follow the Guiding Lights — find the play button" onClick={(event) => { event.preventDefault(); onGuide(); }}>
            <span className={styles.choiceCopy}><span>Follow the Guiding Lights.</span><span>For a brief introduction to the approach behind the work, start the guide below.</span></span>
            <ArrowDown size={28} strokeWidth={1.25} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function GuidingLightControls({ light, status, onBack, onNext, onPlay, onPause }: {
  light: GuidingLight | null; status: string; onBack: () => void; onNext: () => void; onPlay: () => void; onPause: () => void;
}) {
  const index = light ? GUIDING_LIGHTS.indexOf(light) : -1;
  const playing = status === "playing" || status === "opening";
  const complete = status === "complete";
  return (
    <nav className={styles.controls} aria-label="Guiding Lights playback" data-guiding-light-guide>
      {light && <span className={styles.position}>{`0${index + 1} / 05`}</span>}
      {light && <button type="button" onClick={onBack} disabled={index <= 0} aria-label="Previous Guiding Light"><ChevronLeft size={18} /></button>}
      <button id="guiding-lights-play" type="button" className={`${styles.play} ${light ? "" : styles.start}`} onClick={playing ? onPause : onPlay} aria-controls="guiding-light-narrative" aria-expanded={Boolean(light)} aria-label={playing ? "Pause Guiding Lights" : complete ? "Replay Guiding Lights" : "Play Guiding Lights"}>
        {playing ? <Pause size={15} /> : complete ? <RotateCcw size={15} /> : <Play size={15} />}
        {playing ? "Pause" : complete ? "Replay" : status === "paused" && light ? "Resume" : light ? "Play" : "Play Guiding Lights"}
      </button>
      {light && <button type="button" onClick={onNext} disabled={complete} aria-label={index === 4 ? "Finish Guiding Lights" : "Next Guiding Light"}><ChevronRight size={18} /></button>}
    </nav>
  );
}

export function GuidingLightNarrative({ light, narratives, playing, onExplore }: {
  light: GuidingLight | null; narratives: ReturnType<typeof resolveGuidingLightNarratives>; playing: boolean; onExplore: () => void;
}) {
  const narrative = narratives[light ?? "Learn"];
  const index = GUIDING_LIGHTS.indexOf(light ?? "Learn") + 1;
  return (
    <div id="guiding-light-narrative" className={`${styles.expansion} ${light ? styles.expanded : ""}`} aria-hidden={!light} inert={!light} data-guiding-light-guide>
      <div className={styles.clip}>
        <div className={`${styles.narrative} ${light === "Grow" ? styles.closingNarrative : ""}`} aria-live={playing ? "off" : "polite"} aria-atomic="true">
          <div className={styles.lightIndex}>0{index} / {light ?? "Learn"}{light !== "Grow" && <span className={styles.readingLine} aria-hidden="true" />}</div>
          <div className={styles.story} key={light}>
            <h3>{narrative.heading}</h3>
            <p>{narrative.narrative}</p>
            <div className={styles.contribution}><span>Sole contributor</span><p>{narrative.soleContributor}</p></div>
            {light === "Grow" && <button className={styles.endExplore} type="button" onClick={onExplore}>Explore the work below <ArrowDownRight size={15} aria-hidden="true" /></button>}
          </div>
        </div>
      </div>
    </div>
  );
}
