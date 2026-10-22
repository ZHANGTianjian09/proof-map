import { describe, expect, it } from "vitest";
import sample from "../examples/statistical-estimation.graph.json";
import type { PaperGraph } from "../src/graph/types";
import { classifyNode, contextGraph, nodeScope } from "../src/graph/scope";
import { positionPanel } from "../src/graph/panel-position";
import { mapBounds, planPdf } from "../src/export/pdf-plan";
import { edgeGeometry } from "../src/graph/edge-geometry";
import { parseGraph } from "../src/graph/validation";
import { exportGraph } from "../src/graph/normalize";
const graph = sample as PaperGraph;

describe("explicit mathematical context", () => {
  it("hides only explicitly marked context and removes its incident edges from the view", () => {
    const before = structuredClone(graph),
      view = contextGraph(graph);
    expect(view.nodes).toHaveLength(12);
    expect(view.nodes.some((n) => n.id === "r-isolated")).toBe(true);
    expect(
      view.edges.every(
        (e) =>
          view.nodes.some((n) => n.id === e.source) &&
          view.nodes.some((n) => n.id === e.target),
      ),
    ).toBe(true);
    expect(contextGraph(graph, true)).toEqual(graph);
    expect(graph).toEqual(before);
  });
  it("keeps legacy and local definitions visible without degree/type inference", () => {
    const copy = structuredClone(graph);
    copy.nodes.forEach((n) => delete n.metadata);
    copy.nodes[0].metadata = { scope: "local_proof" };
    copy.nodes[1].metadata = { scope: "future-extension" };
    expect(contextGraph(copy).nodes).toHaveLength(copy.nodes.length);
    expect(nodeScope(copy.nodes[1])).toBe("unclassified");
    expect(parseGraph(exportGraph(copy)).ok).toBe(true);
  });
  it("persists only an intentional metadata edit and preserves all mathematical data", () => {
    const before = structuredClone(graph);
    const next = classifyNode(graph, "d-mean", "local_proof");
    expect(contextGraph(next).nodes).toHaveLength(13);
    expect(next.edges).toBe(graph.edges);
    next.nodes.forEach((n, i) =>
      expect({ ...n, metadata: undefined }).toEqual({
        ...before.nodes[i],
        metadata: undefined,
      }),
    );
    expect(graph).toEqual(before);
    const result = parseGraph(exportGraph(next));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.graph).toEqual(next);
    expect(
      nodeScope(classifyNode(next, "d-mean", "unclassified").nodes[1]),
    ).toBe("unclassified");
  });
});

describe("floating inspector positioning", () => {
  it("prefers the available side and clamps panned anchors inside the canvas", () => {
    const area = { width: 1000, height: 700 },
      size = { width: 460, height: 620 };
    expect(
      positionPanel({ x: 50, y: 100, width: 100, height: 80 }, area, size).side,
    ).toBe("right");
    expect(
      positionPanel({ x: 800, y: 100, width: 100, height: 80 }, area, size)
        .side,
    ).toBe("left");
    for (const anchor of [
      { x: -2000, y: -2000, width: 50, height: 50 },
      { x: 3000, y: 3000, width: 50, height: 50 },
    ]) {
      const p = positionPanel(anchor, area, size);
      expect(p.left).toBeGreaterThanOrEqual(12);
      expect(p.top).toBeGreaterThanOrEqual(12);
      expect(p.left + p.width).toBeLessThanOrEqual(area.width - 12);
      expect(p.top + p.maxHeight).toBeLessThanOrEqual(area.height - 12);
    }
  });
  it("fits small screens without becoming fullscreen", () => {
    const p = positionPanel(
      { x: 300, y: 400, width: 100, height: 100 },
      { width: 390, height: 650 },
      { width: 460, height: 429 },
    );
    expect(p.width).toBe(366);
    expect(p.maxHeight).toBe(429);
    expect(p.left + p.width).toBeLessThanOrEqual(378);
  });
});

describe("complete PDF planning", () => {
  const nodes = [
    { id: "a", x: 0, y: 0, width: 304, height: 160 },
    { id: "b", x: 400, y: 400, width: 304, height: 160 },
  ];
  it("includes cyclic curves and arrowhead clearance in full-map bounds", () => {
    const edge = {
      id: "back",
      source: "b",
      target: "a",
      relation: "uses" as const,
      origin: "inferred" as const,
      verification: "unverified" as const,
    };
    const bounds = mapBounds(nodes, [edge]);
    const curve = edgeGeometry(
      { x: 552, y: 560 },
      { x: 152, y: 0 },
      0,
      1,
    ).bounds;
    expect(bounds.x).toBeLessThanOrEqual(curve.x);
    expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(
      curve.x + curve.width,
    );
    expect(bounds.y + bounds.height).toBeGreaterThanOrEqual(
      curve.y + curve.height,
    );
  });
  it("uses one readable page for a small diagram", () => {
    const pages = planPdf(mapBounds(nodes, []), nodes);
    expect(pages).toHaveLength(1);
    expect(pages[0].scale).toBeGreaterThanOrEqual(0.75);
  });
  it("tiles large graphs with overlap sufficient to contain every complete card on at least one page", () => {
    const large = Array.from({ length: 120 }, (_, i) => ({
      id: String(i),
      x: (i % 12) * 400,
      y: Math.floor(i / 12) * 300,
      width: 304,
      height: 160,
    }));
    const pages = planPdf(mapBounds(large, []), large);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((p) => p.scale === 0.75)).toBe(true);
    for (const node of large)
      expect(
        pages.some(
          ({ rect: r }) =>
            node.x >= r.x &&
            node.y >= r.y &&
            node.x + node.width <= r.x + r.width &&
            node.y + node.height <= r.y + r.height,
        ),
      ).toBe(true);
  });
});
