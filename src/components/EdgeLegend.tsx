import { RELATION_STYLE } from "../graph/presentation";

export function EdgeLegend() {
  return (
    <div className="legend-body" role="region" aria-label="Edge legend">
      <h3>Read the relationships</h3>
      <div>
        <span className="legend-line" />
        <span>
          <strong>Solid · source-supported</strong>
          <small>Explicit in the source; evidence is recorded.</small>
        </span>
      </div>
      <div>
        <span className="legend-line dashed" />
        <span>
          <strong>Dashed · inferred</strong>
          <small>A proposed connection, not an explicit source link.</small>
        </span>
      </div>
      <p>
        A solid edge can still be unverified or disputed. Line style does not
        indicate mathematical correctness.
      </p>
      <hr />
      {Object.entries(RELATION_STYLE).map(([key, style]) => (
        <div key={key}>
          <span className="legend-arrow" style={{ color: style.color }}>
            {key === "equivalent_to" ? "↔" : "→"}
          </span>
          <span>
            <strong>{style.label}</strong>
            <small>{style.description}</small>
          </span>
        </div>
      ))}
      <p>
        Colors identify relation types. Two arrowheads indicate equivalence.
        Click an edge to inspect its evidence and supplied verification status.
      </p>
    </div>
  );
}
