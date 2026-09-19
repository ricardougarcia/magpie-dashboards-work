"use client";

import Image from "next/image";
import { ArrowUpRight, Play } from "lucide-react";
import { useEffect, useId, useRef, useState, type PointerEvent } from "react";
import { portalAssets, portalDemoUrl, portalGrowth, type PortalAssetKey } from "./portal-data";

const shortMonths = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const series = [
  { key: "maa", color: "#aa3423", dash: undefined },
  { key: "mau", color: "#282828", dash: "5 3" },
] as const;

function monthDescription(month: number) {
  return `${portalGrowth.months[month]} · MAA ${portalGrowth.maa[month].toFixed(2)}% · MAU ${portalGrowth.mau[month].toFixed(2)}%`;
}

/** The original two-series graph, with pointer inspection and explicit month controls. */
export function PortalImpact({ onInspect }: { onInspect: (key: PortalAssetKey) => void }) {
  const chart = useRef<SVGSVGElement>(null);
  const chartId = useId();
  const [month, setMonth] = useState(portalGrowth.months.length - 1);
  const [announcement, setAnnouncement] = useState("");
  const [size, setSize] = useState({ width: 600, height: 240 });

  useEffect(() => {
    const element = chart.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (!width) return;
      const next = { width, height: Math.max(140, height) };
      setSize(previous => previous.width === next.width && previous.height === next.height ? previous : next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { width, height } = size;
  const left = 35;
  const right = 14;
  const top = 24;
  const bottom = 24;
  const maximum = Math.ceil(Math.max(...portalGrowth.maa, ...portalGrowth.mau) / 20) * 20;
  const plotWidth = Math.max(1, width - left - right);
  const plotHeight = height - top - bottom;
  const lastMonth = portalGrowth.months.length - 1;
  const x = (index: number) => left + index * plotWidth / lastMonth;
  const y = (value: number) => top + (maximum - value) / maximum * plotHeight;

  function selectMonth(next: number, explicit: boolean) {
    setMonth(next);
    // Hover remains quiet for assistive technology; a chosen month is announced.
    if (explicit) setAnnouncement(monthDescription(next));
  }

  function inspectPointer(event: PointerEvent<SVGSVGElement>, explicit: boolean) {
    if (!explicit && event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (!bounds.width) return;
    const pointerX = (event.clientX - bounds.left) * width / bounds.width;
    const nearest = Math.max(0, Math.min(lastMonth, Math.round((pointerX - left) / plotWidth * lastMonth)));
    selectMonth(nearest, explicit);
  }

  return <section className="outcome-field" aria-label="Impact and full product demo">
    <div className="growth-panel">
      <header>
        <h3>Adoption after launch</h3>
        <button type="button" onClick={() => onInspect("impact")}>Original graph</button>
      </header>
      <div className="growth-legend">
        <span><i aria-hidden="true" />MAA <b>{portalGrowth.maa[lastMonth].toFixed(2)}%</b></span>
        <span><i aria-hidden="true" />MAU <b>{portalGrowth.mau[lastMonth].toFixed(2)}%</b></span>
      </div>
      <svg ref={chart} className="growth-chart" viewBox={`0 0 ${width} ${height}`} role="img"
        aria-labelledby={`${chartId}-title ${chartId}-description`}
        onPointerMove={event => inspectPointer(event, false)}
        onPointerDown={event => inspectPointer(event, true)}>
        <title id={`${chartId}-title`}>Published adoption trajectory</title>
        <desc id={`${chartId}-description`}>July launch through December. MAA: {portalGrowth.maa.join(", ")} percent. MAU: {portalGrowth.mau.join(", ")} percent. Select a month below to inspect its reported values.</desc>
        {Array.from({ length: maximum / 20 + 1 }, (_, index) => index * 20).map(value => <g key={value}>
          <line x1={left} x2={width - right} y1={y(value)} y2={y(value)} stroke="#b9bcad" strokeWidth=".7" />
          <text x={left - 7} y={y(value) + 4} textAnchor="end" fill="#5e6058" fontSize="11">{value}</text>
        </g>)}
        <text x={left} y="12" fill="#5e6058" fontSize="11">Reported %</text>
        {shortMonths.map((label, index) => width < 350 && ![0, 3, lastMonth].includes(index) ? null :
          <text key={label} x={x(index)} y={height - 4} textAnchor={index === 0 ? "start" : index === lastMonth ? "end" : "middle"} fill="#5e6058" fontSize="11">{label}</text>)}
        {series.map(({ key, color, dash }) => <g key={key}>
          <polyline fill="none" stroke={color} strokeWidth="2.5" strokeDasharray={dash}
            points={portalGrowth[key].map((value, index) => `${x(index)},${y(value)}`).join(" ")} />
          {portalGrowth[key].map((value, index) => <circle key={index} cx={x(index)} cy={y(value)} r={month === index ? 4.5 : 2.4} fill={color} />)}
        </g>)}
        <line x1={x(month)} x2={x(month)} y1={top} y2={y(0)} stroke="#777a6b" strokeWidth="1" strokeDasharray="3 4" />
        <rect x={left} y={top} width={plotWidth} height={plotHeight} fill="transparent" />
      </svg>
      <div className="growth-months" role="group" aria-label="Select a month">
        {portalGrowth.months.map((name, index) => <button key={name} type="button" aria-label={name}
          aria-pressed={month === index} onClick={() => selectMonth(index, true)}>{shortMonths[index]}</button>)}
      </div>
      <p className="growth-detail">{monthDescription(month)}</p>
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
      <div className="growth-result"><strong>8</strong><span>new features became among the most-used.</span></div>
      <p className="growth-definition">MAU: monthly active users. MAA is the source’s account label; its definition needs confirmation.</p>
    </div>
    <div className="demo-panel">
      <a className="demo-link" href={portalDemoUrl} target="_blank" rel="noopener noreferrer">
        <div className="demo-poster">
          <Image src={portalAssets.poster.src} alt={portalAssets.poster.description} width={1448} height={1448} sizes="(max-width: 700px) 66px, 250px" />
          <span><Play aria-hidden="true" /></span>
        </div>
        <strong>Watch the full portal demo</strong>
        <span>See the complete product in use <ArrowUpRight aria-hidden="true" /></span>
      </a>
      <div className="closing-note">
        <span>MY ROLE</span>
        <p>Product leadership from discovery through launch.</p>
        <span>9 months · 4 delivery phases<br />5 engineers · 1 designer · PM</span>
      </div>
      <p className="business-outcome">A provider publishing platform and a channel for paid partner services.</p>
    </div>
  </section>;
}
