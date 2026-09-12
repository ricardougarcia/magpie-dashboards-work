"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Draw registration marks once in view; source content stays visible throughout. */
export function ClusterEntrance({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.entered = "true";
      observer.disconnect();
    }, { threshold: .15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div ref={root} className={className} data-cluster-entrance>{children}</div>;
}
