import type { PaperGraph } from "./types";
import { NODE_HEIGHT, NODE_WIDTH, type NodePosition } from "./layout-shared";
import {
  edgeGeometry,
  edgeLanes,
  unionBounds,
  type Rectangle,
} from "./edge-geometry";

/** Translate whole ELK components; preserve every internal coordinate and edge direction. */
export function packComponents(
  graph: PaperGraph,
  positions: NodePosition[],
): NodePosition[] {
  const adjacent = new Map(
    graph.nodes.map((node) => [node.id, new Set<string>()]),
  );
  for (const edge of graph.edges) {
    adjacent.get(edge.source)!.add(edge.target);
    adjacent.get(edge.target)!.add(edge.source);
  }
  const byId = new Map(positions.map((position) => [position.id, position]));
  const lanes = edgeLanes(graph.edges);
  const seen = new Set<string>();
  const groups: { ids: Set<string>; bounds: Rectangle; order: number }[] = [];
  for (const node of graph.nodes) {
    if (seen.has(node.id)) continue;
    const ids = new Set([node.id]);
    seen.add(node.id);
    for (const id of ids)
      for (const neighbor of adjacent.get(id)!) {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          ids.add(neighbor);
        }
      }
    const rects: Rectangle[] = [...ids].map((id) => ({
      ...byId.get(id)!,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    }));
    for (const edge of graph.edges) {
      if (!ids.has(edge.source)) continue;
      const from = byId.get(edge.source)!,
        to = byId.get(edge.target)!;
      const lane = lanes.get(edge.id)!;
      rects.push(
        edgeGeometry(
          { x: from.x + NODE_WIDTH / 2, y: from.y + NODE_HEIGHT },
          { x: to.x + NODE_WIDTH / 2, y: to.y },
          lane.lane,
          lane.laneCount,
        ).bounds,
      );
    }
    groups.push({ ids, bounds: unionBounds(rects), order: groups.length });
  }
  if (groups.length < 2) return positions;
  // Tall components first; small disconnected cards fill remaining columns.
  groups.sort(
    (a, b) =>
      b.bounds.height - a.bounds.height ||
      b.bounds.width - a.bounds.width ||
      a.order - b.order,
  );
  const area = groups.reduce(
    (sum, group) =>
      sum + (group.bounds.width + 36) * (group.bounds.height + 36),
    0,
  );
  const widest = Math.max(...groups.map((group) => group.bounds.width));
  let best: Rectangle[] = [];
  let bestScore = Infinity;
  for (const ratio of [0.9, 1.2, 1.6, 2, 2.5]) {
    const targetWidth = Math.max(widest, Math.sqrt(area * ratio));
    const placed: Rectangle[] = [];
    for (const group of groups) {
      let chosen = {
        x: 0,
        y: Infinity,
        width: group.bounds.width,
        height: group.bounds.height,
      };
      for (const x of [0, ...placed.map((rect) => rect.x + rect.width + 36)]) {
        if (x + group.bounds.width > targetWidth) continue;
        const overlapping = placed.filter(
          (rect) =>
            x < rect.x + rect.width + 36 &&
            x + group.bounds.width + 36 > rect.x,
        );
        const y = Math.max(
          0,
          ...overlapping.map((rect) => rect.y + rect.height + 36),
        );
        if (y < chosen.y || (y === chosen.y && x < chosen.x))
          chosen = { ...chosen, x, y };
      }
      placed.push(chosen);
    }
    const bounds = unionBounds(placed);
    const score =
      Math.max(bounds.width / 1.6, bounds.height) +
      Math.sqrt(bounds.width * bounds.height) * 0.1;
    if (score < bestScore) {
      best = placed;
      bestScore = score;
    }
  }
  const offsets = new Map<string, { x: number; y: number }>();
  groups.forEach((group, i) => {
    for (const id of group.ids)
      offsets.set(id, {
        x: best[i].x - group.bounds.x + 20,
        y: best[i].y - group.bounds.y + 20,
      });
  });
  return positions.map((position) => ({
    id: position.id,
    x: position.x + offsets.get(position.id)!.x,
    y: position.y + offsets.get(position.id)!.y,
  }));
}
