"use client";

import { useEffect, useRef, useState } from "react";

export function CoordinateCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0, visible: false });
  const frameRef = useRef<number | null>(null);
  const nextRef = useRef({ x: 0, y: 0, visible: false });

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const flush = () => {
      frameRef.current = null;
      setPosition(nextRef.current);
    };
    const onMove = (event: PointerEvent) => {
      nextRef.current = { x: event.clientX, y: event.clientY, visible: true };
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(flush);
    };
    const onLeave = () => {
      nextRef.current = { ...nextRef.current, visible: false };
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(flush);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <div
      className={`coordinate-cursor ${position.visible ? "is-visible" : ""}`}
      style={{ transform: `translate3d(${position.x + 18}px, ${position.y + 18}px, 0)` }}
      aria-hidden="true"
    >
      <span>X {String(Math.round(position.x)).padStart(4, "0")}</span>
      <span>Y {String(Math.round(position.y)).padStart(4, "0")}</span>
    </div>
  );
}
