# Proof Map

A browser-local, interactive map of the logical architecture of mathematical papers. Built for researchers who need to inspect statements, dependencies, and evidence across an entire paper.

**V0 implements the Global Paper Map Viewer.** It does not extract papers or verify proofs. Import canonical JSON from any extraction tool; no OpenAI key, backend, account, or content upload is required.

Repository: [ZHANGTianjian09/proof-map](https://github.com/ZHANGTianjian09/proof-map)

GitHub Pages URL: <https://zhangtianjian09.github.io/proof-map/>

## Run locally

Requirements: Node.js **22.12 or newer** and **pnpm 11.25.0** (pinned in `package.json`; CI uses Node 24).

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open <http://127.0.0.1:5173/proof-map/>. If that port is occupied, Vite prints the chosen URL. On this Codex Desktop machine, dependencies have already been installed and this convenience launcher can use the bundled runtime when Node/pnpm are absent from the shell:

```sh
./scripts/dev-local.sh
```

The launcher changes only its own environment; it does not modify your shell configuration. The bundled-runtime fallback is optional and specific to Codex Desktop. A normal Node/pnpm installation works elsewhere.

To preview the static production build:

```sh
pnpm build
pnpm preview
```

Open <http://127.0.0.1:4173/proof-map/>. Serve `dist/` through a web server; opening `index.html` as a `file://` URL will not run module workers correctly.

## Use the viewer

- **Import JSON** opens a file picker; dropping one `.json` file anywhere in the application also imports it. The V0 file limit is 10 MiB.
- **Load example** opens a synthetic theoretical statistics graph: 16 objects, 16 relationships, two main theorems, all ten object types, a relationship cycle, and an isolated appendix remark. Four global context objects are hidden initially, leaving 12 objects and six relationships on the proof map. It does not reproduce a real paper.
- Use the top-bar search (Cmd/Ctrl+K) to find types, numbering, titles, original labels, IDs, sections, statements, or roles across the full paper. Typing does not filter the map. Arrow keys navigate suggestions; Enter selects. Use the outline and type checkboxes for view filtering.
- Two-finger scroll pans in either or both axes; pinch zooms. Mouse dragging on empty canvas also pans. Cards stay fixed. **Fit view**, **Auto layout**, search, and zoom controls support navigation. Collapse the navigator for more canvas space.
- Select an object to open a floating inspector for its full statement, source, role, and relationships. The panel anchors to the right, scrolls independently, and closes with Escape or its close button while keeping the selected highlight. A second Escape or an empty-canvas click clears selection. Click an edge to inspect its direction, evidence, and supplied verification. Original JSON and TeX remain inspectable.
- **Context** lists hidden global foundations and offers a show-context checkbox. Only explicit `metadata.scope: "global_context"` hides an object by default. `"local_proof"` and unclassified objects remain eligible, including definitions/assumptions. Change scope in the drawer or inspector; missing metadata stays backward compatible. The drawer can inspect hidden context without revealing it. Search and the paper navigator can also inspect hidden context; Reveal on map explicitly reveals and focuses it.
- **Edge legend** explains relation colors, arrowheads, and origin styles. Equivalence has two arrowheads; `uses` points prerequisite → dependent.
- **Export JSON** downloads the complete canonical graph, including objects hidden by filters. View positions and filters are not exported. Reloading the page resets the in-memory session.
- **Download PDF** exports the entire visible map, independent of pan/zoom, without app controls or inspectors. The browser embeds local fonts and KaTeX in 216–288 dpi imagery with white background and margins. A3/A2 landscape pages are used when readable; larger maps use overlapping A3 tiles. PDF includes the visible subgraph; JSON includes all data and scope edits.

For `uses`, arrows point **prerequisite → dependent result**: `Lemma A → Theorem B` means B uses A. Other relationships have different meanings. Dashed edges are inferred; solid edges are source-supported. Neither presentation nor a supplied verification label establishes mathematical correctness.

## Tests and checks

```sh
pnpm test
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
```

Browser tests exercise the **production build** at `/proof-map/`. Rebuild after edits before running them. If Google Chrome is already installed, `PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e` uses it instead of a downloaded Chromium. Test screenshots and failure traces go to ignored `.local/` paths. CI installs Chromium and runs the same checks.

See the [test plan](docs/TEST_PLAN.md), [synthetic QA fixtures](tests/fixtures/README.md), and [evaluation methodology](docs/EVALUATION.md) for preservation checks and future human-reviewed paper evaluation.

Unit tests cover strict schema acceptance, duplicate keys/IDs, references, provenance, all vocabularies, exact export round trips, scope preservation, filters, cycles, self loops, parallel edges, non-overlapping layout, panel boundaries, and complete PDF page coverage. Browser tests cover import/drop/export, math, evidence, filters, keyboard selection, safe text, narrow screens, fixed cards, wheel/pinch signals, inspector scrolling, context edits, and full-map/tiled PDFs. Physical MacBook trackpad gestures and Safari still need manual validation.

## Project structure

```text
AGENTS.md                 Persistent development rules and mathematical invariants
docs/PRODUCT.md           Scope and acceptance criteria
docs/SCHEMA.md            Canonical format, orientation, and provenance semantics
docs/ROADMAP.md           Milestones and next research workflow
docs/DECISIONS.md         Architecture and implementation references
schemas/                 Versioned machine-readable JSON Schema
examples/                Synthetic canonical graph
prompts/                 Reserved extraction-prompt guidance
src/graph/               Types, validation, indexing, filters, and layout
src/components/          React Flow canvas, object cards, math, and inspector
src/export/              Whole-map bounds, page tiling, and browser PDF rendering
tests/                   Unit and production-browser tests
scripts/dev-local.sh     Optional local launcher
.github/workflows/       CI and manually triggered GitHub Pages deployment
```

Stack: React, TypeScript, Vite, `@xyflow/react`, ELK.js, KaTeX, and Ajv; PDF export loads jsPDF and html-to-image with the application, avoiding a late module fetch when Download PDF is clicked. Layout runs in a cancellable native worker. Graph data is separate from view state. The static build includes the schema and example under `schemas/` and `examples/`.

## GitHub Pages

1. Create/use `ZHANGTianjian09/proof-map` and push this repository only after explicit approval.
2. In GitHub **Settings → Pages**, select **GitHub Actions** as the source.
3. Explicitly run **Deploy Proof Map to GitHub Pages** from the Actions tab when publication is approved.

Vite's base is `/proof-map/`. Deployment has **only a manual trigger**; an ordinary push runs validation but does not publish. The deployment build runs unit tests, type checking, the production build, and Chromium browser tests before publishing `dist/`. See [deployment instructions](docs/DEPLOYMENT.md).

## Known limitations and next milestone

This release has no PDF extraction, mathematical content editing, persistence across reloads, AI features, or independent proof checking. Scope classification is the only supported data edit. It validates structure, not paper coverage or mathematical correctness. KaTeX supports a subset of LaTeX and no imported custom macro configuration. Long formulas scroll in the inspector. Cards show up to three title lines; inspectors retain complete titles/statements. Automatic placement is cycle-safe, but dense graphs can still have crossing edges; large-paper performance is not yet benchmarked. PDF text is rasterized, not selectable/vector, and large exports can require significant memory. Desktop viewing is preferred.

The recommended next milestone is **a canonical extraction prompt and a human-audited graph of one real statistics paper**, with a completeness inventory covering every formal object and appendix. Use that corpus to guide layout and performance improvements before adding AI research orchestration.
