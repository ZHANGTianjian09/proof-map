import type { MathEdge, MathNode, PaperGraph } from "./types";

export interface GraphIndex {
  nodesById: Map<string, MathNode>;
  incoming: Map<string, MathEdge[]>;
  outgoing: Map<string, MathEdge[]>;
}

/** Build lookup indexes only; canonical mathematical data is never rewritten. */
export function constructGraph(graph: PaperGraph): GraphIndex {
  const nodesById = new Map(graph.nodes.map((node) => [node.id, node]));
  const incoming = new Map(
    graph.nodes.map((node) => [node.id, [] as MathEdge[]]),
  );
  const outgoing = new Map(
    graph.nodes.map((node) => [node.id, [] as MathEdge[]]),
  );
  for (const edge of graph.edges) {
    incoming.get(edge.target)!.push(edge);
    outgoing.get(edge.source)!.push(edge);
  }
  return { nodesById, incoming, outgoing };
}

export function exportGraph(graph: PaperGraph): string {
  return `${JSON.stringify(graph, null, 2)}\n`;
}
