import { describe, expect, it } from "vitest";
import sample from "../examples/statistical-estimation.graph.json";
import type { PaperGraph } from "../src/graph/types";
import { buildSearchIndex, searchObjects } from "../src/graph/search";
import { sectionPresentation } from "../src/graph/presentation";
import {
  inspectorBounds,
  readingViewport,
} from "../src/graph/inspector-layout";
import { calculateLayout } from "../src/graph/layout-core";
import { NODE_HEIGHT, NODE_WIDTH } from "../src/graph/layout-shared";
import { reusedPrerequisites } from "../src/graph/navigation";

const graph = sample as PaperGraph;
describe("canonical paper navigation", () => {
  it("finds hidden context, type aliases, literal numbers, sections, and opaque IDs without filtering data", () => {
    const before = structuredClone(graph);
    const index = buildSearchIndex(graph);
    for (const node of graph.nodes) {
      expect(
        searchObjects(index, node.id).some((r) => r.node.id === node.id),
      ).toBe(true);
      if (node.number)
        expect(
          searchObjects(index, `${node.type} ${node.number}`)[0].node.id,
        ).toBe(node.id);
    }
    expect(searchObjects(index, "THM 2.3")[0]?.node.type).toBe("theorem");
    expect(
      searchObjects(index, "setup").some((r) => r.node.id === "d-mean"),
    ).toBe(true);
    expect(
      searchObjects(index, "example").some((r) => r.node.type === "example"),
    ).toBe(true);
    expect(graph).toEqual(before);
  });
  it("ranks exact numbering ahead of partial matches and retains every result for pagination", () => {
    const input = {
      ...graph,
      nodes: Array.from({ length: 20 }, (_, i) => ({
        ...graph.nodes[0],
        id: `opaque-${i}`,
        type: "lemma" as const,
        label: `Lemma ${i + 1}`,
        number: `${i + 1}`,
        title: "A shared title",
      })),
      edges: [],
    };
    const index = buildSearchIndex(input);
    expect(searchObjects(index, "lem 2")[0].node.number).toBe("2");
    expect(searchObjects(index, "shared")).toHaveLength(20);
    expect(searchObjects(index, "missing")).toEqual([]);
  });
  it("counts reuse by distinct uses dependents, not parallel records, loops, or other relations", () => {
    const nodes = graph.nodes.slice(0, 3);
    const base = {
      source: nodes[0].id,
      target: nodes[1].id,
      relation: "uses" as const,
      origin: "inferred" as const,
      verification: "unverified" as const,
    };
    const input = {
      ...graph,
      nodes,
      edges: [
        { ...base, id: "a" },
        { ...base, id: "b" },
        { ...base, id: "c", target: nodes[0].id },
        { ...base, id: "d", target: nodes[2].id, relation: "implies" as const },
      ],
    };
    expect(reusedPrerequisites(input)).toEqual([]);
    input.edges.push({ ...base, id: "e", target: nodes[2].id });
    expect(reusedPrerequisites(input).map((r) => r.count)).toEqual([2]);
  });
});

describe("section identity and readable focus", () => {
  it("assigns colors from the complete catalog and keeps appendices distinct, independent of node order or visibility", () => {
    const original = sectionPresentation(graph);
    expect(
      sectionPresentation({ ...graph, nodes: [...graph.nodes].reverse() }),
    ).toEqual(original);
    expect(sectionPresentation({ ...graph, nodes: [] })).toEqual(original);
    expect(new Set([...original.values()].map((s) => s.color)).size).toBe(
      graph.paper.sections!.length,
    );
    expect(original.get("a")?.label).toContain("Appendix");
    const literal = { ...graph, paper: { id: "p", title: "p" } };
    expect(sectionPresentation(literal)).toEqual(
      sectionPresentation({ ...literal, nodes: [...literal.nodes].reverse() }),
    );
  });
  it.each([
    { width: 1200, height: 800 },
    { width: 800, height: 700 },
    { width: 390, height: 650 },
  ])(
    "focuses into readable space outside the inspector at $width px",
    (area) => {
      const bounds = {
        x: 8000,
        y: -2000,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      };
      const camera = readingViewport(bounds, area);
      const panel = inspectorBounds(area);
      const left = bounds.x * camera.zoom + camera.x;
      const top = bounds.y * camera.zoom + camera.y;
      expect(left).toBeGreaterThanOrEqual(12);
      expect(top).toBeGreaterThanOrEqual(12);
      if (area.width >= 760)
        expect(left + NODE_WIDTH * camera.zoom).toBeLessThan(panel.left);
      else expect(top + NODE_HEIGHT * camera.zoom).toBeLessThan(panel.top);
      expect(camera.zoom).toBeGreaterThan(0.7);
    },
  );
});

it("lays out 300 synthetic objects including disconnected objects without overlap or canonical mutation", async () => {
  const nodes = Array.from({ length: 300 }, (_, i) => ({
    ...graph.nodes[0],
    id: `n${i}`,
    metadata: {},
  }));
  const edges = nodes.flatMap((node, i) =>
    i % 10 < 8
      ? [
          {
            id: `e${i}`,
            source: node.id,
            target: nodes[i + 1].id,
            relation: "uses" as const,
            origin: "inferred" as const,
            verification: "unverified" as const,
          },
        ]
      : [],
  );
  const input = { ...graph, nodes, edges };
  const before = structuredClone(input);
  const positions = await calculateLayout(input);
  expect(positions.map((node) => node.id)).toEqual(
    nodes.map((node) => node.id),
  );
  for (let i = 0; i < positions.length; i++)
    for (let j = i + 1; j < positions.length; j++) {
      expect(
        Math.abs(positions[i].x - positions[j].x) >= NODE_WIDTH ||
          Math.abs(positions[i].y - positions[j].y) >= NODE_HEIGHT,
      ).toBe(true);
    }
  expect(input).toEqual(before);
}, 20_000);

it("packs disconnected components by translation without distorting an ELK proof chain", async () => {
  const { packComponents } = await import("../src/graph/layout-packing");
  const nodes = graph.nodes
    .slice(0, 4)
    .map((node, i) => ({ ...node, id: `p${i}` }));
  const input = {
    ...graph,
    nodes,
    edges: [
      {
        id: "uses",
        source: "p0",
        target: "p1",
        relation: "uses" as const,
        origin: "inferred" as const,
        verification: "unverified" as const,
      },
    ],
  };
  const original = [
    { id: "p0", x: 0, y: 0 },
    { id: "p1", x: 50, y: 240 },
    { id: "p2", x: 2000, y: 3000 },
    { id: "p3", x: 4000, y: 4000 },
  ];
  const before = structuredClone({ input, original });
  const packed = packComponents(input, original);
  expect(packed.map((p) => p.id)).toEqual(original.map((p) => p.id));
  expect(packed[1].x - packed[0].x).toBe(50);
  expect(packed[1].y - packed[0].y).toBe(240);
  expect(Math.max(...packed.map((p) => p.x + NODE_WIDTH))).toBeLessThan(2000);
  expect(Math.max(...packed.map((p) => p.y + NODE_HEIGHT))).toBeLessThan(2000);
  expect({ input, original }).toEqual(before);
});
