"use client";

import { useEffect, useRef, useState } from "react";
import {
  connectorPath,
  createDefaultConnector,
  resolveConnectorPoints,
  type ConnectorRect,
} from "@/lib/orthogonal-connectors";
import type { TimelineData, TimelineItem } from "@/lib/timeline-types";

type PreviewConnection = {
  id: string;
  path: string;
};

export function EditorConnectionPreview({
  data,
  selected,
  containerId,
}: {
  data: TimelineData;
  selected: TimelineItem | null;
  containerId: string;
}) {
  const [connections, setConnections] = useState<PreviewConnection[]>([]);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container || !selected || selected.relations.length === 0) {
      const frame = window.requestAnimationFrame(() => setConnections([]));
      return () => window.cancelAnimationFrame(frame);
    }

    const update = () => {
      frameRef.current = null;
      const containerRect = container.getBoundingClientRect();
      const source = container.querySelector<HTMLElement>(`[data-editor-item-id="${CSS.escape(selected.id)}"]`);
      if (!source) {
        setConnections([]);
        return;
      }
      const relativeRect = (element: HTMLElement): ConnectorRect => {
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left - containerRect.left,
          top: rect.top - containerRect.top,
          width: rect.width,
          height: rect.height,
        };
      };
      const sourceRect = relativeRect(source);
      const next = selected.relations.flatMap((relation) => {
        const target = container.querySelector<HTMLElement>(`[data-editor-item-id="${CSS.escape(relation.targetId)}"]`);
        if (!target) return [];
        const targetRect = relativeRect(target);
        const route = relation.connector ?? createDefaultConnector(sourceRect, targetRect);
        return [{
          id: `${selected.id}-${relation.targetId}`,
          path: connectorPath(resolveConnectorPoints(route, sourceRect, targetRect)),
        }];
      });
      setConnections(next);
    };
    const schedule = () => {
      if (frameRef.current === null) frameRef.current = window.requestAnimationFrame(update);
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    container.querySelectorAll<HTMLElement>("[data-editor-item-id]").forEach((element) => observer.observe(element));
    window.addEventListener("resize", schedule);
    container.addEventListener("scroll", schedule, true);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      container.removeEventListener("scroll", schedule, true);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [containerId, data, selected]);

  if (!selected || connections.length === 0) return null;

  return (
    <svg className="editor-network-preview" aria-label={`Connected Work lines for ${selected.name}`}>
      {connections.map((connection) => (
        <path key={connection.id} d={connection.path} />
      ))}
    </svg>
  );
}
