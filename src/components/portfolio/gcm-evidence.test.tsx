import { act, cleanup, fireEvent, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GcmEvidence } from "./gcm-evidence";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

function enter(target: Element, pointerType = "mouse") {
  const event = new MouseEvent("pointerover", { bubbles: true });
  Object.assign(event, { pointerType });
  fireEvent(target, event);
}

const choices = [
  { label: "Demo", id: "demo", title: "Make the model understandable—and testable.", contribution: "planned the integration", media: "video" },
  { label: "Data", id: "data", title: "Start with data that makes the value recognizable.", contribution: "I sourced relevant consumer datasets", media: "img" },
  { label: "Integration", id: "integration", title: "Give each component a clear responsibility.", contribution: "I planned the LLM + MCP + GCM integration", media: "LibreChat" },
  { label: "Evaluation", id: "evaluation", title: "Decide what a reliable answer must preserve.", contribution: "I designed and ran structured evaluations", media: "The LLM should…" },
];

describe("GCM product evidence", () => {
  it.each(choices)("pairs the $label evidence with the corresponding product contribution", ({ label, id, title, contribution, media }) => {
    const { container, getByRole } = render(<GcmEvidence />);
    fireEvent.click(getByRole("button", { name: id === "evaluation" ? /01 \/ Data/ : /03 \/ Evaluation/ }));
    const choice = getByRole("button", { name: new RegExp(` / ${label}$`) });
    fireEvent.click(choice);
    expect(choice.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelectorAll('button[aria-pressed="true"]')).toHaveLength(1);
    const panel = container.querySelector(`#${choice.getAttribute("aria-controls")}`)!;
    expect(panel.getAttribute("data-gcm-evidence")).toBe(id);
    const note = getByRole("complementary", { name: `${label}: product contribution` });
    expect(within(note).getByRole("heading", { name: title })).toBeTruthy();
    expect(note.textContent).toContain(contribution);
    const views = [...panel.querySelectorAll<HTMLDivElement>("div[hidden], div[class*='evidenceView']")];
    const visible = views.filter(view => !view.hidden);
    expect(visible).toHaveLength(1);
    if (media === "video" || media === "img") expect(visible[0].querySelector(media)).toBeTruthy();
    else expect(visible[0].textContent).toContain(media);
  });

  it("selects evidence after deliberate mouse hover and pauses a playing demo only when selection changes", () => {
    vi.useFakeTimers();
    const { container, getByRole } = render(<GcmEvidence />);
    const choice = getByRole("button", { name: /01 \/ Data/ });
    const video = container.querySelector("video")!;
    vi.spyOn(video, "paused", "get").mockReturnValue(false);
    const pause = vi.spyOn(video, "pause").mockImplementation(() => {});
    enter(choice);
    act(() => vi.advanceTimersByTime(119));
    expect(choice.getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelector("[data-gcm-evidence]")?.getAttribute("data-gcm-evidence")).toBe("demo");
    expect(pause).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(pause).toHaveBeenCalledOnce();
    expect(choice.getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector('[data-gcm-evidence="data"]')).toBeTruthy();
    expect(getByRole("complementary", { name: "Data: product contribution" })).toBeTruthy();
    enter(choice);
    act(() => vi.advanceTimersByTime(120));
    expect(pause).toHaveBeenCalledOnce();
  });

  it("cancels a transient hover and does not let a stale hover override keyboard or click selection", () => {
    vi.useFakeTimers();
    const { getByRole } = render(<GcmEvidence />);
    const data = getByRole("button", { name: /01 \/ Data/ });
    const evaluation = getByRole("button", { name: /03 \/ Evaluation/ });
    const integration = getByRole("button", { name: /02 \/ Integration/ });
    enter(data);
    fireEvent.pointerOut(data, { relatedTarget: document.body });
    act(() => vi.advanceTimersByTime(150));
    expect(data.getAttribute("aria-pressed")).toBe("false");
    enter(data);
    act(() => evaluation.focus());
    act(() => vi.advanceTimersByTime(150));
    expect(evaluation.getAttribute("aria-pressed")).toBe("true");
    enter(data);
    fireEvent.click(integration);
    act(() => vi.advanceTimersByTime(150));
    expect(integration.getAttribute("aria-pressed")).toBe("true");
  });

  it.each(["touch", "pen"])("ignores %s hover and retains explicit activation", pointerType => {
    vi.useFakeTimers();
    const { getByRole } = render(<GcmEvidence />);
    const data = getByRole("button", { name: /01 \/ Data/ });
    enter(data, pointerType);
    act(() => vi.advanceTimersByTime(150));
    expect(data.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(data);
    expect(data.getAttribute("aria-pressed")).toBe("true");
  });

  it("cleans up a pending hover when the page unmounts", () => {
    vi.useFakeTimers();
    const { getByRole, unmount } = render(<GcmEvidence />);
    enter(getByRole("button", { name: /01 \/ Data/ }));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("pauses playback on evidence change while retaining the video node and position for return", () => {
    const { container, getByRole } = render(<GcmEvidence />);
    const video = container.querySelector("video")!;
    video.currentTime = 74;
    let paused = false;
    vi.spyOn(video, "paused", "get").mockImplementation(() => paused);
    const pause = vi.spyOn(video, "pause").mockImplementation(() => { paused = true; });
    const play = vi.spyOn(video, "play").mockResolvedValue(undefined);
    fireEvent.click(getByRole("button", { name: /00 \/ Demo/ }));
    expect(pause).not.toHaveBeenCalled();
    fireEvent.click(getByRole("button", { name: /02 \/ Integration/ }));
    expect(pause).toHaveBeenCalledOnce();
    expect(container.querySelector("video")).toBe(video);
    expect(video.closest("[hidden]")).toBeTruthy();
    fireEvent.click(getByRole("button", { name: /03 \/ Evaluation/ }));
    fireEvent.click(getByRole("button", { name: /00 \/ Demo/ }));
    expect(container.querySelector("video")).toBe(video);
    expect(video.currentTime).toBe(74);
    expect(video.closest("[hidden]")).toBeNull();
    expect(pause).toHaveBeenCalledOnce();
    expect(play).not.toHaveBeenCalled();
  });

  it("keeps playback reader controlled and provides a direct recording plus a text overview", () => {
    const { container, getByRole } = render(<GcmEvidence />);
    const video = container.querySelector("video")!;
    expect(video.controls).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(video.preload).toBe("none");
    expect(video.autoplay).toBe(false);
    expect(video.loop).toBe(false);
    expect(video.poster).toContain("/portfolio/gcm/demo-poster.jpg");
    expect(video.getAttribute("aria-label")).toContain("3 minutes 38 seconds");
    const source = video.querySelector("source")!;
    expect(source.type).toBe("video/mp4");
    expect(getByRole("link", { name: "Open original recording" }).getAttribute("href")).toBe(source.getAttribute("src"));
    const description = container.querySelector(`#${video.getAttribute("aria-describedby")}`)!;
    expect(description.textContent).toContain("probability queries and comparisons");
    expect(description.closest("details")?.querySelector("summary")?.textContent).toBe("Read the demonstration overview");
  });

  it("retains a working original-recording link when embedded playback fails", () => {
    const { container, getByRole, queryByRole } = render(<GcmEvidence />);
    fireEvent.error(container.querySelector("video")!);
    expect(getByRole("status").textContent).toContain("could not load");
    expect(getByRole("link", { name: "Open original recording" }).getAttribute("href")).toMatch(/^https:\/\/video\.wixstatic\.com\/.+\.mp4$/);
    fireEvent.click(getByRole("button", { name: /01 \/ Data/ }));
    expect(queryByRole("status")).toBeNull();
    expect(getByRole("link", { name: "Inspect original frame" }).getAttribute("href")).toBe("/portfolio/gcm/data-coverage.jpg");
    fireEvent.click(getByRole("button", { name: /03 \/ Evaluation/ }));
    expect(getByRole("link", { name: "Inspect original framework" }).getAttribute("href")).toBe("/portfolio/gcm/expected-behaviors.png");
  });
});
