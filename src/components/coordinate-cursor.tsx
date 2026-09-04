"use client";

import { useEffect, useRef, useState } from "react";

type CursorPosition = {
  x: number;
  y: number;
  visible: boolean;
  inGantt: boolean;
};

const INITIAL_POSITION: CursorPosition = { x: 0, y: 0, visible: false, inGantt: false };

export function CoordinateCursor() {
  const [position, setPosition] = useState(INITIAL_POSITION);
  const frameRef = useRef<number | null>(null);
  const nextRef = useRef(INITIAL_POSITION);

  useEffect(() => {
    const flush = () => {
      frameRef.current = null;
      setPosition(nextRef.current);
    };
    const schedule = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(flush);
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      const target = event.target;
      const inGantt = target instanceof Element && Boolean(target.closest("[data-gantt-region]"));
      nextRef.current = { x: event.clientX, y: event.clientY, visible: true, inGantt };
      schedule();
    };
    const onLeave = () => {
      nextRef.current = { ...nextRef.current, visible: false, inGantt: false };
      schedule();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <>
      <div
        className={`cursor-guides ${position.visible && position.inGantt ? "is-visible" : ""}`}
        aria-hidden="true"
      >
        <span className="cursor-guide-horizontal" style={{ top: position.y }} />
        <span className="cursor-guide-vertical" style={{ left: position.x }} />
      </div>
      <div
        className={`coordinate-cursor ${position.visible ? "is-visible" : ""}`}
        aria-hidden="true"
      >
        <span>X:{Math.round(position.x)}PX</span>
        <span>Y:{Math.round(position.y)}PX</span>
      </div>
    </>
  );
}
