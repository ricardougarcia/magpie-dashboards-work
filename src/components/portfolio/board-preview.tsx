"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { Play, RotateCcw } from "lucide-react";

const PreviewContext = createContext<{ pinned: boolean; toggle: () => void } | null>(null);

/** Deliberate input starts the preview; viewport visibility alone never starts it. */
export function BoardPreview({ children, ...props }: ComponentPropsWithoutRef<"article">) {
  const root = useRef<HTMLElement>(null);
  const toggleHandler = useRef<(() => void) | null>(null);
  const [preview, setPreview] = useState({ active: false, pinned: false });
  const toggle = useCallback(() => toggleHandler.current?.(), []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let hovered = false;
    let focused = false;
    let pinned = false;
    let pointerSuppressed = false;
    let visible = true;
    let intent: ReturnType<typeof setTimeout> | undefined;
    const available = () => visible && !document.hidden;
    const update = () => setPreview({ active: available() && (hovered || focused || pinned), pinned });
    const cancelIntent = () => {
      clearTimeout(intent);
      intent = undefined;
    };
    const reset = (suppressPointer = false) => {
      cancelIntent();
      hovered = focused = pinned = false;
      pointerSuppressed = suppressPointer;
      update();
    };
    const beginIntent = () => {
      cancelIntent();
      intent = setTimeout(() => {
        intent = undefined;
        hovered = true;
        update();
      }, 120);
    };
    const enter = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      pointerSuppressed = false;
      if (available()) beginIntent();
    };
    const move = (event: PointerEvent) => {
      // A pointer can enter before the visibility observer catches up after scrolling.
      // Only a later physical movement may recover that missed entry.
      if (event.pointerType === "mouse" && (event.movementX || event.movementY)
        && available() && !pointerSuppressed && !hovered && !focused && !pinned && intent === undefined) beginIntent();
    };
    const leave = () => {
      cancelIntent();
      hovered = false;
      pointerSuppressed = false;
      update();
    };
    const focus = (event: FocusEvent) => {
      if (!document.hidden && event.target instanceof Element && event.target.matches(":focus-visible")) {
        focused = true;
        update();
      }
    };
    const blur = (event: FocusEvent) => {
      if (!(event.relatedTarget instanceof Node) || !element.contains(event.relatedTarget)) {
        focused = false;
        update();
      }
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") reset(true);
    };
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !element.contains(event.target)) reset(true);
    };
    const visibility = () => { if (document.hidden) reset(); };
    const togglePreview = () => {
      if (pinned) reset(true);
      else if (available()) {
        cancelIntent();
        pinned = true;
        update();
      }
    };
    toggleHandler.current = togglePreview;
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (!visible) reset();
      // Keyboard focus may scroll the target into view before this observer catches up.
      else if (focused) update();
    });
    observer?.observe(element);
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("focusin", focus);
    element.addEventListener("focusout", blur);
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside, true);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      cancelIntent();
      observer?.disconnect();
      toggleHandler.current = null;
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("focusin", focus);
      element.removeEventListener("focusout", blur);
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside, true);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  return <PreviewContext.Provider value={{ pinned: preview.pinned, toggle }}>
    <article {...props} ref={root} data-preview-active={preview.active}>{children}</article>
  </PreviewContext.Provider>;
}

export function BoardPreviewToggle({ label, className }: { label: string; className?: string }) {
  const preview = useContext(PreviewContext);
  if (!preview) throw new Error("BoardPreviewToggle must be inside BoardPreview.");
  const text = preview.pinned ? "Reset preview" : "Preview motion";
  const Icon = preview.pinned ? RotateCcw : Play;
  return <button type="button" className={className} aria-label={`${text}: ${label}`} aria-pressed={preview.pinned} onClick={preview.toggle}>
    <Icon size={13} aria-hidden="true" />
    <span>{text}</span>
  </button>;
}
