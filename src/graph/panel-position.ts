import type { Rectangle } from "./edge-geometry";

/** Coordinates relative to the canvas. Clamp even if the anchor is panned offscreen. */
export function positionPanel(
  anchor: Rectangle,
  area: { width: number; height: number },
  size: { width: number; height: number },
) {
  const gap = 16,
    margin = 12;
  const width = Math.max(0, Math.min(size.width, area.width - margin * 2));
  const height = Math.max(0, Math.min(size.height, area.height - margin * 2));
  const rightSpace = area.width - anchor.x - anchor.width;
  const side =
    rightSpace >= width + gap || rightSpace >= anchor.x ? "right" : "left";
  const preferredX =
    side === "right" ? anchor.x + anchor.width + gap : anchor.x - width - gap;
  return {
    left: Math.max(margin, Math.min(preferredX, area.width - width - margin)),
    top: Math.max(margin, Math.min(anchor.y, area.height - height - margin)),
    width,
    maxHeight: height,
    side,
  };
}
