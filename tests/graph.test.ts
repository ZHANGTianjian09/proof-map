import { describe, expect, it } from "vitest";
import sample from "../examples/statistical-estimation.graph.json";
import { constructGraph, exportGraph } from "../src/graph/normalize";
import { visibleGraph } from "../src/graph/filters";
import { NODE_TYPES, type PaperGraph } from "../src/graph/types";
import { parseGraph } from "../src/graph/validation";
import { calculateLayout } from "../src/graph/layout-core";
import {
  gridLayout,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "../src/graph/layout-shared";

const graph = sample as PaperGraph;
describe("mathematical graph construction and preservation", () => {
  it("indexes every node and every edge, including isolated nodes", () => {
    const index = constructGraph(graph);
    expect(index.nodesById.size).toBe(graph.nodes.length);
    expect(index.incoming.get("r-isolated")).toEqual([]);
    expect(index.outgoing.get("r-isolated")).toEqual([]);
    expect([...index.incoming.values()].flat()).toHaveLength(
      graph.edges.length,
    );
    expect([...index.outgoing.values()].flat()).toHaveLength(
      graph.edges.length,
    );
  });
  it("keeps prerequisite → dependent orientation and non-dependency relationships", () => {
    const index = constructGraph(graph);
    expect(index.incoming.get("t-concentration")!.map((e) => e.source)).toEqual(
      ["l-mgf", "l-chernoff"],
    );
    expect(index.outgoing.get("e-gaussian")![0].relation).toBe("illustrates");
    expect(index.outgoing.get("ce-heavy")![0].relation).toBe(
      "counterexample_to",
    );
  });
  it("filters a view without deleting data, and exports the whole graph", () => {
    const before = structuredClone(graph);
    const filtered = visibleGraph(graph, {
      query: "",
      section: null,
      types: ["theorem"],
    });
    expect(filtered.nodes).toHaveLength(2);
    expect(filtered.edges).toHaveLength(0);
    expect(graph).toEqual(before);
    const imported = parseGraph(exportGraph(graph));
    expect(imported.ok).toBe(true);
    if (imported.ok) expect(imported.graph).toEqual(before);
  });
  it("searches full statements and filters isolated appendix nodes", () => {
    expect(
      visibleGraph(graph, {
        query: "robust",
        section: "a",
        types: [...NODE_TYPES],
      }).nodes.map((n) => n.id),
    ).toEqual(["r-isolated"]);
    expect(
      visibleGraph(graph, { query: "", section: null, types: [] }).nodes,
    ).toEqual([]);
  });
  it("handles arbitrary IDs without using object property names as indexes", () => {
    const unusual = {
      ...graph,
      nodes: [{ ...graph.nodes[0], id: "__proto__" }],
      edges: [],
    };
    expect(constructGraph(unusual).nodesById.get("__proto__")?.id).toBe(
      "__proto__",
    );
  });
});

describe("cycle-safe automatic layout", () => {
  it("positions all nodes without overlap or mathematical mutation, even with a cycle and isolated node", async () => {
    const before = structuredClone(graph);
    const positions = await calculateLayout(graph);
    expect(positions.map((p) => p.id)).toEqual(graph.nodes.map((n) => n.id));
    positions.forEach((p) => {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    });
    for (const a of positions)
      for (const b of positions) {
        if (a.id === b.id) continue;
        expect(
          Math.abs(a.x - b.x) >= NODE_WIDTH ||
            Math.abs(a.y - b.y) >= NODE_HEIGHT,
        ).toBe(true);
      }
    expect(graph).toEqual(before);
  });
  it("supports self loops, parallel edges, and IDs that could collide with layout internals", async () => {
    const nodes = graph.nodes
      .slice(0, 2)
      .map((n, i) => ({ ...n, id: i ? "root" : "e0" }));
    const edge = {
      id: "root",
      source: "e0",
      target: "root",
      relation: "uses" as const,
      origin: "inferred" as const,
      verification: "unverified" as const,
    };
    const input = {
      ...graph,
      nodes,
      edges: [
        edge,
        { ...edge, id: "parallel" },
        { ...edge, id: "backward", source: "root", target: "e0" },
        { ...edge, id: "loop", target: "e0" },
      ],
    };
    expect(await calculateLayout(input)).toHaveLength(2);
    expect(input.edges[2].source).toBe("root");
  });
  it("handles empty graphs and preserves all objects in the fallback grid", async () => {
    expect(await calculateLayout({ ...graph, nodes: [], edges: [] })).toEqual(
      [],
    );
    expect(gridLayout(graph).map((p) => p.id)).toEqual(
      graph.nodes.map((n) => n.id),
    );
  });
});
