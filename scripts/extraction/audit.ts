import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  NODE_TYPES,
  RELATION_TYPES,
  type PaperGraph,
} from "../../src/graph/types";
import { parseGraph, type ValidationIssue } from "../../src/graph/validation";

// Mirrors the file-picker boundary in App.tsx; this is not a schema constraint.
export const VIEWER_IMPORT_LIMIT_BYTES = 10 * 1024 * 1024;

type Check = "passed" | "failed" | "not_run";
type AuditIssue = ValidationIssue & { input: "graph" | "inventory" };

function counts<T extends string>(values: T[], vocabulary: readonly T[]) {
  const result = new Map(vocabulary.map((value) => [value, 0]));
  for (const value of values) result.set(value, (result.get(value) ?? 0) + 1);
  return Object.fromEntries(result);
}

function summarize(graph: PaperGraph) {
  const incident = new Set(
    graph.edges.flatMap((edge) => [edge.source, edge.target]),
  );
  const scope = graph.nodes.map((node) => {
    const value = node.metadata?.scope;
    if (value === "global_context" || value === "local_proof") return value;
    return value === undefined ? "unclassified" : "unrecognized";
  });
  return {
    paper_id: graph.paper.id,
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    nodes_by_type: counts(
      graph.nodes.map((node) => node.type),
      NODE_TYPES,
    ),
    nodes_by_section: counts(
      graph.nodes.map((node) => node.section),
      [],
    ),
    edges_by_relation: counts(
      graph.edges.map((edge) => edge.relation),
      RELATION_TYPES,
    ),
    edges_by_origin: counts(
      graph.edges.map((edge) => edge.origin),
      ["explicit", "inferred"],
    ),
    edges_by_verification: counts(
      graph.edges.map((edge) => edge.verification),
      ["unverified", "verified", "disputed"],
    ),
    nodes_by_scope: counts(scope, [
      "global_context",
      "local_proof",
      "unclassified",
      "unrecognized",
    ]),
    isolated_node_ids: graph.nodes
      .filter((node) => !incident.has(node.id))
      .map((node) => node.id),
    global_context_node_ids: graph.nodes
      .filter((node) => node.metadata?.scope === "global_context")
      .map((node) => node.id),
  };
}

/** Read-only audit. The inventory is an independently source-audited canonical graph with no edges. */
export function auditPaperMap(graphText: string, inventoryText?: string) {
  const issues: AuditIssue[] = [];
  const warnings: string[] = [];
  const checks: Record<
    "canonical_import" | "viewer_file_limit" | "inventory_preservation",
    Check
  > = {
    canonical_import: "not_run",
    viewer_file_limit: "not_run",
    inventory_preservation: "not_run",
  };
  const graphBytes = Buffer.byteLength(graphText, "utf8");
  checks.viewer_file_limit =
    graphBytes <= VIEWER_IMPORT_LIMIT_BYTES ? "passed" : "failed";
  if (checks.viewer_file_limit === "failed")
    issues.push({
      input: "graph",
      path: "/",
      message: `File is ${graphBytes} bytes; the Viewer accepts at most ${VIEWER_IMPORT_LIMIT_BYTES} bytes. Do not delete mathematical objects to fit this limit.`,
    });

  const parsed = parseGraph(graphText);
  checks.canonical_import = parsed.ok ? "passed" : "failed";
  if (!parsed.ok)
    issues.push(
      ...parsed.issues.map((issue) => ({ ...issue, input: "graph" as const })),
    );

  if (inventoryText === undefined) {
    warnings.push(
      "No independent node inventory supplied; omitted or changed objects have not been checked.",
    );
  } else {
    const inventory = parseGraph(inventoryText);
    if (!inventory.ok) {
      checks.inventory_preservation = "failed";
      issues.push(
        ...inventory.issues.map((issue) => ({
          ...issue,
          input: "inventory" as const,
        })),
      );
    } else if (inventory.graph.edges.length !== 0) {
      checks.inventory_preservation = "failed";
      issues.push({
        input: "inventory",
        path: "/edges",
        message: "The Phase B node inventory must have an empty edges array.",
      });
    } else if (parsed.ok) {
      checks.inventory_preservation = "passed";
      const mismatch = (path: string, message: string) => {
        checks.inventory_preservation = "failed";
        issues.push({ input: "graph", path, message });
      };
      if (!isDeepStrictEqual(parsed.graph.paper, inventory.graph.paper)) {
        mismatch(
          "/paper",
          "Paper identity, version metadata, or section catalog differs from the inventory; review the source version before reconciling.",
        );
      }
      const expected = new Map(
        inventory.graph.nodes.map((node) => [node.id, node]),
      );
      const actualIds = new Set(parsed.graph.nodes.map((node) => node.id));
      for (const node of inventory.graph.nodes) {
        if (!actualIds.has(node.id))
          mismatch(
            "/nodes",
            `Inventoried object ${JSON.stringify(node.id)} is missing (including isolated/context objects).`,
          );
      }
      parsed.graph.nodes.forEach((node, index) => {
        const original = expected.get(node.id);
        if (!original)
          mismatch(
            `/nodes/${index}`,
            `Object ${JSON.stringify(node.id)} is absent from the independent inventory.`,
          );
        else if (!isDeepStrictEqual(node, original))
          mismatch(
            `/nodes/${index}`,
            `Object ${JSON.stringify(node.id)} differs from its inventory record. Check statement, numbering, provenance, scope, and all metadata; do not silently refresh the baseline.`,
          );
      });
    }
  }

  if (parsed.ok) {
    const graph = parsed.graph;
    if (
      graph.nodes.some(
        (node) =>
          node.metadata?.scope !== undefined &&
          node.metadata.scope !== "global_context" &&
          node.metadata.scope !== "local_proof",
      )
    ) {
      warnings.push(
        "Unrecognized scope values are preserved and remain eligible for display; review classification manually.",
      );
    }
    if (
      graph.edges.some(
        (edge) =>
          edge.origin === "inferred" && !edge.note && !edge.evidence?.length,
      )
    ) {
      warnings.push(
        "Some inferred relationships have neither a note nor evidence. Record their reasoning and uncertainty before finalizing extraction.",
      );
    }
    if (graph.edges.some((edge) => edge.verification === "verified")) {
      warnings.push(
        "The graph contains supplied verified labels. This audit has not verified those relationships or their reviewer provenance.",
      );
    }
  }

  return {
    report_version: 1,
    status: issues.length ? ("failed" as const) : ("passed" as const),
    graph_sha256: createHash("sha256").update(graphText).digest("hex"),
    graph_bytes: graphBytes,
    ...(inventoryText === undefined
      ? {}
      : {
          inventory_sha256: createHash("sha256")
            .update(inventoryText)
            .digest("hex"),
        }),
    checks,
    ...(parsed.ok ? { counts: summarize(parsed.graph) } : {}),
    issues,
    warnings,
    not_verified: [
      "Source coverage, inventory independence, and completeness against the paper.",
      "Mathematical statement fidelity and numbering against source files or PDF.",
      "Proof dependency direction, evidence accuracy, inference quality, and scope classification.",
      "Browser import, layout, TeX rendering, inspection, and export (not run by this command).",
      "Mathematical truth or proof correctness.",
    ],
  };
}
