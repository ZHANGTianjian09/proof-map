import ELK from "elkjs/lib/elk.bundled.js";
import type { PaperGraph } from "./types";
import { fromLayoutOutput, toLayoutInput } from "./layout-model";

/** Node test entry point. Browser code uses ELK's native worker instead. */
export async function calculateLayout(graph: PaperGraph) {
  if (!graph.nodes.length) return [];
  return fromLayoutOutput(graph, await new ELK().layout(toLayoutInput(graph)));
}
