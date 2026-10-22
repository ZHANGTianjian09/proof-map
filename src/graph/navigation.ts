import type { GraphIndex } from "./normalize";
import type { MathNode, PaperGraph } from "./types";

/** A visual emphasis only for a role explicitly supplied by the importer. */
export function isMainResult(node: MathNode): boolean {
  return node.role?.trim().toLowerCase() === "main result";
}

/** Stored incidence, not a proof traversal. Other relations remain other relations. */
export function directNeighbors(index: GraphIndex, id: string) {
  return {
    predecessors: new Set(
      (index.incoming.get(id) ?? [])
        .map((edge) => edge.source)
        .filter((other) => other !== id),
    ),
    successors: new Set(
      (index.outgoing.get(id) ?? [])
        .map((edge) => edge.target)
        .filter((other) => other !== id),
    ),
  };
}

/** Parallel uses records count once per distinct dependent; self loops add no reuse. */
export function reusedPrerequisites(graph: PaperGraph) {
  const dependents = new Map<string, Set<string>>();
  for (const edge of graph.edges) {
    if (edge.relation !== "uses" || edge.source === edge.target) continue;
    const targets = dependents.get(edge.source) ?? new Set<string>();
    targets.add(edge.target);
    dependents.set(edge.source, targets);
  }
  return graph.nodes
    .map((node) => ({ node, count: dependents.get(node.id)?.size ?? 0 }))
    .filter(({ count }) => count > 1)
    .sort((a, b) => b.count - a.count);
}
