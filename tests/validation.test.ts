import { describe, expect, it } from "vitest";
import sample from "../examples/statistical-estimation.graph.json";
import schema from "../schemas/proof-map.v1.schema.json";
import {
  NODE_TYPES,
  RELATION_TYPES,
  type PaperGraph,
} from "../src/graph/types";
import { parseGraph, validateGraph } from "../src/graph/validation";

function fixture() {
  return structuredClone(sample) as PaperGraph;
}
function errors(input: unknown) {
  const result = validateGraph(input);
  expect(result.ok).toBe(false);
  return result.ok ? [] : result.issues;
}

describe("canonical graph validation", () => {
  it("accepts the synthetic example, including every supported mathematical type and relation", () => {
    expect(validateGraph(sample).ok).toBe(true);
    expect(new Set(sample.nodes.map((n) => n.type))).toEqual(
      new Set(NODE_TYPES),
    );
    expect(new Set(sample.edges.map((e) => e.relation))).toEqual(
      new Set(RELATION_TYPES),
    );
  });
  it("keeps TypeScript and JSON schema vocabularies aligned", () => {
    expect(schema.definitions.node.properties.type.enum).toEqual([
      ...NODE_TYPES,
    ]);
    expect(schema.definitions.edge.properties.relation.enum).toEqual([
      ...RELATION_TYPES,
    ]);
  });
  it("rejects duplicate node IDs with an exact location", () => {
    const graph = fixture();
    graph.nodes[1].id = graph.nodes[0].id;
    expect(errors(graph)).toContainEqual({
      path: "/nodes/1/id",
      message: `Duplicate node ID "${graph.nodes[0].id}".`,
    });
  });
  it("rejects duplicate edge and section IDs", () => {
    const graph = fixture();
    graph.edges[1].id = graph.edges[0].id;
    graph.paper.sections![1].id = graph.paper.sections![0].id;
    expect(errors(graph).map((e) => e.path)).toEqual(
      expect.arrayContaining(["/edges/1/id", "/paper/sections/1/id"]),
    );
  });
  it("identifies missing fields rather than inventing statements", () => {
    const { statement: _statement, ...node } = fixture().nodes[0];
    expect(errors({ ...fixture(), nodes: [node], edges: [] })).toContainEqual({
      path: "/nodes/0",
      message: 'Missing required field "statement".',
    });
  });
  it("rejects dangling source and target endpoints", () => {
    const graph = fixture();
    graph.edges[0].source = "missing";
    graph.edges[0].target = "also-missing";
    expect(errors(graph).map((e) => e.path)).toEqual([
      "/edges/0/source",
      "/edges/0/target",
    ]);
  });
  it("rejects unknown sections when a section catalog is supplied", () => {
    const graph = fixture();
    graph.nodes[0].section = "unknown";
    expect(errors(graph)[0].path).toBe("/nodes/0/section");
  });
  it("allows raw section labels when no catalog is supplied", () => {
    const graph = fixture();
    delete graph.paper.sections;
    expect(validateGraph(graph).ok).toBe(true);
  });
  it("lists supported relations for an unsupported relation", () => {
    const graph = fixture();
    Object.assign(graph.edges[0], { relation: "proves" });
    expect(errors(graph)[0]).toEqual({
      path: "/edges/0/relation",
      message: `Must be one of: ${RELATION_TYPES.join(", ")}.`,
    });
  });
  it("rejects unsupported schema versions", () => {
    expect(errors({ ...fixture(), schema_version: "2.0.0" })[0].path).toBe(
      "/schema_version",
    );
  });
  it("requires origin, verification, and evidence for explicit relationships", () => {
    const graph = fixture();
    delete graph.edges[0].evidence;
    expect(errors(graph)).toContainEqual({
      path: "/edges/0",
      message: 'Missing required field "evidence".',
    });
    const {
      origin: _origin,
      verification: _verification,
      ...edge
    } = fixture().edges[0];
    expect(
      errors({ ...fixture(), edges: [edge] }).map((e) => e.message),
    ).toEqual(
      expect.arrayContaining([
        'Missing required field "origin".',
        'Missing required field "verification".',
      ]),
    );
  });
  it("rejects unknown structural keys while retaining arbitrary metadata", () => {
    expect(errors({ ...fixture(), links: [] })[0].message).toContain(
      'Unknown field "links"',
    );
    const graph = fixture();
    graph.metadata = { future: { score: 0.9, values: [null, true, "x"] } };
    const before = structuredClone(graph);
    expect(validateGraph(graph).ok).toBe(true);
    expect(graph).toEqual(before);
  });
  it("does not coerce values or accept whitespace-only statements", () => {
    const graph = fixture();
    Object.assign(graph.nodes[0].source, { page: "1" });
    graph.nodes[0].statement = "   ";
    expect(errors(graph).map((e) => e.path)).toEqual(
      expect.arrayContaining(["/nodes/0/source/page", "/nodes/0/statement"]),
    );
  });
  it("accepts empty graphs, cycles, self loops, parallel edges, and unnumbered objects", () => {
    const graph = fixture();
    delete graph.nodes[0].number;
    graph.edges.push({
      id: "self",
      source: graph.nodes[0].id,
      target: graph.nodes[0].id,
      relation: "equivalent_to",
      origin: "inferred",
      verification: "unverified",
    });
    graph.edges.push({ ...graph.edges[0], id: "parallel" });
    expect(validateGraph(graph).ok).toBe(true);
    expect(validateGraph({ ...graph, nodes: [], edges: [] }).ok).toBe(true);
  });
});

describe("JSON text import", () => {
  it("reports malformed JSON syntax", () => {
    const result = parseGraph('{"nodes": [');
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues[0].message).toContain("Invalid JSON syntax");
  });
  it("rejects duplicate JSON properties instead of silently discarding data", () => {
    const result = parseGraph('{"paper": {"title": "A", "title": "B"}}');
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.issues[0].message).toContain(
        'Duplicate JSON property "title"',
      );
  });
  it("rejects non-object JSON and nonstandard comments/trailing commas", () => {
    for (const text of ["null", "[]", "1", '{"a":1,}', "{/*comment*/}"])
      expect(parseGraph(text).ok).toBe(false);
  });
  it("keeps the mathematical payload byte-for-byte at string level", () => {
    const graph = fixture();
    graph.nodes[0].statement = "  $x^2$\n\\[\\alpha\\leq\\beta\\]\n  ";
    graph.nodes[0].label = " Original  label ";
    const result = parseGraph(JSON.stringify(graph));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.graph).toEqual(graph);
  });
});
