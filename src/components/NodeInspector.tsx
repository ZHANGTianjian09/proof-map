import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  FileText,
  Focus,
  X,
} from "lucide-react";
import type { Evidence, MathEdge, MathNode, PaperGraph } from "../graph/types";
import type { GraphIndex } from "../graph/normalize";
import { OBJECT_STYLE, RELATION_STYLE } from "../graph/presentation";
import { MathText } from "./MathText";
import { ScopeSelect } from "./ScopeSelect";
import type { NodeScope } from "../graph/scope";

export function EvidenceList({ evidence }: { evidence: Evidence[] }) {
  return (
    <div className="evidence-list">
      {evidence.map((item, i) => (
        <div className="evidence-item" key={i}>
          {item.excerpt && (
            <blockquote>
              <MathText text={item.excerpt} />
            </blockquote>
          )}
          {item.note && <MathText text={item.note} />}
          <small>
            <FileText size={11} /> {item.source.location}
            {item.source.page ? ` · p. ${item.source.page}` : ""}
          </small>
          {item.metadata && (
            <details className="metadata">
              <summary>Evidence metadata</summary>
              <pre>{JSON.stringify(item.metadata, null, 2)}</pre>
            </details>
          )}
        </div>
      ))}
    </div>
  );
}

function RelationshipList({
  edges,
  direction,
  index,
  onSelect,
}: {
  edges: MathEdge[];
  direction: "incoming" | "outgoing";
  index: GraphIndex;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relationship-list">
      {edges.map((edge) => {
        const counterpart = index.nodesById.get(
          direction === "incoming" ? edge.source : edge.target,
        )!;
        return (
          <details className="relationship-item" key={edge.id}>
            <summary>
              <span
                className="relationship-line"
                style={{ background: RELATION_STYLE[edge.relation].color }}
              />
              <span className="relationship-main">
                <span>
                  {counterpart.label}
                  <span className="relationship-verb">
                    {edge.relation === "uses"
                      ? direction === "incoming"
                        ? "prerequisite"
                        : "dependent"
                      : RELATION_STYLE[edge.relation].label}
                  </span>
                </span>
                <small>{counterpart.title}</small>
                <small className="relationship-annotation">
                  {edge.origin === "inferred" ? "Inferred" : "Source-supported"}{" "}
                  · Supplied: {edge.verification}
                </small>
              </span>
              <ChevronRight className="detail-chevron" size={13} />
            </summary>
            <div className="relationship-detail">
              <div className="relationship-direction">
                {index.nodesById.get(edge.source)?.label}{" "}
                {edge.relation === "equivalent_to" ? "↔" : "→"}{" "}
                {index.nodesById.get(edge.target)?.label}
              </div>
              <p className="relation-meaning">
                {RELATION_STYLE[edge.relation].description}
              </p>
              <div className="evidence-badges">
                <span className={`provenance ${edge.origin}`}>
                  {edge.origin === "explicit" ? "Source-supported" : "Inferred"}
                </span>
                <span className={`verification ${edge.verification}`}>
                  Supplied: {edge.verification}
                </span>
              </div>
              {edge.note && <MathText text={edge.note} />}
              {edge.evidence?.length ? (
                <EvidenceList evidence={edge.evidence} />
              ) : (
                <p className="muted">No source evidence supplied.</p>
              )}
              {edge.metadata && (
                <details className="metadata">
                  <summary>Relationship metadata</summary>
                  <pre>{JSON.stringify(edge.metadata, null, 2)}</pre>
                </details>
              )}
              <button
                className="text-button inspect-related"
                onClick={() => onSelect(counterpart.id)}
              >
                Inspect {counterpart.label} <ArrowUpRight size={12} />
              </button>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function NodeInspector({
  node,
  graph,
  index,
  onSelect,
  onClose,
  onScopeChange,
  hiddenContext,
  onReveal,
  onFocus,
  onFocusNeighbors,
}: {
  node: MathNode | null;
  graph: PaperGraph;
  index: GraphIndex;
  onSelect: (id: string) => void;
  onClose: () => void;
  onScopeChange: (id: string, scope: NodeScope) => void;
  hiddenContext: boolean;
  onReveal: () => void;
  onFocus: () => void;
  onFocusNeighbors: () => void;
}) {
  if (!node) return null;
  const style = OBJECT_STYLE[node.type];
  const incoming = index.incoming.get(node.id) ?? [];
  const outgoing = index.outgoing.get(node.id) ?? [];
  const prerequisites = incoming.filter((edge) => edge.relation === "uses");
  const dependents = outgoing.filter((edge) => edge.relation === "uses");
  const otherIncoming = incoming.filter((edge) => edge.relation !== "uses");
  const otherOutgoing = outgoing.filter((edge) => edge.relation !== "uses");
  const section = graph.paper.sections?.find((s) => s.id === node.section);
  return (
    <section
      className="inspector"
      role="dialog"
      aria-modal="false"
      aria-label="Node inspector"
    >
      <div className="inspector-header">
        <span>OBJECT INSPECTOR</span>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close inspector"
          data-tooltip="Close inspector · Esc"
        >
          <X size={15} />
        </button>
      </div>
      <div className="inspector-scroll" key={node.id}>
        <div className="object-heading">
          <span
            className="object-type"
            style={{ color: style.color, background: style.tint }}
          >
            {style.label}
          </span>
          <span className="object-number">{node.number ?? "Unnumbered"}</span>
          <h2>
            <MathText text={node.title} />
          </h2>
          <p>{node.label}</p>
          {node.role && <span className="role-tag">{node.role}</span>}
          <div className="inspector-navigation">
            <button className="button" onClick={onFocus}>
              <Focus size={14} /> Focus on map
            </button>
            {!hiddenContext && (
              <button className="button subtle" onClick={onFocusNeighbors}>
                Fit direct neighbors
              </button>
            )}
          </div>
        </div>
        {hiddenContext && (
          <div className="context-hidden-note">
            Global context · hidden from the map
            <button className="text-button" onClick={onReveal}>
              Reveal on map
            </button>
          </div>
        )}
        <section className="inspector-section statement-section">
          <h3>Mathematical statement</h3>
          <MathText text={node.statement} />
        </section>
        <section className="inspector-section">
          <h3>Source location</h3>
          <div className="source-card">
            <FileText size={16} />
            <div>
              <strong>{section?.title ?? node.section}</strong>
              <p>{node.source.location}</p>
              {node.source.page && <small>Page {node.source.page}</small>}
            </div>
          </div>
          {graph.paper.metadata?.synthetic === true && (
            <p className="source-note">
              Locations refer to the synthetic example.
            </p>
          )}
          {node.source.metadata && (
            <details className="metadata">
              <summary>Source metadata</summary>
              <pre>{JSON.stringify(node.source.metadata, null, 2)}</pre>
            </details>
          )}
        </section>
        <section className="inspector-section">
          <h3>
            <ArrowDownLeft size={14} /> Prerequisites · uses{" "}
            <span>{prerequisites.length}</span>
          </h3>
          <p className="relationship-explanation">
            Prerequisite → this object. These are recorded uses links; Proof Map
            does not verify them.
          </p>
          {prerequisites.length ? (
            <RelationshipList
              edges={prerequisites}
              direction="incoming"
              index={index}
              onSelect={onSelect}
            />
          ) : (
            <p className="muted">No prerequisites recorded.</p>
          )}
        </section>
        <section className="inspector-section">
          <h3>
            <ArrowUpRight size={14} /> Used by · uses{" "}
            <span>{dependents.length}</span>
          </h3>
          <p className="relationship-explanation">
            This object → dependent object.
          </p>
          {dependents.length ? (
            <RelationshipList
              edges={dependents}
              direction="outgoing"
              index={index}
              onSelect={onSelect}
            />
          ) : (
            <p className="muted">No dependent objects recorded.</p>
          )}
        </section>
        {!!(otherIncoming.length || otherOutgoing.length) && (
          <section className="inspector-section">
            <h3>Other mathematical relationships</h3>
            <p className="relationship-explanation">
              These relations are not automatically proof dependencies.
              Equivalence is symmetric; incidence below follows the supplied
              endpoints.
            </p>
            {!!otherIncoming.length && (
              <>
                <h4>Incoming relationships · {otherIncoming.length}</h4>
                <RelationshipList
                  edges={otherIncoming}
                  direction="incoming"
                  index={index}
                  onSelect={onSelect}
                />
              </>
            )}
            {!!otherOutgoing.length && (
              <>
                <h4>Outgoing relationships · {otherOutgoing.length}</h4>
                <RelationshipList
                  edges={otherOutgoing}
                  direction="outgoing"
                  index={index}
                  onSelect={onSelect}
                />
              </>
            )}
          </section>
        )}
        {!!node.evidence?.length && (
          <section className="inspector-section">
            <h3>Statement evidence</h3>
            <EvidenceList evidence={node.evidence} />
          </section>
        )}
        <section className="inspector-section">
          <p className="source-note">
            Verification labels belong to relationships and are supplied
            annotations. No independent proof verification is performed.
          </p>
          <details className="metadata">
            <summary>Original LaTeX & object data</summary>
            <pre>{JSON.stringify(node, null, 2)}</pre>
          </details>
          <ScopeSelect
            node={node}
            onChange={(scope) => onScopeChange(node.id, scope)}
          />
          <p className="object-id">Object ID · {node.id}</p>
        </section>
      </div>
    </section>
  );
}
