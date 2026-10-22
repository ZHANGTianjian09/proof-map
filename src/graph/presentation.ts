import type { ObjectType, RelationType, PaperGraph } from "./types";

export const OBJECT_STYLE: Record<
  ObjectType,
  { label: string; color: string; tint: string; family: string }
> = {
  theorem: {
    label: "Theorem",
    color: "#525252",
    tint: "#ffffff",
    family: "double",
  },
  lemma: { label: "Lemma", color: "#525252", tint: "#ffffff", family: "left" },
  proposition: {
    label: "Proposition",
    color: "#525252",
    tint: "#ffffff",
    family: "thick",
  },
  corollary: {
    label: "Corollary",
    color: "#525252",
    tint: "#ffffff",
    family: "top",
  },
  definition: {
    label: "Definition",
    color: "#525252",
    tint: "#ffffff",
    family: "dotted",
  },
  assumption: {
    label: "Assumption",
    color: "#525252",
    tint: "#ffffff",
    family: "dotted",
  },
  example: {
    label: "Example",
    color: "#525252",
    tint: "#ffffff",
    family: "dashed",
  },
  counterexample: {
    label: "Example",
    color: "#525252",
    tint: "#ffffff",
    family: "dashed",
  },
  remark: {
    label: "Remark",
    color: "#525252",
    tint: "#ffffff",
    family: "dashed",
  },
  claim: { label: "Claim", color: "#525252", tint: "#ffffff", family: "left" },
};

export const SECTION_COLORS = [
  "#edf4fb",
  "#eef6ed",
  "#fbf5e6",
  "#f2eef9",
  "#faedf1",
  "#eaf6f6",
];
/** Canonical catalog order (or sorted literal IDs), never the filtered view. */
export function sectionPresentation(graph: PaperGraph) {
  const sections =
    graph.paper.sections ??
    [...new Set(graph.nodes.map((n) => n.section))]
      .sort()
      .map((id) => ({ id, title: id, kind: "section" as const }));
  return new Map(
    sections.map((section, i) => [
      section.id,
      {
        title: section.title,
        label:
          section.kind === "appendix"
            ? `Appendix ${section.title}`
            : `§ ${section.title}`,
        color: SECTION_COLORS[i % SECTION_COLORS.length],
      },
    ]),
  );
}
export const RELATION_STYLE: Record<
  RelationType,
  { label: string; color: string; width: number; description: string }
> = {
  uses: {
    label: "uses",
    color: "#759388",
    width: 1.6,
    description: "Prerequisite → dependent result",
  },
  implies: {
    label: "implies",
    color: "#426eae",
    width: 2,
    description: "Premise → consequence",
  },
  equivalent_to: {
    label: "equivalent to",
    color: "#8f69a2",
    width: 2,
    description: "Logical equivalence; both directions",
  },
  generalizes: {
    label: "generalizes",
    color: "#aa8548",
    width: 2.4,
    description: "More general object → special case",
  },
  illustrates: {
    label: "illustrates",
    color: "#b08065",
    width: 1.5,
    description: "Example → illustrated object",
  },
  counterexample_to: {
    label: "counterexample to",
    color: "#b56569",
    width: 2,
    description: "Counterexample → challenged claim",
  },
};
