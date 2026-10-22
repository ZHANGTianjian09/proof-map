import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { PaperGraph } from "../graph/types";
import { buildSearchIndex, searchObjects } from "../graph/search";
import { OBJECT_STYLE } from "../graph/presentation";
import { nodeScope } from "../graph/scope";
import { MathText } from "./MathText";

export function GlobalSearch({
  graph,
  onSelect,
}: {
  graph: PaperGraph;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const listId = useId();
  const index = useMemo(() => buildSearchIndex(graph), [graph]);
  const results = useMemo(() => searchObjects(index, query), [index, query]);
  const start = Math.floor(active / 8) * 8;
  useEffect(() => {
    setQuery("");
    setActive(0);
    setOpen(false);
  }, [graph]);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        input.current?.focus();
        input.current?.select();
        setOpen(true);
      }
    };
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener("keydown", shortcut);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", shortcut);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  function select(id: string) {
    setOpen(false);
    onSelect(id);
  }
  return (
    <div
      className="global-search"
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <div className="search-box">
        <Search size={16} aria-hidden="true" />
        <input
          ref={input}
          role="combobox"
          aria-label="Search mathematical objects"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            open && results[active] ? `${listId}-${active}` : undefined
          }
          placeholder="Find a result, definition, or section…"
          autoComplete="off"
          value={query}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
              input.current?.blur();
            } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              if (!open) {
                setOpen(true);
                return;
              }
              if (results.length)
                setActive(
                  (value) =>
                    (value +
                      (event.key === "ArrowDown" ? 1 : -1) +
                      results.length) %
                    results.length,
                );
            } else if (event.key === "Enter" && open && results[active]) {
              event.preventDefault();
              select(results[active].node.id);
            }
          }}
        />
        {query ? (
          <button
            className="icon-button"
            aria-label="Clear search"
            data-tooltip="Clear search"
            onClick={() => {
              setQuery("");
              setActive(0);
              setOpen(true);
              input.current?.focus();
            }}
          >
            <X size={14} />
          </button>
        ) : (
          <kbd>⌘ / Ctrl K</kbd>
        )}
      </div>
      {open && (
        <div className="search-popover">
          <div className="search-caption" role="status">
            {query.trim()
              ? `${results.length} matches across the entire paper`
              : "Search by type, number, title, section, or ID"}
          </div>
          <div
            className="search-results"
            id={listId}
            role="listbox"
            aria-label="Mathematical objects"
          >
            {results
              .slice(start, start + 8)
              .map(({ node, section }, offset) => (
                <button
                  type="button"
                  role="option"
                  key={node.id}
                  id={`${listId}-${start + offset}`}
                  aria-selected={active === start + offset}
                  aria-posinset={start + offset + 1}
                  aria-setsize={results.length}
                  tabIndex={-1}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => select(node.id)}
                >
                  <span className="search-result-label">
                    {OBJECT_STYLE[node.type].label}
                    {node.number ? ` ${node.number}` : ""}
                    <small>{node.label}</small>
                  </span>
                  <MathText text={node.title} />
                  <span className="search-result-section">
                    {section}
                    {nodeScope(node) === "global_context"
                      ? " · Global context"
                      : ""}
                  </span>
                </button>
              ))}
          </div>
          {query.trim() && !results.length && (
            <p className="search-caption">No matching objects.</p>
          )}
          {results.length > 8 && (
            <div className="search-pagination">
              <button
                disabled={start === 0}
                onClick={() => {
                  setActive(Math.max(0, start - 8));
                  input.current?.focus();
                }}
              >
                Previous
              </button>
              <span>
                {start + 1}–{Math.min(start + 8, results.length)} of{" "}
                {results.length}
              </span>
              <button
                disabled={start + 8 >= results.length}
                onClick={() => {
                  setActive(start + 8);
                  input.current?.focus();
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
