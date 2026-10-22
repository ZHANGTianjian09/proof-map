import type { MathEdge } from "./types";
export interface Point {
  x: number;
  y: number;
}
export interface Rectangle extends Point {
  width: number;
  height: number;
}

export function edgeLanes(edges: MathEdge[]) {
  const groups = new Map<string, string[]>();
  for (const edge of edges) {
    const key = JSON.stringify([edge.source, edge.target].sort());
    const group = groups.get(key) ?? [];
    group.push(edge.id);
    groups.set(key, group);
  }
  return new Map(
    edges.map((edge) => {
      const group = groups.get(
        JSON.stringify([edge.source, edge.target].sort()),
      )!;
      return [
        edge.id,
        {
          lane: group.indexOf(edge.id) - (group.length - 1) / 2,
          laneCount: group.length,
        },
      ];
    }),
  );
}

/** Shared by canvas rendering, floating anchors, and complete PDF bounds. */
export function edgeGeometry(
  source: Point,
  target: Point,
  lane: number,
  laneCount: number,
) {
  const bend = Math.max(65, Math.abs(target.y - source.y) * 0.48);
  const backward = target.y <= source.y;
  const side = Math.max(source.x, target.x) + 220 + (lane + laneCount / 2) * 36;
  const c1 = { x: backward ? side : source.x + lane * 36, y: source.y + bend };
  const c2 = { x: backward ? side : target.x + lane * 36, y: target.y - bend };
  return {
    path: `M ${source.x},${source.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${target.x},${target.y}`,
    label: {
      x: (source.x + 3 * c1.x + 3 * c2.x + target.x) / 8,
      y: (source.y + 3 * c1.y + 3 * c2.y + target.y) / 8,
    },
    // A cubic is contained within the convex hull of its control points.
    // Conservative bounds intentionally include arrowheads and label space.
    bounds: {
      x: Math.min(source.x, c1.x, c2.x, target.x) - 100,
      y: Math.min(source.y, c1.y, c2.y, target.y) - 16,
      width:
        Math.max(source.x, c1.x, c2.x, target.x) -
        Math.min(source.x, c1.x, c2.x, target.x) +
        200,
      height:
        Math.max(source.y, c1.y, c2.y, target.y) -
        Math.min(source.y, c1.y, c2.y, target.y) +
        32,
    },
  };
}

export function unionBounds(rects: Rectangle[]): Rectangle {
  if (!rects.length) return { x: 0, y: 0, width: 0, height: 0 };
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return {
    x,
    y,
    width: Math.max(...rects.map((r) => r.x + r.width)) - x,
    height: Math.max(...rects.map((r) => r.y + r.height)) - y,
  };
}
