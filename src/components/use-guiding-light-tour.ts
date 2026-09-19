"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { GUIDING_LIGHTS, type GuidingLight } from "@/lib/timeline-types";

export const GUIDING_LIGHT_HOLD_MS = 2800;
export const GUIDING_LIGHT_EXPAND_MS = 360;
type TourStatus = "ready" | "opening" | "playing" | "paused" | "complete" | "exploring";
type TourState = { light: GuidingLight | null; status: TourStatus };
type TourAction =
  | { type: "play" | "pause" | "clear" | "opened" | "tick" | "back" | "next" | "restart" }
  | { type: "select"; light: GuidingLight };

export function guidingLightTourReducer(state: TourState, action: TourAction): TourState {
  const index = state.light ? GUIDING_LIGHTS.indexOf(state.light) : -1;
  switch (action.type) {
    case "clear": return { light: null, status: "exploring" };
    case "pause": return { ...state, status: state.light ? "paused" : "exploring" };
    case "restart": return { light: "Learn", status: state.light ? "playing" : "opening" };
    case "play": return {
      light: state.status === "complete" ? "Learn" : state.light ?? "Learn",
      status: state.light ? "playing" : "opening",
    };
    case "opened": return state.status === "opening" ? { ...state, status: "playing" } : state;
    case "select": return { light: state.light === action.light ? null : action.light, status: "paused" };
    case "back": return { light: GUIDING_LIGHTS[Math.max(0, index - 1)], status: "paused" };
    case "next": return index === GUIDING_LIGHTS.length - 1
      ? { ...state, status: "complete" }
      : { light: GUIDING_LIGHTS[index + 1], status: "paused" };
    case "tick":
      if (state.status !== "playing") return state;
      return index === GUIDING_LIGHTS.length - 1
        ? { ...state, status: "complete" }
        : { light: GUIDING_LIGHTS[index + 1], status: "playing" };
  }
}

export function useGuidingLightTour(reducedMotion: boolean | null) {
  const [state, dispatch] = useReducer(guidingLightTourReducer, { light: null, status: "ready" });
  const viewRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const node = viewRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio >= 0.55), {
      threshold: 0.55,
    });
    // Observe the stable heading: long owner copy must not make the visibility
    // threshold impossible to reach on a small viewport or at increased zoom.
    observer.observe(node.querySelector(".magpie-guide-heading") ?? node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const update = () => setPageVisible(document.visibilityState !== "hidden");
    document.addEventListener("visibilitychange", update);
    update();
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    // Give the opted-in narrative time to expand before the first reading interval.
    // Visibility only holds an explicitly started guide; it never starts one.
    if (state.status !== "opening" || !inView || !pageVisible) return;
    const timer = window.setTimeout(() => dispatch({ type: "opened" }), reducedMotion ? 0 : GUIDING_LIGHT_EXPAND_MS);
    return () => window.clearTimeout(timer);
  }, [state.status, inView, pageVisible, reducedMotion]);

  useEffect(() => {
    if (state.status !== "playing" || !inView || !pageVisible) return;
    const timer = window.setTimeout(() => dispatch({ type: "tick" }), GUIDING_LIGHT_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [state.status, state.light, inView, pageVisible]);

  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  return { ...state, dispatch, clear, viewRef };
}
