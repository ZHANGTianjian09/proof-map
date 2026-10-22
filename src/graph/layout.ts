import ELK from "elkjs/lib/elk-api.js";
import ElkWorker from "elkjs/lib/elk-worker.min.js?worker";
import type { NodePosition } from "./layout-shared";
import { fromLayoutOutput, toLayoutInput } from "./layout-model";
import type { PaperGraph } from "./types";

/** ELK owns its worker protocol. Cancellation terminates all work for the old graph. */
export function layoutGraph(
  graph: PaperGraph,
  signal: AbortSignal,
): Promise<NodePosition[]> {
  if (signal.aborted)
    return Promise.reject(new DOMException("Layout cancelled", "AbortError"));
  if (!graph.nodes.length) return Promise.resolve([]);
  return new Promise((resolve, reject) => {
    const worker = new ElkWorker();
    const elk = new ELK({ workerFactory: () => worker });
    const cleanup = () => {
      clearTimeout(timeout);
      elk.terminateWorker();
      signal.removeEventListener("abort", abort);
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Layout cancelled", "AbortError"));
    };
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Automatic layout timed out after 20 seconds."));
    }, 20_000);
    signal.addEventListener("abort", abort, { once: true });
    worker.onerror = (event) => {
      cleanup();
      reject(
        new Error(event.message || "The layout worker could not be loaded."),
      );
    };
    elk
      .layout(toLayoutInput(graph))
      .then((result) => {
        const positions = fromLayoutOutput(graph, result);
        cleanup();
        resolve(positions);
      })
      .catch((error) => {
        cleanup();
        reject(error);
      });
  });
}
