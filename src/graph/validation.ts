import Ajv, { type ErrorObject } from "ajv";
import { visit } from "jsonc-parser";
import schema from "../../schemas/proof-map.v1.schema.json";
import type { PaperGraph } from "./types";

export interface ValidationIssue {
  path: string;
  message: string;
}
export type ValidationResult =
  { ok: true; graph: PaperGraph } | { ok: false; issues: ValidationIssue[] };
const ajv = new Ajv({ allErrors: true, strict: true });
const validateStructure = ajv.compile<PaperGraph>(schema);

function structuralIssue(error: ErrorObject): ValidationIssue {
  const path = error.instancePath || "/";
  if (error.keyword === "required")
    return {
      path,
      message: `Missing required field "${error.params.missingProperty}".`,
    };
  if (error.keyword === "additionalProperties")
    return {
      path,
      message: `Unknown field "${error.params.additionalProperty}". Put extension data in "metadata".`,
    };
  if (error.keyword === "enum")
    return {
      path,
      message: `Must be one of: ${error.params.allowedValues.join(", ")}.`,
    };
  if (error.keyword === "const")
    return {
      path,
      message: `Expected supported value ${JSON.stringify(error.params.allowedValue)}.`,
    };
  return { path, message: error.message ?? "Invalid value." };
}

/** Strict canonical import boundary. Never coerces, defaults, or removes values. */
export function validateGraph(input: unknown): ValidationResult {
  if (!validateStructure(input)) {
    return {
      ok: false,
      issues: (validateStructure.errors ?? [])
        .filter((e) => e.keyword !== "if")
        .map(structuralIssue),
    };
  }
  const issues: ValidationIssue[] = [];
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const sectionIds = new Set<string>();
  input.paper.sections?.forEach((section, i) => {
    if (sectionIds.has(section.id))
      issues.push({
        path: `/paper/sections/${i}/id`,
        message: `Duplicate section ID "${section.id}".`,
      });
    sectionIds.add(section.id);
  });
  input.nodes.forEach((node, i) => {
    if (nodeIds.has(node.id))
      issues.push({
        path: `/nodes/${i}/id`,
        message: `Duplicate node ID "${node.id}".`,
      });
    nodeIds.add(node.id);
    if (input.paper.sections && !sectionIds.has(node.section))
      issues.push({
        path: `/nodes/${i}/section`,
        message: `Unknown section "${node.section}". Add it to paper.sections or correct this reference.`,
      });
  });
  input.edges.forEach((edge, i) => {
    if (edgeIds.has(edge.id))
      issues.push({
        path: `/edges/${i}/id`,
        message: `Duplicate edge ID "${edge.id}".`,
      });
    edgeIds.add(edge.id);
    for (const endpoint of ["source", "target"] as const) {
      if (!nodeIds.has(edge[endpoint]))
        issues.push({
          path: `/edges/${i}/${endpoint}`,
          message: `Unknown node "${edge[endpoint]}". Every edge endpoint must reference an existing node ID.`,
        });
    }
  });
  return issues.length ? { ok: false, issues } : { ok: true, graph: input };
}

export function parseGraph(text: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      issues: [
        {
          path: "/",
          message: `Invalid JSON syntax: ${error instanceof Error ? error.message : "Unable to parse file."}`,
        },
      ],
    };
  }
  const objectKeys: Set<string>[] = [];
  const duplicates: ValidationIssue[] = [];
  visit(text, {
    onObjectBegin: () => {
      objectKeys.push(new Set());
    },
    onObjectProperty: (
      property,
      _offset,
      _length,
      line,
      character,
      getPath,
    ) => {
      const keys = objectKeys[objectKeys.length - 1];
      if (keys.has(property))
        duplicates.push({
          path:
            "/" +
            getPath()
              .map((part) =>
                String(part).replace(/~/g, "~0").replace(/\//g, "~1"),
              )
              .join("/"),
          message: `Duplicate JSON property "${property}" at line ${line + 1}, column ${character + 1}. Each object key must be unique.`,
        });
      keys.add(property);
    },
    onObjectEnd: () => {
      objectKeys.pop();
    },
  });
  if (duplicates.length) return { ok: false, issues: duplicates };
  return validateGraph(parsed);
}
