import { nodeScope, type NodeScope } from "../graph/scope";
import type { MathNode } from "../graph/types";

export function ScopeSelect({
  node,
  onChange,
}: {
  node: MathNode;
  onChange: (scope: NodeScope) => void;
}) {
  return (
    <label className="scope-select">
      <span>Map placement</span>
      <select
        aria-label={`Scope of ${node.label}`}
        value={nodeScope(node)}
        onChange={(e) => onChange(e.target.value as NodeScope)}
      >
        <option value="unclassified">Unclassified · visible</option>
        <option value="local_proof">Local proof · visible</option>
        <option value="global_context">
          Global context · hidden by default
        </option>
      </select>
    </label>
  );
}
