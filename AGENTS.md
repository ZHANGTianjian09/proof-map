# Proof Map development instructions

## Product boundary

Build an expert-facing, faithful Global Paper Map Viewer. The current milestone is V0: canonical JSON import, validation, layout, visualization, contextual inspection, and visual PDF export. Explicitly editing optional node scope classification is supported; mathematical statement/relationship editing remains out of scope. Keep AI extraction, agents, consultants, proof verification, authentication, databases, and backend services out of V0.

## Mathematical invariants

- Preserve every input node, including disconnected objects. Never merge or delete objects implicitly.
- Preserve statements, original labels/numbering, sections, provenance, verification status, and metadata. Never invent missing mathematical content.
- For `uses`, source is the prerequisite and target is the dependent result. Do not reverse canonical edges to suit a layout.
- Other relationships are not automatically proof dependencies. Cycles, self loops, and parallel edges are valid.
- `origin` and `verification` are independent. A supplied `verified` label is not independent verification by Proof Map.
- Filter only the view. JSON export always contains the full canonical graph, including hidden objects and relationships.
- Hide only nodes explicitly classified with `metadata.scope: "global_context"` by default. Unclassified and local proof objects remain eligible; never infer scope from type or degree. Scope edits must preserve all other data.
- Keep automatic node positions fixed during reading. Ordinary selection must not change the layout or camera. PDF export covers the entire visible subgraph independently of pan and zoom.
- The user reconfirmed on 2026-10-22: keep nodes fixed and omit the MiniMap, including optional controls that would restore these features. Keep cards concise; detailed metadata belongs in inspectors.
- The bundled example is synthetic; do not present it as a published paper or independently checked proof.

## Architecture

- React + TypeScript + Vite; React Flow for interaction, ELK in a cancellable local worker for layout, KaTeX for math, Ajv for structural validation.
- Canonical contract: `schemas/proof-map.v1.schema.json`; corresponding types in `src/graph/types.ts`. Keep documentation, tests, and example data aligned.
- Keep validation, index construction, filtering, layout, and UI separate. Future adapters must emit the canonical schema and pass validation.
- Structural objects reject unknown keys. Extend through JSON-valued `metadata` objects or a deliberate schema version change.
- Never send imported content to remote services. No analytics, remote fonts, API keys, or external math rendering. Keep KaTeX `trust: false` and preserve raw TeX on rendering failure.
- Base path is `/proof-map/`. Keep all assets and worker URLs compatible with GitHub Pages.

## Workflow

- Use Node >=22.12 and the pnpm version pinned in `package.json`; commit the lockfile when a commit is requested.
- Run `pnpm test`, `pnpm typecheck`, and `pnpm build` after relevant code changes. Run `pnpm test:e2e` for import, canvas, inspector, or deployment asset changes. Tests must exercise mathematical preservation, not only snapshots of implementation details.
- Keep browser checks local and synthetic. Note any unverified behavior honestly.
- Update product, schema, and decision docs when behavior changes.
- Do not push or deploy without the user's explicit approval. The Pages workflow is manually triggered only.

## Main commands

`pnpm dev`, `pnpm test`, `pnpm typecheck`, `pnpm build`, `pnpm preview`, `pnpm test:e2e`.
