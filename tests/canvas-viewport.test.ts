import { describe, expect, it } from "vitest";
import { MAP_MARGIN, mapOverview, constrainMapViewport } from "../src/graph/canvas-viewport";

describe("shared canvas margin", () => {
  const bounds = { x: -120, y: -80, width: 1200, height: 900 };
  const area = { width: 1000, height: 700 };
  it("fits the complete map with the same screen-space margin", () => {
    const view = mapOverview(bounds, area);
    expect(bounds.x * view.zoom + view.x).toBeGreaterThanOrEqual(MAP_MARGIN);
    expect(bounds.y * view.zoom + view.y).toBeCloseTo(MAP_MARGIN);
    expect((bounds.y + bounds.height) * view.zoom + view.y).toBeCloseTo(area.height - MAP_MARGIN);
  });
  it("makes each edge reachable at multiple zoom levels without losing its margin", () => {
    for (const zoom of [1, 1.5, 2]) {
      const start = constrainMapViewport({ x: 10000, y: 10000, zoom }, bounds, area);
      const end = constrainMapViewport({ x: -10000, y: -10000, zoom }, bounds, area);
      expect(bounds.x * zoom + start.x).toBeCloseTo(MAP_MARGIN);
      expect(bounds.y * zoom + start.y).toBeCloseTo(MAP_MARGIN);
      expect((bounds.x + bounds.width) * zoom + end.x).toBeCloseTo(area.width - MAP_MARGIN);
      expect((bounds.y + bounds.height) * zoom + end.y).toBeCloseTo(area.height - MAP_MARGIN);
    }
  });
  it("centers an axis that fits and preserves movement inside the limits", () => {
    const view = mapOverview(bounds, area);
    expect(constrainMapViewport(view, bounds, area)).toEqual(view);
    const inside = { x: -200, y: -250, zoom: 2 };
    expect(constrainMapViewport(inside, bounds, area)).toEqual(inside);
  });
});
