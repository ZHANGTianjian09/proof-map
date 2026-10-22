import { memo, type CSSProperties } from "react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { OBJECT_STYLE } from "../graph/presentation";
import type { MathNode } from "../graph/types";
import { MathText } from "./MathText";
import { isMainResult } from "../graph/navigation";
import { NODE_HEIGHT, NODE_WIDTH } from "../graph/layout-shared";

export type ObjectFlowNode = Node<
  {
    object: MathNode;
    sectionTitle: string;
    sectionLabel: string;
    sectionColor: string;
    isolated: boolean;
    neighborhood?: "predecessor" | "successor" | "both" | "endpoint";
  },
  "mathObject"
>;

export const MathObjectNode = memo(function MathObjectNode({
  data,
  selected,
}: NodeProps<ObjectFlowNode>) {
  const style = OBJECT_STYLE[data.object.type];
  return (
    <article
      className={`math-node border-${style.family} ${selected ? "is-selected" : ""} ${isMainResult(data.object) ? "main-result-node" : ""} ${data.neighborhood ? "is-neighbor" : ""}`}
      data-object-type={data.object.type}
      data-section={data.object.section}
      style={
        {
          "--section-color": data.sectionColor,
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        } as CSSProperties
      }
    >
      <Handle type="target" position={Position.Top} isConnectable={false} />
      <div className="node-eyebrow">
        <span title={data.object.label}>{data.object.label}</span>
        {isMainResult(data.object) && (
          <span className="main-badge">Main result</span>
        )}
      </div>
      <div className="node-title" title={data.object.title}>
        <MathText text={data.object.title} />
      </div>
      <div className="node-footer" title={data.sectionTitle}>
        <span>{data.sectionLabel}</span>
        {data.isolated && <span>No recorded links</span>}
      </div>
      <Handle type="source" position={Position.Bottom} isConnectable={false} />
    </article>
  );
});
