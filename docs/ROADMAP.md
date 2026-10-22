# Proof Map roadmap

## V0 — Global Paper Map Viewer (this milestone)

- Versioned canonical schema, TypeScript types, and strict structural/reference validation.
- Synthetic statistics example with all ten object types, cross-dependencies, an isolated object, and a relationship cycle.
- Browser-local import and drag-and-drop → validation → graph indexes → ELK layout → React Flow viewer → KaTeX inspector.
- Search, object-type and section filters, zoom/pan, fit view, automatic layout, evidence inspection, and full JSON export.
- Reading-focused canvas: collapsible navigator, bounded floating node/edge inspectors, fixed larger cards, scroll-to-pan/pinch-to-zoom, and no MiniMap or bottom bars.
- Explicit global/local scope classification, Context drawer, backward-compatible metadata, and lossless full JSON export.
- Client-side whole-visible-map PDF export with embedded fonts, high-resolution rendering, and readable overlapping pages for large maps.
- Automated preservation/validation/layout tests and browser workflow tests.
- GitHub Pages build and manual deployment configuration; no deployment without approval.

## V0.1 — Extraction contract and real-paper fidelity (recommended next)

1. Write a model-independent extraction prompt tied to the canonical schema, including a coverage inventory and evidence requirements.
2. Curate one permissively available theoretical statistics paper and a human-reviewed graph; check every numbered object, appendix, and source locator against the paper.
3. Build a regression corpus for incomplete extraction, ambiguous citations, inferred relationships, cycles, and notation.
4. Benchmark realistic 100–500-object papers; improve edge routing, component organization, and access to long statements based on those results.
5. Improve keyboard/screen-reader workflows and test Firefox, Safari, and narrow screens more broadly.

## Later visualization milestones

Deterministic import adapters, source-document navigation, configurable layout direction, graph snapshots/view state, and carefully scoped editing with explicit provenance changes. Preserve the canonical import boundary.

## Long-term research workflows (not implemented)

Multi-route conjecture work, persistent research knowledge, AI consultation, independent proof verification, and research coordination. Each requires its own product design, trust model, verification semantics, and explicit user authorization. Do not introduce orchestration or services preemptively.
