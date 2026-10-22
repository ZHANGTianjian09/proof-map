import type { PaperGraph } from "./types";

const aliases: Record<string, string> = {
  thm: "theorem",
  lem: "lemma",
  prop: "proposition",
  cor: "corollary",
  def: "definition",
  assump: "assumption",
  ex: "example",
  rmk: "remark",
  clm: "claim",
};
function normalize(text: string) {
  return text
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .map((word) => aliases[word.replace(/\.$/, "")] ?? word)
    .join(" ");
}

/** Index every canonical object, independently of the view and context visibility. */
export function buildSearchIndex(graph: PaperGraph) {
  const sections = new Map(graph.paper.sections?.map((s) => [s.id, s.title]));
  return graph.nodes.map((node) => {
    const section = sections.get(node.section) ?? node.section;
    return {
      node,
      section,
      label: normalize(node.label),
      typeNumber: normalize(`${node.type} ${node.number ?? ""}`),
      number: normalize(node.number ?? ""),
      id: normalize(node.id),
      title: normalize(node.title),
      text: normalize(
        [
          node.type,
          node.label,
          node.number,
          node.title,
          section,
          node.section,
          node.id,
          node.statement,
          node.role,
        ]
          .filter(Boolean)
          .join(" "),
      ),
    };
  });
}

export function searchObjects(
  index: ReturnType<typeof buildSearchIndex>,
  query: string,
) {
  const normalized = normalize(query);
  if (!normalized) return [];
  const terms = normalized.split(" ");
  return index
    .filter((entry) => terms.every((term) => entry.text.includes(term)))
    .map((entry, order) => ({
      ...entry,
      order,
      rank:
        entry.label === normalized || entry.typeNumber === normalized
          ? 0
          : entry.number === normalized
            ? 1
            : entry.id === normalized
              ? 2
              : entry.title === normalized
                ? 3
                : 4,
    }))
    .sort((a, b) => a.rank - b.rank || a.order - b.order);
}
