import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import invalidCases from "./fixtures/invalid-cases.json";
import { parseGraph } from "../src/graph/validation";
import { constructGraph, exportGraph } from "../src/graph/normalize";
import { calculateLayout } from "../src/graph/layout-core";
import { contextGraph, classifyNode } from "../src/graph/scope";
import { NODE_HEIGHT, NODE_WIDTH } from "../src/graph/layout-shared";
import type { PaperGraph } from "../src/graph/types";

const readFixture = (path: string) =>
  readFileSync(new URL(`./fixtures/${path}`, import.meta.url), "utf8");

function accepted(path: string): PaperGraph {
  const result = parseGraph(readFixture(`valid/${path}.graph.json`));
  if (!result.ok) throw new Error(JSON.stringify(result.issues));
  return result.graph;
}

describe("independent synthetic QA fixtures", () => {
  it.each([
    ["minimal", 4, 1],
    ["theoretical-statistics", 16, 19],
    ["complex-150", 150, 211],
  ] as const)(
    "preserves every object and relation in %s",
    (name, nodes, edges) => {
      const graph = accepted(name);
      const before = structuredClone(graph);
      expect(graph.nodes).toHaveLength(nodes);
      expect(graph.edges).toHaveLength(edges);
      for (const input of [
        graph,
        {
          ...graph,
          nodes: [...graph.nodes].reverse(),
          edges: [...graph.edges].reverse(),
        },
      ]) {
        const index = constructGraph(input);
        expect([...index.nodesById.values()]).toEqual(input.nodes);
        expect([...index.incoming.values()].flat()).toHaveLength(edges);
        expect([...index.outgoing.values()].flat()).toHaveLength(edges);
        for (const edge of input.edges) {
          expect(index.incoming.get(edge.target)).toContainEqual(edge);
          expect(index.outgoing.get(edge.source)).toContainEqual(edge);
        }
        contextGraph(input);
        const roundTrip = parseGraph(exportGraph(input));
        expect(roundTrip.ok).toBe(true);
        if (roundTrip.ok) expect(roundTrip.graph).toEqual(input);
      }
      expect(graph).toEqual(before);
    },
  );

  it.each(invalidCases)(
    "rejects $file at an actionable location",
    (fixture) => {
      const result = parseGraph(readFixture(`invalid/${fixture.file}`));
      expect(result.ok).toBe(false);
      if (!result.ok)
        expect(result.issues).toContainEqual({
          path: fixture.path,
          message: expect.stringContaining(fixture.message),
        });
    },
  );

  it("keeps every origin/status combination independent and preserves evidence and appendix data", () => {
    const graph = accepted("theoretical-statistics");
    expect(
      new Set(graph.edges.map((e) => `${e.origin}/${e.verification}`)).size,
    ).toBe(6);
    expect(
      graph.edges.filter((e) => e.source === "l-mgf" && e.relation === "uses")
        .length,
    ).toBeGreaterThan(1);
    expect(
      graph.edges.filter((e) => e.target === "t-tail" && e.relation === "uses")
        .length,
    ).toBeGreaterThan(1);
    const index = constructGraph(graph);
    expect(index.incoming.get("r-appendix")).toEqual([]);
    expect(index.outgoing.get("r-appendix")).toEqual([]);
    const exported = parseGraph(exportGraph(graph));
    expect(exported.ok).toBe(true);
    if (exported.ok) expect(exported.graph).toEqual(graph);
  });

  it("scope edits preserve metadata siblings, unknown classifications, and the full canonical payload", () => {
    const graph = accepted("theoretical-statistics");
    const before = structuredClone(graph);
    const changed = classifyNode(graph, "a-independent", "local_proof");
    const expected = structuredClone(graph);
    expected.nodes[0].metadata!.scope = "local_proof";
    expect(changed).toEqual(expected);
    expect(contextGraph(changed).nodes.some((n) => n.id === "d-appendix")).toBe(
      true,
    );
    expect(graph).toEqual(before);
    const unclassified = classifyNode(changed, "a-independent", "unclassified");
    delete expected.nodes[0].metadata!.scope;
    expect(unclassified).toEqual(expected);
    expect(parseGraph(exportGraph(unclassified))).toEqual({
      ok: true,
      graph: expected,
    });
  });

  it("lays out all 150 objects, including isolated nodes, without overlap or canonical mutation", async () => {
    const graph = accepted("complex-150");
    const before = structuredClone(graph);
    const positions = await calculateLayout(graph);
    expect(positions.map((p) => p.id)).toEqual(graph.nodes.map((n) => n.id));
    expect(positions.filter((p) => p.id.startsWith("isolated-"))).toHaveLength(
      10,
    );
    positions.forEach((p, i) => {
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
      for (const other of positions.slice(i + 1))
        expect(
          Math.abs(p.x - other.x) >= NODE_WIDTH ||
            Math.abs(p.y - other.y) >= NODE_HEIGHT,
        ).toBe(true);
    });
    expect(graph).toEqual(before);
  }, 20_000);
});
