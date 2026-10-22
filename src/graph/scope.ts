import type { MathNode, PaperGraph } from "./types";

export type NodeScope = "global_context" | "local_proof" | "unclassified";
export function nodeScope(node: MathNode): NodeScope {
  const scope = node.metadata?.scope;
  return scope === "global_context" || scope === "local_proof"
    ? scope
    : "unclassified";
}

/** An explicit user classification is the only write this reading interface makes. */
export function classifyNode(
  graph: PaperGraph,
  id: string,
  scope: NodeScope,
): PaperGraph {
  return {
    ...graph,
    nodes: graph.nodes.map((node) => {
      if (node.id !== id) return node;
      const metadata = { ...node.metadata };
      if (scope === "unclassified") delete metadata.scope;
      else metadata.scope = scope;
      return { ...node, metadata };
    }),
  };
}

/** Missing/unrecognized scope stays visible. Never infer scope from type or degree. */
export function contextGraph(
  graph: PaperGraph,
  showContext = false,
): PaperGraph {
  const nodes = graph.nodes.filter(
    (node) => showContext || nodeScope(node) !== "global_context",
  );
  const ids = new Set(nodes.map((node) => node.id));
  return {
    ...graph,
    nodes,
    edges: graph.edges.filter(
      (edge) => ids.has(edge.source) && ids.has(edge.target),
    ),
  };
}
