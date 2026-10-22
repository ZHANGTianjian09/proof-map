import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import sample from "../examples/statistical-estimation.graph.json";
import type { PaperGraph } from "../src/graph/types";
import {
  auditPaperMap,
  VIEWER_IMPORT_LIMIT_BYTES,
} from "../scripts/extraction/audit";

function fixture() {
  return structuredClone(sample) as PaperGraph;
}
function text(graph: PaperGraph) {
  return JSON.stringify(graph);
}
function inventory(graph: PaperGraph) {
  return text({ ...graph, edges: [] });
}

describe("paper extraction preservation audit", () => {
  it("counts the complete graph, retains isolated/global objects, and does not mutate input", () => {
    const graph = fixture();
    const original = text(graph);
    const report = auditPaperMap(original, inventory(graph));
    expect(report.status).toBe("passed");
    expect(report.checks.inventory_preservation).toBe("passed");
    expect(report.counts?.nodes).toBe(16);
    expect(report.counts?.edges).toBe(16);
    expect(report.counts?.edges_by_origin).toEqual({
      explicit: 12,
      inferred: 4,
    });
    expect(report.counts?.isolated_node_ids).toEqual(["r-isolated"]);
    expect(report.counts?.global_context_node_ids).toEqual([
      "a-iid",
      "d-mean",
      "d-subg",
      "a-subg",
    ]);
    expect(text(graph)).toBe(original);
    expect(report.not_verified.join(" ")).toContain("Source coverage");
  });

  it.each(["r-isolated", "a-iid"])(
    "detects omitted object %s even when the remaining graph is structurally valid",
    (id) => {
      const graph = fixture();
      const baseline = inventory(graph);
      graph.nodes = graph.nodes.filter((node) => node.id !== id);
      graph.edges = graph.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      );
      const report = auditPaperMap(text(graph), baseline);
      expect(report.checks.canonical_import).toBe("passed");
      expect(report.status).toBe("failed");
      expect(
        report.issues.some(
          (issue) =>
            issue.message.includes(id) && issue.message.includes("missing"),
        ),
      ).toBe(true);
    },
  );

  it.each(["statement", "number", "source", "metadata"] as const)(
    "detects a changed %s instead of silently accepting a rewritten object",
    (field) => {
      const graph = fixture();
      const baseline = inventory(graph);
      if (field === "statement")
        graph.nodes[0].statement =
          "A shorter summary that drops the hypotheses.";
      if (field === "number") graph.nodes[0].number = "1.0";
      if (field === "source")
        graph.nodes[0].source = { location: "An unsupported locator" };
      if (field === "metadata")
        graph.nodes[0].metadata = { scope: "local_proof" };
      const report = auditPaperMap(text(graph), baseline);
      expect(report.status).toBe("failed");
      expect(report.issues).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: "/nodes/0" })]),
      );
    },
  );

  it("allows node/key reordering while detecting unreviewed additions and paper-version changes", () => {
    const graph = fixture();
    graph.paper.metadata = { source_version: "v1" };
    const baseline = inventory(graph);
    graph.nodes.reverse();
    const { statement, ...rest } = graph.nodes[0];
    graph.nodes[0] = { statement, ...rest };
    expect(auditPaperMap(text(graph), baseline).status).toBe("passed");
    graph.nodes.push({ ...graph.nodes[0], id: "unreviewed-object" });
    graph.paper.metadata.source_version = "v2";
    const report = auditPaperMap(text(graph), baseline);
    expect(report.status).toBe("failed");
    expect(report.issues.map((issue) => issue.path)).toEqual([
      "/paper",
      "/nodes/16",
    ]);
  });

  it("preserves cycles, self loops, parallel edges, and unknown JSON metadata/scope", () => {
    const graph = fixture();
    graph.nodes[0].metadata = {
      scope: ["global_context"],
      extension: { original: [null, 3, true, "raw"] },
    };
    graph.edges.push({ ...graph.edges[0], id: "parallel" });
    graph.edges.push({
      ...graph.edges[0],
      id: "self",
      target: graph.edges[0].source,
    });
    const baseline = inventory(graph);
    const report = auditPaperMap(text(graph), baseline);
    expect(report.status).toBe("passed");
    expect(report.counts?.edges).toBe(18);
    expect(report.counts?.nodes_by_scope.unrecognized).toBe(1);
    expect(report.warnings.join(" ")).toContain("Unrecognized scope");
    delete graph.nodes[0].metadata.extension;
    expect(auditPaperMap(text(graph), baseline).status).toBe("failed");
  });

  it("uses the Viewer boundary for duplicate properties, invalid evidence, and dangling endpoints", () => {
    for (const file of [
      "escaped-duplicate-property.json",
      "explicit-without-evidence.json",
      "dangling-target.json",
    ]) {
      const raw = readFileSync(
        new URL(`./fixtures/invalid/${file}`, import.meta.url),
        "utf8",
      );
      const report = auditPaperMap(raw);
      expect(report.checks.canonical_import).toBe("failed");
      expect(report.status).toBe("failed");
      expect(report.issues.length).toBeGreaterThan(0);
    }
  });

  it("does not report an inventory check as passed when absent, malformed, or containing relationships", () => {
    const raw = text(fixture());
    expect(auditPaperMap(raw).checks.inventory_preservation).toBe("not_run");
    expect(auditPaperMap(raw, "{").status).toBe("failed");
    expect(auditPaperMap(raw, raw).status).toBe("failed");
  });

  it("separates the byte-based import limit from structural validity", () => {
    const graph = fixture();
    graph.metadata = {
      padding: "界".repeat(Math.ceil(VIEWER_IMPORT_LIMIT_BYTES / 3)),
    };
    const raw = text(graph);
    expect(raw.length).toBeLessThan(VIEWER_IMPORT_LIMIT_BYTES);
    const report = auditPaperMap(raw);
    expect(report.checks.canonical_import).toBe("passed");
    expect(report.checks.viewer_file_limit).toBe("failed");
    expect(report.status).toBe("failed");
    expect(report.counts?.nodes).toBe(16);
  });
});

describe("read-only extraction CLI", () => {
  const cli = new URL("../scripts/extraction/validate.mjs", import.meta.url);
  it("outputs parseable counts without changing the source file", () => {
    const input = new URL(
      "../examples/statistical-estimation.graph.json",
      import.meta.url,
    );
    const before = readFileSync(input);
    const output = execFileSync(
      process.execPath,
      [cli.pathname, input.pathname],
      { encoding: "utf8" },
    );
    const report = JSON.parse(output);
    expect(report.status).toBe("passed");
    expect(report.counts.nodes).toBe(16);
    expect(report.checks.inventory_preservation).toBe("not_run");
    expect(readFileSync(input)).toEqual(before);
  });
  it("returns failure for an invalid graph and a distinct error for an inaccessible input", () => {
    const invalid = new URL(
      "./fixtures/invalid/duplicate-node-id.json",
      import.meta.url,
    );
    const result = spawnSync(
      process.execPath,
      [cli.pathname, invalid.pathname],
      { encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).checks.canonical_import).toBe("failed");
    const missing = spawnSync(
      process.execPath,
      [cli.pathname, "/nonexistent-proof-map-input/graph.json"],
      { encoding: "utf8" },
    );
    expect(missing.status).toBe(2);
    expect(missing.stdout).toBe("");
  });
});
