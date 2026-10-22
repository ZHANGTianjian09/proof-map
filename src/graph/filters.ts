import type { MathNode, ObjectType, PaperGraph } from "./types";

export interface GraphFilters {
  query: string;
  types: ObjectType[];
  section: string | null;
}
export function matchesFilters(node: MathNode, filters: GraphFilters): boolean {
  const query = filters.query.toLocaleLowerCase().trim();
  return (
    filters.types.includes(node.type) &&
    (!filters.section || node.section === filters.section) &&
    (!query ||
      [
        node.id,
        node.label,
        node.title,
        node.statement,
        node.role,
        node.section,
      ].some((value) => value?.toLocaleLowerCase().includes(query)))
  );
}
export function visibleGraph(
  graph: PaperGraph,
  filters: GraphFilters,
): PaperGraph {
  const nodes = graph.nodes.filter((node) => matchesFilters(node, filters));
  const ids = new Set(nodes.map((node) => node.id));
  return {
    ...graph,
    nodes,
    edges: graph.edges.filter(
      (edge) => ids.has(edge.source) && ids.has(edge.target),
    ),
  };
}
