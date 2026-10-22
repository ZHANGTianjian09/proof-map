# Proof Map V0.2 — Viewer design

The map is the primary research surface. All mathematical content and relationships come from the canonical graph. This viewer does not extract, invent, or independently verify mathematics.

## Visual system

Ordinary application surfaces are pure white, including search suggestions, hovered controls, selected navigation, inspectors, menus, and context panels. Typography, controls, borders, and focus use grayscale. The branding mark is charcoal. Section fills and relation colors are the only color encodings.

| Token           | Value                                                            | Purpose                                              |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------- |
| Surface         | `#FFFFFF`                                                        | All interface surfaces and exported page backgrounds |
| Ink             | `#171717`                                                        | Primary text and icons                               |
| Secondary       | `#666666`                                                        | Supporting readable text                             |
| Muted           | `#999999`                                                        | Restrained secondary decoration                      |
| Border          | `#E5E5E5`                                                        | Interface separators and control borders             |
| Strong border   | `#999999`                                                        | Popovers and hover boundaries                        |
| Focus           | `#525252`                                                        | Keyboard focus and selected-node outline             |
| Section palette | `#EDF4FB`, `#EEF6ED`, `#FBF5E6`, `#F2EEF9`, `#FAEDF1`, `#EAF6F6` | Mathematical section membership                      |

Section colors follow the complete canonical section catalog, including appendices. With no catalog, literal section IDs are sorted deterministically. More than six sections reuse the palette cyclically. Every card also displays section text, so color is never the only cue. Filtering and selection cannot change this mapping. Neither colors nor computed positions are exported to JSON.

## Cards and type borders

Cards are 340×144 graph units. The same constants drive ELK, React Flow, camera calculations, and PDF bounds. Labels are 15 px, titles are 24 px with up to two lines, and section text is 12 px at 100% zoom. Original labels remain intact; full titles and statements are available in the inspector. Main-result emphasis applies only to a supplied `Main result` role.

| Object type                       | Neutral border grammar                  |
| --------------------------------- | --------------------------------------- |
| Theorem                           | 6 px double border                      |
| Proposition                       | 3 px continuous border                  |
| Lemma / Claim                     | Normal border with a 7 px left bar      |
| Corollary                         | Normal border with a 7 px top bar       |
| Definition / Assumption           | 3 px dotted border                      |
| Example / Remark / Counterexample | 2 px dashed border with rounded corners |

Selection adds a separate 3 px dark-gray outline at a 4 px offset and a light neutral shadow. Direct neighbors receive a restrained dashed external outline. Neither selection nor hovering replaces the mathematical border or section fill. Cards cannot be dragged, connected, or deleted. No MiniMap is present.

## Navigation and search

The header contains branding, mathematical-object search after upload, Download PDF, and Import JSON. The initial screen invites a JSON upload or drop; it does not load synthetic data. The map appears and arranges automatically after successful validation. Load Example, Export JSON, Context, Auto layout, and Fit view buttons are omitted.

Search indexes the full canonical graph, including hidden context and disconnected objects. It accepts type, original numbering and label, title, section title/ID, object ID, statement, and role. Type abbreviations include `thm`, `lem`, `prop`, `cor`, `def`, `assump`, `ex`, `rmk`, and `clm`. Matching is case-insensitive and partial; multiple terms must all match. Exact labels/type-number pairs rank first, followed by exact numbers, IDs, and titles, with canonical-order ties.

Suggestions show eight results per page, including type/number, original label, title, and section. All matches remain reachable with Previous/Next or arrow keys. Cmd/Ctrl+K focuses and selects the search text; Up/Down traverses matches; Enter selects; Escape dismisses suggestions without clearing graph selection. A combobox/listbox relationship and active-descendant state expose keyboard selection to assistive technology.

Typing never changes the visible graph. Selecting a result clears type/section filters, selects the same node state used by direct canvas clicks, and opens the inspector. Visible targets are smoothly centered in the readable area outside the inspector, up to 100% zoom. Search for hidden global context opens its statement without changing visibility. Reveal on map explicitly reveals and focuses it.

The narrow collapsible navigator retains paper identity, outline/appendix navigation, type filters, and Show complete map. Theorems/main results and reused prerequisites are collapsed shortcuts. Reuse means distinct outgoing `uses` targets; parallel records and self loops do not inflate the count, and other relations are not counted as proof use. These supplied links can be unverified or disputed.

## Selection and inspector

Inspector visibility and selected node/edge identity are separate state. Direct clicks do not move the camera or recompute layout. Closing the inspector retains the selected highlight. Escape closes an open inspector; a second Escape clears selection. Clicking empty canvas clears selection and closes contextual surfaces. Panning or zooming retains selection and the inspector.

On desktop the nonmodal inspector is 420 px wide and anchored 12 px inside the canvas's right edge. Narrow canvases use a bounded lower overlay so search can focus the selected card above it. Opening and closing it never changes graph area or node positions. Complete statements, local KaTeX, roles, sources, evidence, and original JSON are available; long statements and wide formulas scroll independently of canvas gestures.

Incoming `uses` records are shown as prerequisites, outgoing `uses` records as dependents. Other relations retain their own section and directions, with a reminder that they are not automatically dependencies. Evidence origin and supplied verification are separate. Nodes have no invented verification field.

## Layout and gestures

ELK's cancellable local worker supplies downward layered placement. Sibling spacing is 32 px, inter-layer spacing 64 px. A bounded deterministic packing pass translates whole connected components into nearby space, preserving every internal ELK offset. Component bounds include the same conservative cubic-edge geometry used for PDF export, including loops, parallel curves, and backward edges. Components are found using incidence of all relationship types only for spatial grouping, not to infer proof dependence. No node or relationship is added, merged, reversed, or discarded.

For more than 80 visible objects, automatic initial framing stops at 60% zoom so labels are not forced into tiny text. Pinch zoom-out returns to the full-diagram overview; search and pinch zoom restore readable local inspection. The canvas omits plus/minus zoom buttons. Type/section filtering retains coordinates. Context visibility and scope changes recompute the layout. Failure retains every visible object in a grid with an explanation.

Two-finger scrolling pans in both axes; synthesized pinch signals zoom. Empty-space dragging pans. Inspector scrolling stays local. Physical Mac trackpads and Safari still require manual validation.

## Context and edges

Only explicit `metadata.scope: "global_context"` hides an object by default. Local, missing, and unrecognized scope values stay eligible. Hidden context remains searchable, inspectable, exportable, and explicitly revealable. Scope changes preserve every other field.

Relation color encodes relation type. Solid lines indicate explicit source-supported origin; dashed lines indicate inferred origin. Neither indicates mathematical truth. Verification is an independent imported annotation. Equivalence has two arrowheads; all stored endpoints remain unchanged. The compact Edge Legend explains these conventions. Clicking an edge opens its evidence and endpoint links. Relationship labels are shown globally by default. The label toggle can hide them; selected relationships and incident edges still show their labels.

## Export and preservation

The canonical serializer preserves the full graph, even when the view hides objects; there is no JSON export button. Schema 1.0.0, validation, and example data remain unchanged.

Download PDF captures the entire visible subgraph, independent of current viewport. It preserves section fills, type borders, formulas, and relationships on white pages. The clone removes selection and neighbor outlines, selection-only labels, application controls, and inspectors. Local font embedding and three pixels per graph pixel produce approximately 216–288 dpi raster imagery. Existing A3/A2 sizing and readable overlapping A3 tiles are retained; PDF is not vector/selectable text.

## Verification and limits

Automated coverage includes canonical preservation, aliases/exact-number ranking, hidden context, keyboard suggestions, independent inspector state, unoccluded focus at desktop/mobile sizes, section/type styling, white controls, fixed-node wheel/pinch interaction, and a 300-node/240-edge synthetic graph including disconnected objects. Layout tests check every returned node, non-overlap, unchanged input, and preservation of internal component offsets. Export tests compare diagram imagery across viewport and selection changes, verify nonblank content, and exercise tiling and local mathematical typography.

Desktop checks use a 1512×982 viewport and narrow-screen checks use 390×844. PDF pages are rendered for visual inspection. Physical trackpad behavior, Safari, and real-paper density are not established by these synthetic Chrome checks. Large graphs can still have crossings; large PDF exports use memory and can produce many tiles. Long titles are truncated on cards but remain complete in the inspector and canonical JSON.

## Integration

No schema change, dependency addition, backend, external content service, or deployment is required. The `/proof-map/` base and bundled worker/fonts remain intact. Design changes are confined to presentation, local navigation/layout helpers, export cleanup, and tests. The existing scope-classification feature remains supported. Other development conversations should preserve this grammar and the selection/inspector separation when extending the viewer.

## Changed-file inventory

- Application and navigation: `src/App.tsx`, `src/components/GlobalSearch.tsx`, `src/components/PaperNavigation.tsx`.
- Canvas and inspection: `src/components/GraphCanvas.tsx`, `src/components/MathObjectNode.tsx`, `src/components/FloatingPanel.tsx`, `src/components/NodeInspector.tsx`, `src/components/RelationshipEdge.tsx`.
- Presentation services: `src/graph/search.ts`, `src/graph/navigation.ts`, `src/graph/presentation.ts`, `src/graph/inspector-layout.ts`.
- Layout: `src/graph/layout-model.ts`, `src/graph/layout-shared.ts`, `src/graph/layout-packing.ts`.
- Styling and export: `src/styles.css`, `src/export/map-pdf.ts`.
- Tests: `tests/viewer-v02.test.ts`, `tests/e2e/v02.spec.ts`, and the superseded no-section-footer assertion in `tests/e2e/refinement.spec.ts`.
- Documentation: `README.md`, `docs/PRODUCT.md`, `docs/SCHEMA.md` (presentation notes only), `docs/DECISIONS.md`, and this design document.

Final local validation on 2026-10-22: 61 unit tests and 20 Chrome browser tests passed; `pnpm typecheck` and `pnpm build` passed. Chrome was selected using the existing `PLAYWRIGHT_CHANNEL=chrome` configuration because the default Playwright browser was absent. Testing used Node 22.14.0 and pinned pnpm 11.25.0. The canonical schema, deployment configuration, dependencies, and example JSON were not changed for this refinement. No commit, push, merge, or deployment was performed.

Zooming out stops at the full visible map overview (with padding), recalculated for the canvas size, filters, and layout. Bounds include relationship curves as well as cards. Automatic framing uses this overview; zooming in remains available.

Examples and counterexamples share the Example display category and a single combined type filter/count. Original source labels, canonical types, and relationship meanings remain intact in inspection and export.

At the full-map zoom floor, scrolling and dragging cannot pan the canvas. Finishing a zoom-out gesture restores the centered overview. Zooming in unlocks panning again.

Map framing and zoomed-in panning share a 40 px screen-space margin around the complete visible graph bounds, including relationship curves. At the end of user gestures, panning settles within those bounds; each outer edge is reachable with the same margin. Axes that fit remain centered. Inspector navigation retains its reserved reading area.
