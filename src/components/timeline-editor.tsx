"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  GripHorizontal,
  ImagePlus,
  LogOut,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ConnectorRouteEditor } from "@/components/connector-route-editor";
import { EditorConnectionPreview } from "@/components/editor-connection-preview";
import {
  GUIDING_LIGHTS,
  MONTHS,
  colorTokenForLane,
  createItemId,
  formatPlacement,
  monthPointOptions,
  placementSpan,
  type GuidingLight,
  type OrthogonalConnectorRoute,
  type TimelineData,
  type TimelineItem,
} from "@/lib/timeline-types";

const DISPLAY_MONTHS = MONTHS.slice(0, 9);
const TIMELINE_POINTS = monthPointOptions(0, 8);
const FUTURE_POINTS = monthPointOptions(9, 11);
const EDITOR_NETWORK_ID = "editor-selected-network";

function cloneData(data: TimelineData): TimelineData {
  return JSON.parse(JSON.stringify(data)) as TimelineData;
}

export function TimelineEditor({ initialData }: { initialData: TimelineData }) {
  const [data, setData] = useState(() => cloneData(initialData));
  const [selectedId, setSelectedId] = useState(initialData.items[0]?.id ?? "");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingConnections, setEditingConnections] = useState(false);

  const selected = data.items.find((item) => item.id === selectedId) ?? null;
  const timelineItems = data.items.filter((item) => !item.planned);
  const futureItems = data.items.filter((item) => item.planned);

  const itemsByLane = useMemo(
    () => data.lanes.map((lane) => ({ ...lane, items: timelineItems.filter((item) => item.lane === lane.name) })),
    [data.lanes, timelineItems],
  );

  function commit(updater: (draft: TimelineData) => void) {
    setData((current) => {
      const next = cloneData(current);
      updater(next);
      return next;
    });
    setDirty(true);
    setSaveState("idle");
    setStatusMessage("");
  }

  function chooseItem(id: string) {
    setEditingConnections(false);
    setSelectedId(id);
  }

  function updateSelected(patch: Partial<TimelineItem>) {
    if (!selected) return;
    commit((draft) => {
      const item = draft.items.find((entry) => entry.id === selected.id);
      if (!item) return;
      const previousName = item.name;
      Object.assign(item, patch);
      if (patch.start !== undefined || patch.end !== undefined || patch.planned !== undefined || patch.ongoing !== undefined) {
        item.placement = formatPlacement(item.start, item.end, item.planned, item.ongoing);
      }
      if (patch.name && patch.name !== previousName) {
        draft.items.forEach((entry) => {
          entry.relations.forEach((relation) => {
            if (relation.targetId === item.id) relation.targetName = patch.name!;
          });
        });
      }
    });
  }

  function moveItem(item: TimelineItem, offsetX: number, trackWidth: number) {
    const halfMonthWidth = trackWidth / 18;
    const delta = Math.round(offsetX / halfMonthWidth) * 0.5;
    if (!delta) return;
    const duration = item.end - item.start;
    const nextStart = Math.max(0, Math.min(8.5 - duration, item.start + delta));
    if (nextStart === item.start) return;
    commit((draft) => {
      const target = draft.items.find((entry) => entry.id === item.id);
      if (!target) return;
      target.start = nextStart;
      target.end = nextStart + duration;
      target.placement = formatPlacement(target.start, target.end, target.planned, target.ongoing);
    });
  }

  function addItem() {
    const lane = data.lanes[0]?.name ?? "Eng Build";
    const id = createItemId(lane, "New work item");
    const next: TimelineItem = {
      id,
      name: "New work item",
      lane,
      description: "Add a brief description of the work.",
      placement: "Jan - Jan",
      value: "Describe the impact and value of this work.",
      relations: [],
      guidingLights: ["Learn"],
      start: 0,
      end: 0,
      planned: false,
      ongoing: false,
      colorToken: colorTokenForLane(lane),
      media: null,
    };
    commit((draft) => draft.items.push(next));
    chooseItem(id);
  }

  function removeItem() {
    if (!selected) return;
    if (!window.confirm(`Delete “${selected.name}”? This also removes relations pointing to it.`)) return;
    commit((draft) => {
      draft.items = draft.items.filter((item) => item.id !== selected.id);
      draft.items.forEach((item) => {
        item.relations = item.relations.filter((relation) => relation.targetId !== selected.id);
      });
    });
    chooseItem(data.items.find((item) => item.id !== selected.id)?.id ?? "");
  }

  function toggleLight(light: GuidingLight) {
    if (!selected) return;
    const exists = selected.guidingLights.includes(light);
    const next = exists
      ? selected.guidingLights.filter((entry) => entry !== light)
      : [...selected.guidingLights, light].slice(-2);
    if (next.length === 0) return;
    updateSelected({ guidingLights: next });
  }

  function updateRelationConnector(index: number, connector: OrthogonalConnectorRoute) {
    if (!selected) return;
    updateSelected({
      relations: selected.relations.map((relation, relationIndex) => relationIndex === index
        ? { ...relation, connector }
        : relation),
    });
  }

  function addRelation() {
    if (!selected) return;
    const target = data.items.find(
      (item) => item.id !== selected.id && !selected.relations.some((relation) => relation.targetId === item.id),
    );
    if (!target) return;
    updateSelected({
      relations: [
        ...selected.relations,
        { targetId: target.id, targetName: target.name, description: "Describe how these items connect." },
      ],
    });
  }

  async function uploadMedia(file: File) {
    if (!selected) return;
    setUploading(true);
    setStatusMessage("");
    const form = new FormData();
    form.append("file", file);
    const response = await fetch("/api/media", { method: "POST", body: form });
    const payload = (await response.json().catch(() => null)) as { url?: string; type?: "image" | "video" | "gif"; error?: string } | null;
    if (!response.ok || !payload?.url || !payload.type) {
      setStatusMessage(payload?.error ?? "Media upload failed.");
      setUploading(false);
      return;
    }
    updateSelected({ media: { url: payload.url, type: payload.type, alt: selected.name } });
    setUploading(false);
  }

  async function save() {
    setSaving(true);
    setStatusMessage("");
    const normalizedData = {
      ...data,
      items: data.items.map((item) => ({ ...item, colorToken: colorTokenForLane(item.lane) })),
    };
    const response = await fetch("/api/timeline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedData),
    });
    const payload = (await response.json().catch(() => null)) as TimelineData | { error?: string } | null;
    if (!response.ok || !payload || !("items" in payload)) {
      setSaveState("error");
      setStatusMessage(payload && "error" in payload ? payload.error ?? "Save failed." : "Save failed.");
      setSaving(false);
      return;
    }
    setData(payload);
    setDirty(false);
    setSaving(false);
    setSaveState("saved");
    setStatusMessage("Saved to Vercel Blob.");
  }

  return (
    <main className="editor-shell">
      <header className="editor-header">
        <div className="editor-brand">
          <Link href="/" aria-label="Back to public timeline"><ArrowLeft size={16} /></Link>
          <span className="wordmark-mark">M/D</span>
          <div><strong>Timeline editor</strong><small>Private owner workspace</small></div>
        </div>
        <div className="editor-actions">
          <span className={`save-status ${saveState}`}>{dirty ? "Unsaved changes" : saveState === "saved" ? "Saved" : "Up to date"}</span>
          <button className="secondary-button" type="button" onClick={addItem}><Plus size={14} /> New item</button>
          <button className="primary-button" type="button" onClick={save} disabled={!dirty || saving}>
            {saving ? <span className="button-spinner" /> : saveState === "saved" ? <Check size={14} /> : <Save size={14} />}
            {saving ? "Saving" : "Save changes"}
          </button>
          <form action="/api/auth/logout" method="post">
            <button className="icon-button" type="submit" aria-label="Log out"><LogOut size={15} /></button>
          </form>
        </div>
      </header>

      <div className={`editor-layout ${editingConnections ? "is-connector-mode" : ""}`}>
        {editingConnections && selected ? (
          <ConnectorRouteEditor
            key={selected.id}
            data={data}
            source={selected}
            onChange={updateRelationConnector}
            onDone={() => setEditingConnections(false)}
          />
        ) : (
        <section className="editor-board" aria-label="Editable timeline">
          <div className="editor-board-intro">
            <div><span className="index-mark">[EDIT / 01]</span><h1>Place the work</h1></div>
            <p>Drag bars horizontally to move them. Select a bar to edit its complete record. Resize duration with the start and end controls.</p>
          </div>

          <div className="editor-month-axis">
            <span>Lane / item</span>
            <div>{DISPLAY_MONTHS.map((month) => <strong key={month}>{month}</strong>)}</div>
          </div>

          <div className="editor-lanes" id={EDITOR_NETWORK_ID}>
            <EditorConnectionPreview data={data} selected={selected} containerId={EDITOR_NETWORK_ID} />
            {itemsByLane.filter((lane) => lane.name !== "In-Flight / Future").map((lane) => (
              <section className="editor-lane" key={lane.id}>
                <div className="editor-lane-head"><span>[{String(lane.index).padStart(2, "0")}]</span><strong>{lane.displayName}</strong></div>
                {lane.items.map((item) => (
                  <div className="editor-item-row" key={item.id}>
                    <button type="button" className="editor-item-label" onClick={() => chooseItem(item.id)}>
                      <span className={`editor-swatch color-${item.colorToken}`} />
                      <span>{item.name}</span>
                      <ChevronRight size={13} />
                    </button>
                    <div className="editor-track">
                      <div className="editor-track-grid">{DISPLAY_MONTHS.map((month) => <span key={month} />)}</div>
                      <motion.button
                        drag="x"
                        dragElastic={0.05}
                        dragMomentum={false}
                        dragSnapToOrigin
                        onDragEnd={(event, info) => {
                          const target = event.currentTarget as HTMLElement | null;
                          moveItem(item, info.offset.x, target?.parentElement?.clientWidth ?? 900);
                        }}
                        type="button"
                        data-editor-item-id={item.id}
                        className={`editor-bar color-${item.colorToken} ${selectedId === item.id ? "is-selected" : ""}`}
                        style={{
                          left: `calc(${(item.start / 9) * 100}% + 4px)`,
                          width: `calc(${(placementSpan(item.start, item.end) / 9) * 100}% - 8px)`,
                        }}
                        onClick={() => chooseItem(item.id)}
                      >
                        <GripHorizontal size={12} />
                        <span>{item.placement.replace(" (ongoing)", "")}</span>
                      </motion.button>
                    </div>
                  </div>
                ))}
              </section>
            ))}

            <section className="editor-future-block">
              <div className="editor-lane-head"><span>[06]</span><strong>In-Flight / Future</strong></div>
              <div className="editor-future-list">
                {futureItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    data-editor-item-id={item.id}
                    className={`editor-future-item color-${item.colorToken} ${selectedId === item.id ? "is-selected" : ""}`}
                    onClick={() => chooseItem(item.id)}
                  >
                    <span>{item.name}</span><small>{item.placement}</small>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </section>
        )}

        <aside className="editor-inspector" aria-label="Item inspector">
          {selected ? (
            <>
              <div className="inspector-header">
                <div><span className="eyebrow">Selected record</span><strong>{selected.name}</strong></div>
                <button className="icon-button danger" type="button" onClick={removeItem} aria-label="Delete item"><Trash2 size={15} /></button>
              </div>

              <div className="inspector-scroll">
                <fieldset className="form-section">
                  <legend>Core details</legend>
                  <label>Item name<input value={selected.name} onChange={(event) => updateSelected({ name: event.target.value })} /></label>
                  <label>Lane<select value={selected.lane} onChange={(event) => {
                    const lane = event.target.value;
                    const planned = lane === "In-Flight / Future";
                    updateSelected({ lane, colorToken: colorTokenForLane(lane), planned, start: planned ? 9 : Math.min(selected.start, 8), end: planned ? 11 : Math.min(selected.end, 8) });
                  }}>{data.lanes.map((lane) => <option key={lane.id} value={lane.name}>{lane.displayName}</option>)}</select></label>
                  <label>Description<textarea rows={4} value={selected.description} onChange={(event) => updateSelected({ description: event.target.value })} /></label>
                  <label>Value<textarea rows={5} value={selected.value} onChange={(event) => updateSelected({ value: event.target.value })} /></label>
                </fieldset>

                <fieldset className="form-section">
                  <legend>Placement</legend>
                  <div className="field-grid two">
                    <label>Start<select value={selected.start} onChange={(event) => {
                      const start = Number(event.target.value);
                      updateSelected({ start, end: Math.max(start, selected.end) });
                    }}>{(selected.planned ? FUTURE_POINTS : TIMELINE_POINTS).map((point) => <option key={point.value} value={point.value}>{point.label}</option>)}</select></label>
                    <label>End<select value={selected.end} onChange={(event) => updateSelected({ end: Math.max(selected.start, Number(event.target.value)) })}>{(selected.planned ? FUTURE_POINTS : TIMELINE_POINTS).map((point) => <option key={point.value} value={point.value}>{point.label}</option>)}</select></label>
                  </div>
                  <label className="checkbox-row"><input type="checkbox" checked={selected.ongoing} onChange={(event) => updateSelected({ ongoing: event.target.checked })} /> Ongoing across the period</label>
                </fieldset>

                <fieldset className="form-section">
                  <legend>Design controls</legend>
                  <span className="field-label">Color signal <small>Assigned by lane</small></span>
                  <div className={`lane-color-assignment color-${colorTokenForLane(selected.lane)}`}>
                    <span aria-hidden="true" />
                    <strong>{colorTokenForLane(selected.lane)}</strong>
                    <small>{selected.lane}</small>
                  </div>
                  <span className="field-label">Guiding Light <small>Private / choose up to two</small></span>
                  <div className="tag-grid">
                    {GUIDING_LIGHTS.map((light) => (
                      <button key={light} type="button" className={selected.guidingLights.includes(light) ? "is-active" : ""} onClick={() => toggleLight(light)}>{light}</button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="form-section">
                  <legend>Media artifact</legend>
                  {selected.media ? (
                    <div className="media-editor-preview">
                      {selected.media.type === "video" ? <video src={selected.media.url} controls /> : <Image src={selected.media.url} alt={selected.media.alt} fill sizes="340px" unoptimized />}
                      <button type="button" onClick={() => updateSelected({ media: null })}><X size={14} /> Remove</button>
                    </div>
                  ) : (
                    <label className="upload-drop">
                      <ImagePlus size={18} />
                      <strong>{uploading ? "Uploading…" : "Add image, GIF, or video"}</strong>
                      <span>JPEG, PNG, WEBP, GIF, MP4, or WEBM / 25 MB max</span>
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" disabled={uploading} onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void uploadMedia(file);
                      }} />
                    </label>
                  )}
                  {selected.media && <label>Alternative text<input value={selected.media.alt} onChange={(event) => updateSelected({ media: selected.media ? { ...selected.media, alt: event.target.value } : null })} /></label>}
                </fieldset>

                <fieldset className="form-section relation-editor">
                  <div className="legend-row">
                    <legend>Connected Work</legend>
                    <div className="relation-network-actions">
                      {selected.relations.length > 0 && (
                        <button
                          type="button"
                          className="edit-network-button"
                          aria-label={`Edit all Connected Work lines for ${selected.name}`}
                          onClick={() => setEditingConnections(true)}
                        ><GripHorizontal size={13} /> Edit orthogonal lines</button>
                      )}
                      <button type="button" onClick={addRelation}><Plus size={13} /> Add</button>
                    </div>
                  </div>
                  {selected.relations.length > 0 && <p className="relation-network-note">All Connected Work lines are shown on the timeline. Enter line editing once to adjust the complete network.</p>}
                  {selected.relations.length === 0 && <p className="empty-note">No connected work items.</p>}
                  {selected.relations.map((relation, index) => (
                    <div className="relation-form" key={`${relation.targetId}-${index}`}>
                      <button type="button" className="remove-relation" aria-label="Remove relation" onClick={() => {
                        updateSelected({ relations: selected.relations.filter((_, relationIndex) => relationIndex !== index) });
                      }}><X size={13} /></button>
                      <label>Related item<select value={relation.targetId} onChange={(event) => {
                        const target = data.items.find((item) => item.id === event.target.value);
                        if (!target) return;
                        updateSelected({ relations: selected.relations.map((entry, relationIndex) => relationIndex === index ? { ...entry, targetId: target.id, targetName: target.name, connector: undefined } : entry) });
                      }}>{data.items.filter((item) => item.id !== selected.id).map((item) => <option key={item.id} value={item.id}>{item.name} / {item.lane}</option>)}</select></label>
                      <label>Connection<textarea rows={3} value={relation.description} onChange={(event) => updateSelected({ relations: selected.relations.map((entry, relationIndex) => relationIndex === index ? { ...entry, description: event.target.value } : entry) })} /></label>
                      <div className="relation-route-status">
                        <span>{relation.connector ? "Custom route saved" : "Default route"}</span>
                      </div>
                    </div>
                  ))}
                </fieldset>
              </div>
            </>
          ) : (
            <div className="inspector-empty"><span>[NO SELECTION]</span><p>Select a timeline item to edit its record.</p></div>
          )}
        </aside>
      </div>

      {statusMessage && <div className={`editor-toast ${saveState}`} role="status">{statusMessage}</div>}
    </main>
  );
}
