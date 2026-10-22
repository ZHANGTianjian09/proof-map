import {
  edgeGeometry,
  edgeLanes,
  unionBounds,
  type Rectangle,
} from "../graph/edge-geometry";
import type { MathEdge } from "../graph/types";
export interface ExportNode extends Rectangle {
  id: string;
}
export interface PdfPagePlan {
  rect: Rectangle;
  format: [number, number];
  row: number;
  column: number;
  scale: number;
}
export const PDF_MARGIN = 36;
export const PDF_HEADER = 72;
const A3: [number, number] = [1190.55, 841.89];
const A2: [number, number] = [1683.78, 1190.55];

export function mapBounds(nodes: ExportNode[], edges: MathEdge[]): Rectangle {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const lanes = edgeLanes(edges);
  const rects = [...nodes];
  for (const edge of edges) {
    const source = byId.get(edge.source),
      target = byId.get(edge.target);
    if (!source || !target) continue;
    const { lane, laneCount } = lanes.get(edge.id)!;
    const geometry = edgeGeometry(
      { x: source.x + source.width / 2, y: source.y + source.height },
      { x: target.x + target.width / 2, y: target.y },
      lane,
      laneCount,
    );
    rects.push({ id: edge.id, ...geometry.bounds });
  }
  const bounds = unionBounds(rects);
  return {
    x: bounds.x - 24,
    y: bounds.y - 24,
    width: bounds.width + 48,
    height: bounds.height + 48,
  };
}

function tileOrigins(
  start: number,
  length: number,
  size: number,
  overlap: number,
) {
  const result = [start];
  const step = size - overlap;
  if (step <= 0) throw new Error("A card is too large for a PDF tile.");
  while (result[result.length - 1] + size < start + length) {
    result.push(
      Math.min(result[result.length - 1] + step, start + length - size),
    );
  }
  return result;
}

/** Never shrink text below 0.75 pt per graph pixel; larger maps use overlapping A3 tiles. */
export function planPdf(bounds: Rectangle, nodes: ExportNode[]): PdfPagePlan[] {
  for (const format of [A3, A2]) {
    const scale = Math.min(
      (format[0] - 2 * PDF_MARGIN) / bounds.width,
      (format[1] - 2 * PDF_MARGIN) / (bounds.height + PDF_HEADER),
      1,
    );
    if (scale >= 0.75)
      return [{ rect: bounds, format, row: 0, column: 0, scale }];
  }
  const scale = 0.75;
  const width = (A3[0] - 2 * PDF_MARGIN) / scale;
  const height = (A3[1] - 2 * PDF_MARGIN) / scale - PDF_HEADER;
  const xs = tileOrigins(
    bounds.x,
    bounds.width,
    width,
    Math.max(...nodes.map((n) => n.width), 304) + 48,
  );
  const ys = tileOrigins(
    bounds.y,
    bounds.height,
    height,
    Math.max(...nodes.map((n) => n.height), 160) + 48,
  );
  return ys.flatMap((y, row) =>
    xs.map((x, column) => ({
      rect: {
        x,
        y,
        width: Math.min(width, bounds.width),
        height: Math.min(height, bounds.height),
      },
      format: A3,
      row,
      column,
      scale,
    })),
  );
}
