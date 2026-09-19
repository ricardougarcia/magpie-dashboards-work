"use client";

import { useEffect, useId, useRef } from "react";
import styles from "./portal-ecosystem.module.css";

const products = [
  { name: "EdCo Marketplace", copy: "A shared marketplace where educators discover and evaluate edtech tools, and providers showcase their products and connect with prospective customers." },
  { name: "Canvas LMS", copy: "A learning management system connecting teaching, learning, and edtech tools across K–12, higher education, and professional learning." },
  { name: "Impact", copy: "Usage analytics and in-app guidance that help institutions understand and improve adoption of their LMS and connected edtech tools." },
  { name: "LearnPlatform", copy: "An edtech management platform for organizing tool libraries, reviewing privacy and compliance, tracking usage, and evaluating effectiveness through ESSA-aligned research." },
];

/** Connectors express ecosystem relationships; they do not model individual data transfers. */
export function PortalEcosystem({ active, reduced }: { active: boolean; reduced: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const marker = useId().replace(/:/g, "");

  useEffect(() => {
    const element = root.current!;
    const svg = element.querySelector("svg")!;
    const origin = element.querySelector<HTMLElement>("[data-portal-origin]")!;
    const nodes = Array.from(element.querySelectorAll<HTMLElement>("[data-portal-product]"));
    const arrows = Array.from(element.querySelectorAll<SVGPathElement>("[data-flow-arrow]"));
    let animations: Animation[] = [];
    let visible = false;
    const synchronize = () => {
      const running = active && !reduced && visible && !document.hidden;
      animations.forEach(animation => running ? animation.play() : animation.pause());
      element.dataset.moving = String(running);
    };
    const layout = () => {
      animations.forEach(animation => animation.cancel());
      animations = [];
      const box = element.getBoundingClientRect();
      const source = origin.getBoundingClientRect();
      const x = source.left - box.left + source.width / 2;
      const y = source.bottom - box.top;
      svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
      const columns = getComputedStyle(element).getPropertyValue("--columns").trim();
      nodes.forEach((node, index) => {
        const target = node.getBoundingClientRect();
        const top = target.top - box.top;
        const left = target.left - box.left;
        const endX = columns === "4" ? left + target.width / 2 : columns === "2" && index % 2 === 0 ? left + target.width : left;
        const endY = columns === "4" ? top - 5 : top + 13;
        const path = columns === "4"
          ? `M${x},${y + 5} V${y + 30} H${endX} V${endY}`
          : columns === "2"
            ? `M${x},${y + 5} V${endY} H${endX}`
            : `M${x},${y + 5} V${y + 20} H8 V${endY} H${endX - 5}`;
        element.querySelector(`[data-connection="${index}"]`)!.setAttribute("d", path);
        for (const [direction, arrow] of arrows.slice(index * 2, index * 2 + 2).entries()) {
          arrow.style.offsetPath = `path('${path}')`;
          arrow.style.offsetRotate = direction === 0 ? "auto" : "auto 180deg";
          if (!reduced && arrow.animate) {
            const animation = arrow.animate([
              { offsetDistance: direction === 0 ? "0%" : "100%", opacity: 0, offset: 0 },
              { opacity: 1, offset: .04 },
              { opacity: 1, offset: .24 },
              { offsetDistance: direction === 0 ? "100%" : "0%", opacity: 0, offset: .28 },
              { offsetDistance: direction === 0 ? "100%" : "0%", opacity: 0, offset: 1 },
            ], { duration: 12000, delay: index * 1450 + direction * 4300, iterations: Infinity, easing: "linear" });
            animation.pause();
            animations.push(animation);
          }
        }
      });
      synchronize();
    };
    const resize = new ResizeObserver(layout);
    resize.observe(element);
    nodes.forEach(node => resize.observe(node));
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; synchronize(); }, { threshold: 0 });
    observer.observe(element);
    document.addEventListener("visibilitychange", synchronize);
    layout();
    return () => {
      animations.forEach(animation => animation.cancel());
      resize.disconnect(); observer.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, [active, reduced]);

  return <div className={styles.ecosystem} ref={root}>
    <div className={styles.origin} data-portal-origin>
      <h2>Partner Portal</h2>
      <p>One place for providers to manage product information, integrations, evidence, and partner services.</p>
    </div>
    <svg className={styles.connections} aria-hidden="true">
      <defs><marker id={marker} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M2 2 L6 5 L2 8" /></marker></defs>
      {products.map((product, index) => <g key={product.name}>
        <path className={styles.line} data-connection={index} markerStart={`url(#${marker})`} markerEnd={`url(#${marker})`} />
        <path className={styles.arrow} data-flow-arrow d="M-5 -4 L0 0 L-5 4" />
        <path className={styles.arrow} data-flow-arrow d="M-5 -4 L0 0 L-5 4" />
      </g>)}
    </svg>
    <ul className={styles.products}>
      {products.map(product => <li key={product.name} data-portal-product><h3>{product.name}</h3><p>{product.copy}</p></li>)}
    </ul>
  </div>;
}
