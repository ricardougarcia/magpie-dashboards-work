import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortalImpact } from "./portal-impact";
import { portalDemoUrl } from "./portal-data";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function pointer(target: Element, type: "pointermove" | "pointerdown", clientX: number, pointerType: string) {
  const event = new MouseEvent(type, { bubbles: true, clientX });
  Object.assign(event, { pointerType });
  fireEvent(target, event);
}

describe("Partner Portal impact", () => {
  it("starts at December and lets readers select exact published monthly values", () => {
    const { container, getByRole } = render(<PortalImpact onInspect={vi.fn()} />);
    expect(getByRole("button", { name: "December" }).getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector(".growth-detail")?.textContent).toBe("December · MAA 75.00% · MAU 65.18%");
    expect(getByRole("status").textContent).toBe("");

    fireEvent.click(getByRole("button", { name: "September" }));
    expect(container.querySelector(".growth-detail")?.textContent).toBe("September · MAA 41.23% · MAU 37.96%");
    expect(getByRole("status").textContent).toBe("September · MAA 41.23% · MAU 37.96%");
    expect(container.querySelectorAll('.growth-months [aria-pressed="true"]')).toHaveLength(1);
    expect(getByRole("button", { name: "September" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("inspects a scaled graph with the pointer without announcing every hovered month", () => {
    const { container, getByRole } = render(<PortalImpact onInspect={vi.fn()} />);
    const chart = getByRole("img", { name: /Published adoption trajectory/ });
    vi.spyOn(chart, "getBoundingClientRect").mockReturnValue({ left: 100, width: 1200 } as DOMRect);

    // The rendered chart is twice its viewBox width, with an offset from the viewport.
    pointer(chart, "pointermove", 610.8, "mouse");
    expect(container.querySelector(".growth-detail")?.textContent).toBe("September · MAA 41.23% · MAU 37.96%");
    expect(getByRole("status").textContent).toBe("");
    pointer(chart, "pointermove", 0, "mouse");
    expect(getByRole("button", { name: "July launch" }).getAttribute("aria-pressed")).toBe("true");
    pointer(chart, "pointermove", 1600, "mouse");
    expect(getByRole("button", { name: "December" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("ignores touch hover and announces deliberate touch selection", () => {
    const { container, getByRole } = render(<PortalImpact onInspect={vi.fn()} />);
    const chart = getByRole("img", { name: /Published adoption trajectory/ });
    vi.spyOn(chart, "getBoundingClientRect").mockReturnValue({ left: 0, width: 600 } as DOMRect);
    pointer(chart, "pointermove", 145.2, "touch");
    expect(getByRole("button", { name: "December" }).getAttribute("aria-pressed")).toBe("true");
    pointer(chart, "pointerdown", 145.2, "touch");
    expect(container.querySelector(".growth-detail")?.textContent).toBe("August · MAA 24.68% · MAU 22.95%");
    expect(getByRole("status").textContent).toBe("August · MAA 24.68% · MAU 22.95%");
  });

  it("retains original-source inspection and an explicit full-demo link", () => {
    const onInspect = vi.fn();
    const { getByRole } = render(<PortalImpact onInspect={onInspect} />);
    fireEvent.click(getByRole("button", { name: "Original graph" }));
    expect(onInspect).toHaveBeenCalledWith("impact");
    const demo = getByRole("link", { name: /Watch the full portal demo/ });
    expect(demo.getAttribute("href")).toBe(portalDemoUrl);
    expect(demo.getAttribute("rel")).toContain("noopener");
  });
});
