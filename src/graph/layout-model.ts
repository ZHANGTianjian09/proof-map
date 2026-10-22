import type { ElkNode } from "elkjs/lib/elk-api";
import type { PaperGraph } from "./types";
import { NODE_WIDTH, NODE_HEIGHT, type NodePosition } from "./layout-shared";
import { packComponents } from "./layout-packing";

/** Opaque internal IDs prevent collisions with ELK's root and edge namespace. */
export function toLayoutInput(graph: PaperGraph): ElkNode {
  const ids = new Map(graph.nodes.map((node, i) => [node.id, `n${i}`]));
  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "DOWN",
      "elk.spacing.nodeNode": "32",
      "elk.layered.spacing.nodeNodeBetweenLayers": "64",
      "elk.layered.cycleBreaking.strategy": "GREEDY",
      "elk.separateConnectedComponents": "true",
      "elk.aspectRatio": "1.6",
      "elk.spacing.componentComponent": "36",
      "elk.padding": "[top=20,left=20,bottom=20,right=20]",
    },
    children: graph.nodes.map((node) => ({
      id: ids.get(node.id)!,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })),
    edges: graph.edges.map((edge, i) => ({
      id: `e${i}`,
      sources: [ids.get(edge.source)!],
      targets: [ids.get(edge.target)!],
    })),
  };
}

/** Only positions leave ELK: internally reversed cycle edges cannot change the graph. */
export function fromLayoutOutput(
  graph: PaperGraph,
  result: ElkNode,
): NodePosition[] {
  const positions = new Map(result.children?.map((node) => [node.id, node]));
  const output = graph.nodes.map((node, i) => {
    const position = positions.get(`n${i}`);
    if (
      !position ||
      !Number.isFinite(position.x) ||
      !Number.isFinite(position.y)
    )
      throw new Error("Layout did not return a position for every node.");
    return { id: node.id, x: position.x!, y: position.y! };
  });
  return packComponents(graph, output);
}
