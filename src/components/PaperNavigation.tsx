import { BookOpen, ChevronRight, FileText, X } from "lucide-react";
import { useMemo } from "react";
import { NODE_TYPES, type PaperGraph } from "../graph/types";
import { OBJECT_STYLE } from "../graph/presentation";
import { type GraphFilters } from "../graph/filters";
import { isMainResult, reusedPrerequisites } from "../graph/navigation";
import { MathText } from "./MathText";

interface Props {
  graph: PaperGraph;
  filters: GraphFilters;
  onChange: (filters: GraphFilters) => void;
  onSelect: (id: string) => void;
  visibleCount: number;
  selectedId: string | null;
  onShowComplete: () => void;
}
export function PaperNavigation({
  graph,
  filters,
  onChange,
  onSelect,
  visibleCount,
  selectedId,
  onShowComplete,
}: Props) {
  const results = useMemo(
    () =>
      graph.nodes.filter(
        (node) => node.type === "theorem" || isMainResult(node),
      ),
    [graph],
  );
  const reused = useMemo(() => reusedPrerequisites(graph), [graph]);
  const sections =
    graph.paper.sections ??
    [...new Set(graph.nodes.map((n) => n.section))].map((id) => ({
      id,
      title: id,
      kind: "section" as const,
    }));
  const active =
    filters.query !== "" ||
    filters.section !== null ||
    filters.types.length !== NODE_TYPES.length;
  return (
    <aside className="paper-nav" aria-label="Paper navigation">
      <div className="paper-heading">
        <div className="eyebrow">
          <BookOpen size={13} /> CURRENT PAPER
        </div>
        <h1>{graph.paper.title}</h1>
        <div className="paper-meta">
          {graph.paper.metadata?.synthetic !== true && (
            <span className="tag">Imported paper</span>
          )}
          <span>{graph.nodes.length} objects</span>
        </div>
        {graph.paper.authors?.length ? (
          <p className="author-line">
            {graph.paper.authors.join(", ")}
            {graph.paper.year ? ` · ${graph.paper.year}` : ""}
          </p>
        ) : null}
      </div>
      <div className="nav-content">
        <div className="map-coverage">
          <span>
            {visibleCount} of {graph.nodes.length} objects on map
          </span>
          <button className="text-button" onClick={onShowComplete}>
            Show complete map
          </button>
        </div>
        <div className="object-finders">
          <details className="object-finder">
            <summary>
              Theorems & main results <span>{results.length}</span>
            </summary>
            <p>Main-result labels come from the imported paper data.</p>
            {results.length ? (
              results.map((node) => (
                <button
                  key={node.id}
                  aria-current={selectedId === node.id ? "true" : undefined}
                  onClick={() => onSelect(node.id)}
                >
                  <span>
                    {node.label}
                    {isMainResult(node) && <small>Main result</small>}
                  </span>
                  <MathText text={node.title} />
                </button>
              ))
            ) : (
              <p>No theorems or main-result roles supplied.</p>
            )}
          </details>
          <details className="object-finder">
            <summary>
              Reused prerequisites <span>{reused.length}</span>
            </summary>
            <p>
              Distinct objects connected by outgoing uses records. Supplied
              links may be unverified.
            </p>
            {reused.length ? (
              reused.map(({ node, count }) => (
                <button
                  key={node.id}
                  aria-current={selectedId === node.id ? "true" : undefined}
                  onClick={() => onSelect(node.id)}
                >
                  <span>
                    {node.label}
                    <small>Used by {count} objects</small>
                  </span>
                  <MathText text={node.title} />
                </button>
              ))
            ) : (
              <p>No prerequisites with multiple recorded dependents.</p>
            )}
          </details>
        </div>
        <div className="section-heading">
          <h2>Paper outline</h2>
          <FileText size={14} />
        </div>
        <button
          className={`outline-item all-paper ${filters.section === null ? "active" : ""}`}
          onClick={() => onChange({ ...filters, section: null })}
        >
          <BookOpen size={15} />
          <span>Entire paper</span>
          <span className="count">{graph.nodes.length}</span>
        </button>
        <nav aria-label="Sections and appendices">
          {sections.map((section) => (
            <button
              key={section.id}
              className={`outline-item ${filters.section === section.id ? "active" : ""}`}
              onClick={() => onChange({ ...filters, section: section.id })}
            >
              <ChevronRight size={13} />
              <span>{section.title}</span>
              <span className="count">
                {graph.nodes.filter((n) => n.section === section.id).length}
              </span>
            </button>
          ))}
        </nav>
        <div className="section-heading type-heading">
          <h2>Mathematical objects</h2>
          <button
            className="text-button"
            onClick={() =>
              onChange({
                ...filters,
                types:
                  filters.types.length === NODE_TYPES.length
                    ? []
                    : [...NODE_TYPES],
              })
            }
          >
            {filters.types.length === NODE_TYPES.length
              ? "Hide all"
              : "Show all"}
          </button>
        </div>
        <div className="type-filters">
          {NODE_TYPES.filter((type) => type !== "counterexample").map((type) => {
            const group = type === "example" ? ["example", "counterexample"] as const : [type];
            const includes = (value: (typeof NODE_TYPES)[number]) => group.some((member) => member === value);
            const count = graph.nodes.filter((n) => includes(n.type)).length;
            return (
              <label key={type} className={count === 0 ? "zero-count" : ""}>
                <input
                  type="checkbox"
                  checked={group.every((member) => filters.types.includes(member))}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      types: e.target.checked
                        ? [...filters.types.filter((t) => !includes(t)), ...group]
                        : filters.types.filter((t) => !includes(t)),
                    })
                  }
                />
                <span
                  className={`type-sample border-${OBJECT_STYLE[type].family}`}
                  aria-hidden="true"
                />
                <span>{OBJECT_STYLE[type].label}</span>
                <span className="count">{count}</span>
              </label>
            );
          })}
        </div>
        {active && (
          <button
            className="reset-button"
            onClick={() =>
              onChange({ query: "", section: null, types: [...NODE_TYPES] })
            }
          >
            <X size={13} /> Reset filters <span>{visibleCount} visible</span>
          </button>
        )}
      </div>
    </aside>
  );
}
