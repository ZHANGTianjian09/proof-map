import { ArrowUpRight, X } from "lucide-react";
import type { MathEdge } from "../graph/types";
import type { GraphIndex } from "../graph/normalize";
import { RELATION_STYLE } from "../graph/presentation";
import { EvidenceList } from "./NodeInspector";
import { MathText } from "./MathText";

export function EdgeInspector({
  edge,
  index,
  onSelect,
  onClose,
}: {
  edge: MathEdge;
  index: GraphIndex;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const style = RELATION_STYLE[edge.relation];
  return (
    <section
      className="inspector"
      role="dialog"
      aria-modal="false"
      aria-label="Relationship inspector"
    >
      <div className="inspector-header">
        <span>RELATIONSHIP</span>
        <button
          className="icon-button"
          aria-label="Close inspector"
          data-tooltip="Close inspector · Esc"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
      <div className="inspector-scroll">
        <div className="object-heading">
          <span className="object-type" style={{ color: style.color }}>
            {style.label}
          </span>
          <h2>
            {index.nodesById.get(edge.source)?.label}{" "}
            {edge.relation === "equivalent_to" ? "↔" : "→"}{" "}
            {index.nodesById.get(edge.target)?.label}
          </h2>
          <p>{style.description}</p>
        </div>
        <section className="inspector-section">
          <h3>Source support & verification</h3>
          <div className="evidence-badges">
            <span className={`provenance ${edge.origin}`}>
              {edge.origin === "explicit"
                ? "Solid · source-supported"
                : "Dashed · inferred"}
            </span>
            <span className={`verification ${edge.verification}`}>
              {edge.verification}
            </span>
          </div>
          <p className="source-note">
            Line style records origin. Verification is a separate supplied
            annotation; Proof Map does not check correctness.
          </p>
        </section>
        <section className="inspector-section">
          <h3>Evidence</h3>
          {edge.note && <MathText text={edge.note} />}{" "}
          {edge.evidence?.length ? (
            <EvidenceList evidence={edge.evidence} />
          ) : (
            <p className="muted">No source evidence supplied.</p>
          )}
        </section>
        <section className="inspector-section">
          <h3>Related objects</h3>
          {[edge.source, edge.target]
            .filter((id, i, ids) => ids.indexOf(id) === i)
            .map((id) => (
              <button
                key={id}
                className="related-object-button"
                onClick={() => onSelect(id)}
              >
                <span>
                  {index.nodesById.get(id)?.label}
                  <small>{index.nodesById.get(id)?.title}</small>
                </span>
                <ArrowUpRight size={15} />
              </button>
            ))}
          <details className="metadata">
            <summary>Original relationship data</summary>
            <pre>{JSON.stringify(edge, null, 2)}</pre>
          </details>
        </section>
      </div>
    </section>
  );
}
