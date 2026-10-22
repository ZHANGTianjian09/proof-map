import type { Rectangle } from "./edge-geometry";

export function inspectorBounds(area: { width: number; height: number }) {
  const mobile = area.width < 760;
  const width = Math.max(0, Math.min(420, area.width - 24));
  const height = Math.max(
    0,
    mobile ? Math.min(480, area.height * 0.56) : area.height - 24,
  );
  return {
    left: area.width - width - 12,
    top: mobile ? area.height - height - 12 : 12,
    width,
    maxHeight: height,
  };
}

/** Reserve the inspector's screen space without changing graph coordinates. */
export function readingViewport(
  bounds: Rectangle,
  area: { width: number; height: number },
) {
  const panel = inspectorBounds(area);
  const width = area.width < 760 ? area.width - 24 : panel.left - 24;
  const height = area.width < 760 ? panel.top - 24 : area.height - 24;
  const zoom = Math.max(
    0.06,
    Math.min(1, (width - 32) / bounds.width, (height - 32) / bounds.height),
  );
  return {
    x: 12 + width / 2 - (bounds.x + bounds.width / 2) * zoom,
    y: 12 + height / 2 - (bounds.y + bounds.height / 2) * zoom,
    zoom,
  };
}
