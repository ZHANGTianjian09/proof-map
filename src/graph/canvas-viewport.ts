import type { Rectangle } from "./edge-geometry";

/** Screen pixels, shared by full-map framing and zoomed-in pan limits. */
export const MAP_MARGIN = 40;
type Area = { width: number; height: number };
type Viewport = { x: number; y: number; zoom: number };

export function mapOverview(bounds: Rectangle, area: Area): Viewport {
  const zoom = Math.min(1,
    Math.max(1, area.width - 2 * MAP_MARGIN) / Math.max(1, bounds.width),
    Math.max(1, area.height - 2 * MAP_MARGIN) / Math.max(1, bounds.height));
  return {
    x: area.width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: area.height / 2 - (bounds.y + bounds.height / 2) * zoom,
    zoom,
  };
}

export function constrainMapViewport(view: Viewport, bounds: Rectangle, area: Area): Viewport {
  const axis = (offset: number, start: number, length: number, screen: number) => {
    if (length * view.zoom <= screen - 2 * MAP_MARGIN)
      return screen / 2 - (start + length / 2) * view.zoom;
    const min = screen - MAP_MARGIN - (start + length) * view.zoom;
    const max = MAP_MARGIN - start * view.zoom;
    return Math.max(min, Math.min(max, offset));
  };
  return { ...view,
    x: axis(view.x, bounds.x, bounds.width, area.width),
    y: axis(view.y, bounds.y, bounds.height, area.height),
  };
}
