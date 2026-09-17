"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { CoordinateCursor } from "@/components/coordinate-cursor";
import { PortfolioShell } from "./portfolio-shell";
import { portalAssets, portalStops, portalGrowth, type PortalAssetKey } from "./portal-data";
import { PortalImpact } from "./portal-impact";
import { usePortalMotion } from "./portal-motion";
import styles from "./portal.module.css";

const record = { mark: "P/P", number: "05", title: "Partner Portal", role: "Product Manager", organization: "Instructure" };
const destinations = ["EdCo Marketplace", "Canvas", "Impact", "LearnPlatform"];
const stations = [
  { key: "publish", index: 2, title: "Publish", subtitle: "Find a place in the ecosystem", asset: "product", caption: "Product information" },
  { key: "integrate", index: 3, title: "Implement", subtitle: "Make the connection usable", asset: "integration", caption: "Integrations + guidance" },
  { key: "trust", index: 4, title: "Establish trust", subtitle: "Make the evidence accessible", asset: "evidence", caption: "Efficacy evidence" },
  { key: "services", index: 5, title: "Partner services", subtitle: "Participation supports the program", asset: "evidence", caption: "Evidence publishing and services" },
] as const;

// These source screenshots retain their original pixels and expose a full-file inspection.
/* eslint-disable @next/next/no-img-element */
function SourceImage({ asset, className }: { asset: PortalAssetKey; className?: string }) {
  const value = portalAssets[asset];
  return <img className={className} src={value.src} alt={value.description} draggable={false} />;
}

export function PartnerPortalPage() {
  const { track, stage, atlas, step, percent, playing, reduced, lessMotion, setLessMotion, stop, go, move, play } = usePortalMotion();
  const model = portalStops[step];
  const [research, setResearch] = useState<"workflow" | "journey">("workflow");
  const [destination, setDestination] = useState("");
  const [hover, setHover] = useState("");
  const [view, setView] = useState<{ asset: PortalAssetKey; detail: boolean } | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const close = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!view) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = previous; };
  }, [view]);

  const inspect = (asset: PortalAssetKey, detail = false) => {
    stop();
    if (!dialog.current?.open) trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setView({ asset, detail }); setZoomed(false);
    if (!dialog.current?.open) dialog.current?.showModal();
    close.current?.focus({ preventScroll: true });
    if (!reduced) dialog.current?.animate?.([
      { opacity: .4, clipPath: "inset(12% 15%)" }, { opacity: 1, clipPath: "inset(0)" },
    ], { duration: 500, easing: "cubic-bezier(.16,1,.3,1)" });
  };
  const closeInspection = () => {
    dialog.current?.close();
    trigger.current?.focus({ preventScroll: true });
  };
  const tabKeys = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "workflow" : event.key === "End" ? "journey" : research === "workflow" ? "journey" : "workflow";
    setResearch(next);
    document.getElementById(`portal-${next}-tab`)?.focus({ preventScroll: true });
  };
  const jump = (event: MouseEvent<HTMLButtonElement>, index: number) => { go(index); event.currentTarget.focus({ preventScroll: true }); };

  return <PortfolioShell project={record}>
    <main id="portfolio-main" data-gantt-region className={`${styles.page}${reduced ? " reduced" : ""}`}>
      <CoordinateCursor />
      <div className="scroll-track" ref={track}>
        <div className="stage" ref={stage}>
          <div className="atlas-controls">
            <nav className="story-stops" aria-label="Explore the Partner Portal case study">
              {portalStops.map((stop, index) => <button key={stop.stop} type="button" aria-current={step === index ? "step" : undefined} onClick={event => jump(event, index)}>{stop.stop}</button>)}
            </nav>
            <div className="story-progress"><label htmlFor="portal-progress">Story <output>{percent}%</output></label><input id="portal-progress" type="range" min="0" max="100" value={percent} aria-label="Story progress" onChange={event => { stop(); move(Number(event.target.value) / 100); }} /><button type="button" data-portal-play onClick={play} disabled={reduced} aria-pressed={playing}>{playing ? "Pause story" : percent === 100 ? "Replay story" : "Play story"}</button><label className="motion-control"><input type="checkbox" checked={lessMotion} onChange={event => setLessMotion(event.target.checked)} />Less motion</label></div>
          </div>
          <article className="atlas" data-variant="integrated" data-step={step} data-hover={hover} aria-label="Partner Portal: the work behind the ecosystem" ref={atlas}>
            <div className="atlas-field" aria-hidden="true" />
            <div className="atlas-edge" aria-hidden="true"><span>PROVIDER</span><span>INSTRUCTURE ECOSYSTEM</span><span>PARTNER PROGRAM</span></div>
            <header className="atlas-intro"><h1>{model.head}</h1><p>{model.copy}</p></header>
            <button type="button" className="atlas-impact-link" onClick={() => go(7)} inert={step === 7}><svg className="mini-graph" viewBox="0 0 80 38" aria-hidden="true"><polyline fill="none" stroke="currentColor" strokeWidth="2" points={portalGrowth.maa.map((value,index) => `${2+index*15},${36-value/80*34}`).join(" ")} /></svg><span>Inspect impact<br /><span className="impact-numbers">75% MAA · 65.18% MAU</span></span></button>
            <div className="map-window">
              <div className="atlas-territory" inert={step < 2 || step > 5}>
                <svg className="atlas-routes" viewBox="0 0 1100 580" aria-hidden="true">
                  <path className="atlas-road" d="M100 280 H240 V80 H830 V350 H560 V475 H390" />
                  <path className="atlas-road atlas-road-secondary" d="M100 280 H560 V350 M490 80 V350 H830 M390 475 H930" />
                  <path className="atlas-trace" pathLength="1" d="M100 280 H240 V80 H830 V350 H560 V475 H390" />
                  <path className="atlas-publish-branch" d="M240 80 H490" /><path className="atlas-integrate-branch" d="M490 80 H830" /><path className="atlas-trust-branch" d="M830 80 V350 H560" /><path className="atlas-services-branch" d="M560 350 V475 H390" />
                  {[[100,280],[490,80],[830,80],[560,350],[390,475]].map(([x,y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" />)}
                </svg>
                <span className="atlas-traveler" aria-hidden="true" />
                <div className="atlas-origin"><span className="atlas-origin-tick" aria-hidden="true" /><strong>Edtech<br />provider</strong><span>A tool. A point of entry.</span></div>
                {stations.map(station => <section key={station.key} data-stop={station.index} className={`atlas-station atlas-${station.key}${step === station.index ? " active" : ""}`} inert={step !== station.index}>
                  <button type="button" className="atlas-station-title" onClick={() => go(station.index)} onPointerEnter={() => setHover(station.key)} onPointerLeave={() => setHover("")} onFocus={() => setHover(station.key)} onBlur={() => setHover("")}><span className="atlas-point" aria-hidden="true" /><strong>{station.title}</strong><span>{station.subtitle}</span></button>
                  {station.key === "trust" && <div className="atlas-trust-register"><span>Privacy</span><span>Accessibility</span><span>Efficacy evidence</span></div>}
                  {station.key === "services" ? <div className="atlas-service-ledger"><span>Provider purchases</span><strong>ESSA evaluations</strong><span className="atlas-return">Revenue for the<br />Instructure partner program</span><button type="button" className="service-inspect" onClick={() => inspect("evidence")}>Inspect services <ArrowUpRight size={14} /></button></div> : <button type="button" className="atlas-document" onClick={() => inspect(station.asset)} aria-label={`Inspect ${station.caption}`}><SourceImage asset={station.asset} /><span>{station.caption}<ArrowUpRight size={14} aria-hidden="true" /></span></button>}
                  {station.key === "publish" && <span className="atlas-annotation">A maintained presence<br />for a provider’s tools.</span>}
                </section>)}
                <span className="atlas-map-caption">Conceptual map of participation</span>
              </div>
              <section className="context-sheet" aria-label="Partner Portal ecosystem connections" inert={step !== 0}>
                <div className="connection-title">Partner Portal</div>
                <svg className="connection-lines" viewBox="0 0 600 135" preserveAspectRatio="none" aria-hidden="true"><path className="connection-base" d="M300 0V50H68V130M300 50H222V130M300 50H377V130M300 50H532V130" /><path className="connection-trace" pathLength="1" d="M300 0V50H68V130M300 50H222V130M300 50H377V130M300 50H532V130" /></svg>
                <div className="destinations">{destinations.map(name => <button type="button" key={name} aria-pressed={destination === name} onClick={() => setDestination(destination === name ? "" : name)}>{name}</button>)}</div>
                <div className="connection-foot"><span aria-live="polite">{destination ? `Partner Portal connects to ${destination}.` : "One provider home. Four named destinations."}</span><button type="button" onClick={() => inspect("ecosystem")}>Inspect original diagram</button></div>
              </section>
              <section className="research-sheet" aria-label="Discovery and workflow evidence" inert={step !== 1}>
                <div className="research-tabs" role="tablist" aria-label="Discovery artifacts">{(["workflow", "journey"] as const).map(key => <button type="button" key={key} id={`portal-${key}-tab`} role="tab" aria-selected={research === key} aria-controls="portal-discovery-panel" tabIndex={research === key ? 0 : -1} onKeyDown={tabKeys} onClick={() => setResearch(key)}>{key === "workflow" ? "Workflow Map" : "Journey Map"}</button>)}</div>
                <div id="portal-discovery-panel" role="tabpanel" aria-labelledby={`portal-${research}-tab`}><button type="button" className="research-image" aria-label={`Inspect ${research === "workflow" ? "Workflow Map" : "Journey Map"}`} onClick={() => inspect(research)}><SourceImage asset={research} /></button></div>
                <p>{portalAssets[research].title} / Original project artifact</p>
                <div className="research-link" aria-hidden="true"><span>{research === "workflow" ? "Provider setup" : "Identify a need"}</span><i /><span>{research === "workflow" ? "Manage products" : "Request"}</span><i /><span>{research === "workflow" ? "Publish" : "Share evidence"}</span></div>
              </section>
              <section className="launch-sheet" aria-label="Delivered migration and adoption capabilities" inert={step !== 6}>
                <div className="launch-phase"><span>PHASE 3</span><h3>Bring partners across.</h3><ul><li>New login routes from sunset products</li><li>User migration and program rebrand</li><li>Email and notification suite</li></ul></div>
                <div className="launch-phase"><span>PHASE 4</span><h3>Support continued use.</h3><ul><li>UI tagging and behavioral reporting</li><li>In-app guidance</li><li>Support documentation overhaul</li></ul></div>
                <button type="button" onClick={() => inspect("workflow")}>Inspect the provider workflow</button>
              </section>
            </div>
            <svg className="work-connector" aria-hidden="true"><path /><circle r="3" /></svg>
            <section className="work-panel" aria-label="Product work behind this milestone" inert={step === 7}>
              <div className="work-copy"><span className="work-phase">{model.phase}</span><h3>{model.title}</h3><p data-contribution>{model.contribution}</p></div>
              <div className="work-capabilities"><ul data-features>{model.features.map(feature => <li key={feature}>{feature}</li>)}</ul></div>
              <button type="button" className="work-source" onClick={() => inspect(model.asset)} aria-label={`Inspect ${model.caption}`}><SourceImage asset={model.asset} /><span className="work-source-caption">{model.caption}</span></button>
              <button type="button" className="work-open" onClick={() => inspect(model.asset, true)}>Explore the work</button>
            </section>
            <div className="impact-container" inert={step !== 7}><PortalImpact onInspect={inspect} /></div>
            <div className="atlas-position"><span className="atlas-position-marker" aria-hidden="true" /><span>Product leadership</span><strong>Research to launch</strong></div>
            <nav className="atlas-minimap" aria-label="Atlas milestones">{portalStops.map((stop, index) => <button key={stop.stop} type="button" aria-label={stop.stop} aria-current={index === step ? "step" : undefined} onClick={event => jump(event, index)}>{["Map", "Find", "P1", "P2", "Trust", "Value", "P3/4", "Result"][index]}</button>)}<i aria-hidden="true" /></nav>
            <p className="atlas-scroll-note">Scroll through the work and its impact</p>
          </article>
        </div>
      </div>
      <dialog className={`inspection ${view?.detail ? "work-view" : "source-view"}`} ref={dialog} aria-labelledby="portal-inspection-title" onClose={() => setView(null)} onCancel={closeInspection} onClick={event => { if (event.target === event.currentTarget) closeInspection(); }}>
        <div className="inspection-paper">
          <header><div>{view?.detail && <span>{model.phase}</span>}<h2 id="portal-inspection-title">{view?.detail ? model.title : view ? portalAssets[view.asset].title : "Project artifact"}</h2>{view && !view.detail && <p>{portalAssets[view.asset].description}</p>}</div><button type="button" ref={close} onClick={closeInspection}>Close</button></header>
          {view?.detail ? <div className="work-view-content"><p>{model.contribution}</p><ul>{model.detail.map(detail => <li key={detail}>{detail}</li>)}</ul><button type="button" data-detail-asset onClick={() => inspect(view.asset)}><SourceImage asset={view.asset} /><span data-detail-caption>{model.caption} / Inspect original</span></button><p className="work-boundary">Discovery artifacts connect to relevant capabilities; the original case does not date each artifact to a delivery phase.</p></div> : view && <><div className="source-scroll"><button type="button" id="atlas-source-zoom" aria-label={zoomed ? "Fit source image" : "Enlarge source image"} aria-pressed={zoomed} onClick={() => setZoomed(!zoomed)}><SourceImage asset={view.asset} /></button></div><footer><span>Original project artifact · Click to enlarge</span><a href={portalAssets[view.asset].url} target="_blank" rel="noopener noreferrer">Open full original <ArrowUpRight size={13} /></a></footer></>}
        </div>
      </dialog>
      <noscript><section className="portal-transcript"><h2>The work behind Partner Portal</h2>{portalStops.map(stop => <section key={stop.stop}><h3>{stop.title}</h3><p>{stop.contribution}</p><ul>{stop.detail.map(detail => <li key={detail}>{detail}</li>)}</ul></section>)}</section></noscript>
    </main>
  </PortfolioShell>;
}
