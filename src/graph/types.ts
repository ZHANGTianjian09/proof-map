export const NODE_TYPES = [
  "theorem",
  "lemma",
  "proposition",
  "corollary",
  "definition",
  "assumption",
  "example",
  "counterexample",
  "remark",
  "claim",
] as const;
export const RELATION_TYPES = [
  "uses",
  "implies",
  "equivalent_to",
  "generalizes",
  "illustrates",
  "counterexample_to",
] as const;
export type ObjectType = (typeof NODE_TYPES)[number];
export type RelationType = (typeof RELATION_TYPES)[number];
export type JsonValue =
  string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type Metadata = Record<string, JsonValue>;

export interface SourceLocation {
  location: string;
  page?: number;
  metadata?: Metadata;
}
export interface Evidence {
  source: SourceLocation;
  excerpt?: string;
  note?: string;
  metadata?: Metadata;
}
export interface PaperSection {
  id: string;
  title: string;
  kind: "section" | "appendix";
  metadata?: Metadata;
}
export interface Paper {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  description?: string;
  citation?: string;
  sections?: PaperSection[];
  metadata?: Metadata;
}
export interface MathNode {
  id: string;
  type: ObjectType;
  label: string;
  number?: string;
  title: string;
  statement: string;
  section: string;
  source: SourceLocation;
  role?: string;
  evidence?: Evidence[];
  metadata?: Metadata;
}
export interface MathEdge {
  id: string;
  source: string;
  target: string;
  relation: RelationType;
  origin: "explicit" | "inferred";
  verification: "unverified" | "verified" | "disputed";
  evidence?: Evidence[];
  note?: string;
  metadata?: Metadata;
}
export interface PaperGraph {
  schema_version: "1.0.0";
  paper: Paper;
  nodes: MathNode[];
  edges: MathEdge[];
  metadata?: Metadata;
}
