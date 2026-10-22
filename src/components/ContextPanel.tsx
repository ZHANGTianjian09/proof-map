import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { PaperGraph } from "../graph/types";
import { nodeScope, type NodeScope } from "../graph/scope";
import { ScopeSelect } from "./ScopeSelect";

export function ContextPanel({
  graph,
  showContext,
  onShowContext,
  onSelect,
  onScopeChange,
  onClose,
}: {
  graph: PaperGraph;
  showContext: boolean;
  onShowContext: (value: boolean) => void;
  onSelect: (id: string) => void;
  onScopeChange: (id: string, scope: NodeScope) => void;
  onClose: () => void;
}) {
  const [all, setAll] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLElement>(null);
  const count = graph.nodes.filter(
    (n) => nodeScope(n) === "global_context",
  ).length;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const pointer = (e: PointerEvent) => {
      if (
        e.target instanceof Element &&
        !e.target.closest(".context-drawer, [data-context-toggle]")
      )
        onClose();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", pointer);
    ref.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", pointer);
    };
  }, [onClose]);
  const nodes = graph.nodes.filter(
    (n) =>
      (all || nodeScope(n) === "global_context") &&
      [n.label, n.title, n.statement].some((s) =>
        s.toLowerCase().includes(query.toLowerCase()),
      ),
  );
  return (
    <section
      ref={ref}
      tabIndex={-1}
      className="context-drawer nodrag nopan nowheel"
      role="dialog"
      aria-modal="false"
      aria-label="Mathematical context"
    >
      <div className="inspector-header">
        <span>MATHEMATICAL CONTEXT</span>
        <button
          className="icon-button"
          aria-label="Close context"
          data-tooltip="Close context · Esc"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
      <div className="context-scroll">
        <h2>The foundations of this paper</h2>
        <p>
          Standing assumptions, notation, and definitions can live here, while
          the map focuses on the proof.
        </p>
        <label className="context-visibility">
          <input
            type="checkbox"
            checked={showContext}
            onChange={(e) => onShowContext(e.target.checked)}
          />{" "}
          Show global context on the map <span>{count}</span>
        </label>
        <div className="context-tabs">
          <button aria-pressed={!all} onClick={() => setAll(false)}>
            Global context ({count})
          </button>
          <button aria-pressed={all} onClick={() => setAll(true)}>
            Classify all objects
          </button>
        </div>
        <label className="search-box">
          <Search size={14} />
          <input
            aria-label="Search context objects"
            placeholder="Find an object…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <p className="context-fallback">
          Unclassified objects stay on the map. Nothing is classified by type or
          number of connections.
        </p>
        <div className="context-objects">
          {nodes.map((node) => (
            <article key={node.id}>
              <button
                className="context-object-link"
                onClick={() => {
                  onSelect(node.id);
                  onClose();
                }}
              >
                <span>{node.label}</span>
                <strong>{node.title}</strong>
              </button>
              <ScopeSelect
                node={node}
                onChange={(scope) => onScopeChange(node.id, scope)}
              />
            </article>
          ))}
        </div>
        {!nodes.length && (
          <p className="muted">
            {count
              ? "No matching objects."
              : "No global context has been marked. Use “Classify all objects” to choose it explicitly."}
          </p>
        )}
        <p className="context-save-note">
          Classification is saved with Export JSON. Statements and relationships
          remain unchanged.
        </p>
      </div>
    </section>
  );
}
