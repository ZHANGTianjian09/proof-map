import {
  BaseEdge,
  EdgeLabelRenderer,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import { RELATION_STYLE } from "../graph/presentation";
import type { MathEdge } from "../graph/types";
import { edgeGeometry } from "../graph/edge-geometry";

export type RelationshipFlowEdge = Edge<
  {
    relationship: MathEdge;
    lane: number;
    laneCount: number;
    showLabel: boolean;
    selectionOnlyLabel?: boolean;
  },
  "relationship"
>;

export function RelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  markerStart,
  style,
  data,
}: EdgeProps<RelationshipFlowEdge>) {
  if (!data) return null;
  const { relationship, lane } = data;
  const {
    path,
    label: { x: labelX, y: labelY },
  } = edgeGeometry(
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
    lane,
    data.laneCount,
  );
  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={style}
      />
      {data.showLabel && (
        <EdgeLabelRenderer>
          <span
            data-selection-label={data.selectionOnlyLabel ? "true" : undefined}
            className={`edge-label nodrag nopan ${relationship.origin === "inferred" ? "inferred" : ""}`}
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              color: RELATION_STYLE[relationship.relation].color,
            }}
            title={relationship.origin}
          >
            {RELATION_STYLE[relationship.relation].label}
            {relationship.origin === "inferred" && <small>inferred</small>}
          </span>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
