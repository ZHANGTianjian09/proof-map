# Proof Map V0 — Global Paper Map Viewer

Proof Map helps mathematical researchers inspect the overall logical architecture of papers. The initial audience is theoretical statistics researchers. It is an oversight tool, not a step-by-step tutor or a proof checker.

## Workflow

1. The researcher supplies a paper to an external analysis tool such as ChatGPT.
2. That tool produces canonical `graph.json` using a separately developed extraction prompt.
3. The researcher imports the JSON through a file picker or drag-and-drop.
4. Proof Map validates the entire document before changing the active graph.
5. The browser constructs lookup indexes, lays out the graph, and renders interactive objects and relationships.
6. Selecting an object reveals its original statement, numbering, role, source location, and incoming/outgoing relationships with provenance.

The viewer is independent of the model or extraction prompt that generated the JSON. No LLM conversion is performed.

## Required behavior

- Represent theorem, lemma, proposition, corollary, definition, assumption, example, counterexample, remark, and claim independently.
- Retain every canonical object and valid relationship, including disconnected nodes, cycles, self loops, and parallel edges.
- Keep `uses` oriented prerequisite → dependent. Give other relationship types their own semantics and styling.
- Distinguish inferred and explicit relationships and display supplied verification status and evidence.
- Provide paper outline/appendix navigation, type filters, search, zoom/pan, automatic layout and framing, selection, and a full statement inspector.
- Render inline/display TeX without executing imported HTML or trusted TeX commands.
- Start with an empty upload screen; import or drag-and-drop JSON to display its map automatically. The synthetic example remains a repository fixture.
- Offer a collapsible navigator, floating object/edge inspectors, explicit context classification, and client-side visual PDF export.
- Invalid imports leave the last accepted graph intact; the Import button offers retry with actionable locations and messages in its tooltip.
- Run wholly in the browser, with no backend, key, account, or content upload.

## Interaction decisions

Toolbar and icon-only utility controls offer concise tooltips on mouse hover or keyboard focus. Tooltips stay within the viewport and dismiss on Escape, click, scrolling, or focus leaving the control. Touch activation continues to perform the action directly. Confirmations, errors, and loading states never add notification bars or banners. Successful actions are silent; import/PDF failures and layout progress use their existing controls, tooltips, and screen-reader status descriptions.

The synthetic example opens with no selection and four explicitly classified global context objects hidden. The canvas occupies the full area beside a narrow, collapsible navigator. There is no permanent right inspector, MiniMap, or bottom status bar. Library attribution remains visible.

Clicking a card opens a 420 px nonmodal inspector anchored to the right of the canvas without moving the card, camera, or layout. On narrow canvases it occupies a bounded lower overlay. Closing it or pressing Escape retains the selected highlight; a second Escape or an empty-canvas click clears selection. Panning and zooming retain both selection and the inspector. Long content scrolls internally and wide formulas scroll horizontally. Edge clicks open their own evidence inspector. Cards use matching 340×144 CSS/ELK dimensions, 15 px labels, 24 px two-line titles, and 12 px section labels.

All ordinary UI surfaces, including hover and selected controls, are pure white with grayscale text, borders, and focus. Section membership alone determines pastel card fills; mathematical type determines the neutral border family. Theorems have double borders, propositions thick single borders, lemmas/claims a left bar, corollaries a top bar, definitions/assumptions dotted borders, and examples/remarks/counterexamples rounded dashed borders. Selection adds a separate gray outline and never changes the section fill or type border.

Two-finger scrolling pans horizontally, vertically, or diagonally. Pinch zooms; ordinary scrolling does not zoom. The canvas has no plus/minus zoom buttons. Mouse dragging on empty canvas also pans. Nodes and handles cannot be dragged or connected. Import automatically calculates placement and frames the visible subgraph. Automatic framing for more than 80 objects retains at least 60% zoom, with pinch zoom-out available for the full overview.

Top-bar search is a navigator, not a filter. It searches the full canonical paper by type (including aliases such as `thm`), numbering, original label, title, section title/ID, object ID, statement, or role. Exact labels and numbers rank first. Suggestions are shown eight at a time with Previous/Next and arrow-key navigation. Cmd/Ctrl+K focuses search; Enter selects and Escape dismisses suggestions. Typing never changes the graph. Selecting a visible result clears type/section filters and smoothly centers it in the area outside the inspector at a readable zoom. Selecting hidden global context opens its statement without revealing it; Reveal on map explicitly reveals and focuses it.

Type/section filters preserve positions. Context visibility changes and scope edits intentionally recompute layout. Inspectors always report relationships from the full canonical graph, separating recorded `uses` prerequisites/dependents from other relationship types. The narrow navigator retains collapsed theorem/main-result and reused-prerequisite shortcuts, outline navigation, type filters, and Show complete map. Reuse counts distinct outgoing `uses` targets, excluding self loops and duplicate parallel records.

ELK supplies downward hierarchical positions with 32 px sibling spacing and 64 px layer spacing. A deterministic packing pass translates whole disconnected components, preserving all internal ELK geometry and allowing for curved-edge bounds. This reduces unused space without adding relationships or treating the graph as a tree.

Global search exposes all objects, including hidden context. Only `node.metadata.scope: "global_context"` hides an object by default; `"local_proof"`, absent metadata, and unknown scope values remain eligible. No inference uses type or degree. “Show complete map” and inspector “Reveal on map” expose hidden objects. Classification edits affect only scope metadata during the current session; reloading discards them. The Context and Export JSON buttons have been removed.

Edge color/labels identify relation type; solid lines mean explicit, source-supported origin and dashed lines mean inferred origin. Verification is an independent supplied annotation, retained in inspectors and JSON but omitted from canvas relationship labels and their tooltips, including PDF exports. A solid line may be unverified or disputed. Equivalence has two arrowheads. The toolbar legend explains every color and direction. Selected objects emphasize incident relationships; all relationship labels are visible by default, and the label toggle can hide them.

Download PDF captures the full currently visible subgraph on white pages with margins, excluding all application controls, inspectors, selection outlines, neighbor highlights, and selection-only relationship labels. It preserves local fonts and KaTeX through high-resolution browser rendering. Export chooses landscape A3 or A2 when readable on one page, then overlapping A3 tiles at a fixed readable scale for larger maps. Pan and zoom do not affect exported coordinates. The internal canonical serializer continues to preserve all data; the UI no longer offers JSON download.

## Acceptance checklist

- Development and production preview start at `/proof-map/`.
- Valid JSON imports with all objects and relationships preserved.
- The example contains two main theorems, multiple lemmas, definitions, assumptions, examples, cross-links, and an isolated object.
- Formula rendering and the inspector work in a real browser.
- Malformed JSON, duplicate IDs, dangling endpoints, unsupported types, and incomplete structures are rejected.
- Unit tests, type checking, browser workflow checks, and the production build pass.
- Pages deployment is configured but is not run without approval.

## Boundaries and limitations

V0 does not establish mathematical truth, infer missing relationships, parse PDF files, edit proofs, persist sessions across reloads, or support collaborative research. Import size is capped at 10 MiB; a synthetic 300-object/240-edge case is tested, but real-paper performance and crossing density are not characterized. Complex diagrams can have crossing edges. Hidden context can leave objects visually disconnected; no synthetic transitive edges are added. Narrow screens use an overlay navigator and a bounded floating inspector. Raw TeX remains inspectable when rendering fails.

PDF pages contain high-resolution raster imagery (216–288 dpi), not selectable/vector text. Large exports can consume substantial memory and produce multiple pages. Titles are limited to two lines on cards; full titles/statements remain in inspectors and JSON. Chrome automated tests cover wheel and synthesized pinch signals; physical macOS trackpad gestures and Safari require manual validation.

Zooming out stops at the full visible map overview (with padding), recalculated for the canvas size, filters, and layout. Bounds include relationship curves as well as cards. Automatic framing uses this overview; zooming in remains available.

Examples and counterexamples share the Example display category and a single combined type filter/count. Original source labels, canonical types, and relationship meanings remain intact in inspection and export.

At the full-map zoom floor, scrolling and dragging cannot pan the canvas. Finishing a zoom-out gesture restores the centered overview. Zooming in unlocks panning again.

The header retains Import JSON and Download PDF. Load example, Export JSON, Context, Auto layout, and Fit view controls are omitted. No map appears until a valid JSON upload; invalid uploads keep the current map (or empty screen) intact.

The paper sidebar omits the “Illustrative example” badge. Synthetic metadata remains unchanged in the canonical graph.

Map framing and zoomed-in panning share a 40 px screen-space margin around the complete visible graph bounds, including relationship curves. At the end of user gestures, panning settles within those bounds; each outer edge is reachable with the same margin. Axes that fit remain centered. Inspector navigation retains its reserved reading area.
