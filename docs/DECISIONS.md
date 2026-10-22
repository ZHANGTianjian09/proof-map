# Architectural decisions

## 001 — Static browser application

Use React, TypeScript, and Vite. All mathematical processing happens locally. No server, login, database, API key, telemetry, CDN fonts, or remote rendering is required. The deployment target is a GitHub Pages project at `/proof-map/`.

## 002 — Canonical schema is the import boundary

Use JSON Schema draft-07 and Ajv with strict mode and all errors. Additional semantic checks cover unique IDs and endpoint/section references. Parse JSON strictly and reject duplicate object properties. Preserve all mathematical values and arbitrary JSON metadata. No automatic LLM conversion or silent correction. Runtime validation and type checking serve different purposes and both are required.

## 003 — A knowledge graph, not necessarily a DAG

The graph includes all formally stated objects and all supported relationships, including cycles and isolated objects. `uses` always means prerequisite → dependent. Logical implication, equivalence, generalization, illustration, and counterexamples retain their own semantics. Incoming/outgoing indexes reflect stored direction; an equivalence is rendered bidirectionally without changing its canonical record.

## 004 — Provenance and verification remain separate

An explicit relationship requires source evidence. Inferred relationships are dashed and labeled as inferred in the inspector. Verification labels are imported annotations, not a result of this viewer. No automatic promotion from explicit to verified. Metadata can carry future reviewer identities or richer audit information.

## 005 — Independent graph services and presentation state

`src/graph/validation.ts` owns acceptance. `normalize.ts` builds indexes without rewriting values. `filters.ts` produces visible subgraphs. `layout-model.ts` maps opaque IDs to ELK internals and extracts positions only. `layout.ts` runs ELK's native worker with cancellation, failure handling, and a 20-second timeout. `layout-core.ts` supplies the Node test entry point for the same layout model. React Flow receives separate presentation objects.

The canonical graph never contains UI positions or hidden/selected flags. Layout uses all relationship types; its placement is not a proof order or mathematical hierarchy. ELK may internally reverse edges to place cycles, but only positions return to the viewer. If layout fails, the complete graph remains available in a grid; the layout button provides retry and explains the fallback in its tooltip. Status and confirmation messages never create notification bars. Filters preserve positions to maintain spatial context.

## 006 — Simple readable rendering

React Flow provides pan, zoom, fit view, and keyboard focus. Custom 340×176 object cards show original labels, multiline titles, and section labels; ELK uses matching dimensions, 32 px sibling spacing, and 64 px layer spacing. A deterministic component packing pass translates whole components, including curved-edge clearance, without altering internal ELK geometry or canonical relations. Node dragging/connecting, MiniMap, and the permanent inspector are removed. Directed curves distinguish parallel edges and self loops. Relation color/labels and origin dashes encode separate concepts. Floating inspectors display complete content. Dense crossing reduction is deferred until real-paper benchmarks exist.

KaTeX renders only delimited TeX, with `trust: false`, bounded expansion, and no user HTML interpretation. Unsupported math shows original TeX and a notice. Fonts are bundled locally. Source strings remain unchanged on export.

## 007 — Replace only after successful validation

Imports are atomic at the document level; invalid input leaves the accepted graph untouched. Stale file reads and stale layouts cannot replace a newer import. A 10 MiB file limit is a practical V0 boundary, not a claim about supported graph size. The example can be reloaded at any time. Sessions are in memory; exports are the persistence mechanism.

## 008 — Manual deployment

The repository is intended for `ZHANGTianjian09/proof-map`. Prepare CI and GitHub Pages workflows, but deployment uses `workflow_dispatch` only. No code is pushed and no website is published during the kickoff. A separate CI workflow checks pull requests/pushes; it cannot deploy.

## 009 — Explicit global context within existing metadata

`scope.ts` recognizes optional `node.metadata.scope` values `global_context` and `local_proof`; unrecognized/absent values remain visible. This preserves schema version 1.0.0 and legacy imports. No inference by type or degree. Scope edits preserve every other field. The complete canonical graph supplies inspection and JSON export; context/type/section visibility supplies rendering and PDF export. Hidden endpoints suppress displayed edges. Changing context visibility recomputes layout, whereas ordinary selection and type/section filtering preserve node positions.

## 010 — Reading navigation and contextual inspection

Use React Flow 12 `panOnScroll` with `PanOnScrollMode.Free`, `zoomOnScroll=false`, and `zoomOnPinch=true`. Disable dragging, connecting, reconnecting, automatic focus pan, double-click zoom, and keyboard deletion. The Mac trackpad wheel/pinch contract is exercised with browser event synthesis; physical gestures remain a manual check. Floating panels use measured canvas bounds and anchor to the right at 420 px on desktop, or the lower area on narrow canvases. Explicit search focus reserves their screen space; direct clicks never move the camera. Closing the inspector keeps selection; a second Escape or empty-canvas click clears it. Internal scrolling contains overscroll; formula horizontal scrolling still allows vertical scroll to reach the inspector.

## 011 — Client-side PDF with readable tiles

`pdf-plan.ts` calculates full graph bounds using nodes and the same cubic edge geometry used for rendering, including parallel/backward/self-loop excursions. `map-pdf.ts` snapshots the visible diagram before asynchronous work, resets viewport transforms/selection emphasis, and renders only diagram elements plus a paper caption. An offscreen ancestor positions the export stage, avoiding computed CSS inset leakage into captured content.

html-to-image embeds locally served fonts and rasterizes at 3 pixels per graph pixel; jsPDF assembles PNGs into landscape A3/A2 with 36 pt margins. Prefer one page at a minimum 0.75 pt per graph pixel; otherwise use overlapping A3 tiles with enough overlap to contain every card whole on at least one page. At the chosen scales imagery is 216–288 dpi. This keeps browser-rendered KaTeX and Unicode styling consistent, at the cost of selectable/vector text and memory for large exports. No application chrome, inspector, controls, remote export service, or backend is captured. PDF download validity alone is insufficient: visual rendering is checked, along with nonblank image data and viewport-independent imagery.

PDF dependencies load eagerly with the application so an already-open page does not need to fetch JavaScript on its first export. The local preview server must remain available for local assets such as fonts. Export failures stay out of page-wide banners: the button offers a retry label/tooltip, an accessible status announces the failure, and technical details stay in the developer console.

## Implementation references

- [React Flow custom nodes](https://reactflow.dev/learn/customization/custom-nodes) and [handles](https://reactflow.dev/learn/customization/handles).
- [ELK layered layout](https://eclipse.dev/elk/reference/algorithms/org-eclipse-elk-layered.html) and [ELK.js worker usage](https://github.com/kieler/elkjs).
- [Vite static deployment](https://vite.dev/guide/static-deploy.html).
- [React Flow viewport controls](https://reactflow.dev/learn/concepts/the-viewport) and [React Flow interaction options](https://reactflow.dev/api-reference/react-flow).
- [jsPDF image embedding](https://parallax.github.io/jsPDF/docs/module-addImage.html).

These describe library APIs; Proof Map's mathematical semantics are defined by its own schema.

## 012 — Mathematical visual grammar

The V0.2 interface uses pure white surfaces and neutral text, borders, and controls, including hover and selected states. The logo is charcoal. Section fills are assigned from a six-color pastel palette using the complete canonical section catalog order, or sorted literal section IDs when no catalog exists. Filters never drive the mapping. Palette reuse is cyclic and section text always remains visible. Neutral border geometry encodes object type in six families; a separate external gray outline encodes selection. No fill or border implies mathematical verification. See [VIEWER_DESIGN.md](VIEWER_DESIGN.md) for tokens and conventions.

## 013 — Search is canonical navigation

`search.ts` indexes all canonical objects, including hidden context, and ranks exact original labels/type-number pairs and numbers before partial matches. Search state is local to `GlobalSearch`; it never changes view filters while typing. Search, sidebar shortcuts, related-object navigation, and canvas clicks share selected node state. Inspector visibility is separate from selection. The inspector can render hidden context independently of the canvas, and reveal is explicit. `inspector-layout.ts` calculates both responsive panel bounds and a camera transform that leaves the selected object unobscured. Canonical JSON and schema 1.0.0 remain unchanged.


## 014 — Relationship labels enabled initially

The relationship-label toolbar toggle starts selected, so every visible relationship shows its label without an extra action. Users can turn it off for a quieter view; selected and incident relationships still show their labels. This is presentation state only and does not modify canonical data.

## 015 — Compact cards with larger text

Cards use a shared 340×144 layout footprint with reduced padding, 15 px original labels, 24 px titles, and 12 px section labels. Titles occupy up to two lines; full content remains available in the inspector and canonical export. This reduces unused card space while keeping geometry consistent across layout, canvas, and PDF.

## 016 — Omit canvas zoom buttons

Remove the floating plus/minus zoom control to simplify the canvas. Pinch zoom, scroll and drag panning, and the toolbar Fit View action remain available.

## 017 — Full-map zoom floor

The minimum zoom follows the full visible graph bounds and canvas size, rather than a fixed small scale. Fit View and the zoom floor share padded bounds including relationship curves. Resizing and filtering recompute the floor; ordinary selection does not change it.

## 018 — Shared Example display category

Examples and counterexamples use one Example category in presentation, search badges, and type filtering. The combined checkbox toggles both canonical types together. Original labels and counterexample-to relationships remain faithful to the source; no canonical objects or types are merged or rewritten.

## 019 — Lock panning at the overview

Disable scroll and drag panning at the full-map minimum zoom and recenter when a zoom-out gesture ends at that limit. Zooming in restores panning. This keeps the complete overview fixed without changing canonical data or node positions.

## 020 — Upload-first map with fewer controls

Start empty and display a map automatically after a valid JSON upload or drop. Remove Load example, Export JSON, Context, Auto layout, and Fit view buttons. Keep PDF download and import. Search and the complete-map navigation action retain access to hidden context; canonical validation, data, and serializer remain unchanged. Failed layout retains a grid and an accessible status; importing again retries.

## 021 — Shared margin across zoom levels

Use a single 40 px screen-space margin for full-map framing and zoomed-in pan limits, derived from the same visible card and relationship bounds. Keep fitting axes centered and clamp user gesture endpoints so all outer edges remain reachable. Programmatic inspector navigation still reserves its panel space.
