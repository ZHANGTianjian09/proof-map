import type { PaperGraph } from "./types";
export const NODE_WIDTH = 340;
export const NODE_HEIGHT = 144;
export interface NodePosition {
  id: string;
  x: number;
  y: number;
}
export function gridLayout(graph: PaperGraph): NodePosition[] {
  const columns = Math.max(1, Math.ceil(Math.sqrt(graph.nodes.length)));
  return graph.nodes.map((node, i) => ({
    id: node.id,
    x: (i % columns) * (NODE_WIDTH + 36),
    y: Math.floor(i / columns) * (NODE_HEIGHT + 64),
  }));
}
