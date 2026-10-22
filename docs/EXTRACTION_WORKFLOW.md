# Extraction workspace and validation

## Boundary and recovery

This repository supports an external, source-grounded extraction workflow alongside the V0 Global Paper Map Viewer. The Viewer remains a local JSON viewer, with no extraction service, backend, agents, proof checking, or authentication. Extraction work does not change components, layout, styling, deployment, or the canonical schema. Schema changes require separate coordination with the Viewer owner.

Start or resume from the [extraction protocol](../prompts/extract-paper-map.md), [lessons](EXTRACTION_LESSONS.md), and the specific paper's notes/checkpoint. Use the [paper directory convention](../examples/real-papers/README.md). Never carry statements or dependencies between papers based only on similar subject matter.

Initialization on 2026-10-22 inspected `AGENTS.md`, product/schema/decision docs, canonical schema/types, the synthetic example, validation utilities/fixtures, commands, and Git state. The observed branch was `codex/qa-foundation`, with no commits and the existing project untracked. This is a historical observation; inspect the current worktree each time. No paper was supplied or extracted during initialization.

## Viewer data requirements

The normative contract is [proof-map.v1.schema.json](../schemas/proof-map.v1.schema.json); [SCHEMA.md](SCHEMA.md) explains its semantics. Required version: `"1.0.0"`. Do not add structural keys; use JSON-valued `metadata` for extensions.

| Record                            | Required data                                                                                               |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Root                              | `schema_version`, `paper`, `nodes`, `edges`                                                                 |
| Paper                             | `id`, `title`                                                                                               |
| Section, if a catalog is supplied | unique `id`, `title`, `kind` (`section`/`appendix`)                                                         |
| Node                              | unique `id`, supported `type`, original `label`, concise `title`, complete `statement`, `section`, `source` |
| Source                            | nonempty `location`; optional `page` is a positive one-based integer                                        |
| Edge                              | unique `id`, existing `source`/`target`, supported `relation`, `origin`, `verification`                     |
| Explicit edge                     | at least one `evidence` record, each with `source`                                                          |

All ten object types and six relation types are enumerated in the protocol and schema. Source locators must be real, even when page numbers are unavailable. Preserve unnumbered objects without inventing `number`. Node/edge ID namespaces are independent. Empty graphs, cycles, self loops, parallel edges, and disconnected nodes are valid. If `paper.sections` is supplied, every node must reference it. The Viewer rejects duplicate JSON object keys as well as duplicate IDs and bad references; standalone JSON Schema validation alone is insufficient.

Only `node.metadata.scope: "global_context"` is hidden by default. Missing/unrecognized scope and `"local_proof"` remain eligible. Do not infer classification from type/degree or export a filtered graph. The file-picker limit is 10 MiB. Custom LaTeX macros and full LaTeX environments are not executed; retain raw TeX when rendering is unsupported. No imported HTML is executed.

## Optional extraction metadata conventions

These are recommendations within existing unrestricted `metadata`, not new required schema fields or new Viewer functionality. Keep existing metadata siblings. Omit unavailable facts; do not fill them with invented values. Use a paper's notes for lengthy manifests and uncertainty logs.

| Location                            | Suggested keys / purpose                                                                                              |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `paper.metadata`                    | `source_url`, `source_identifier`, `source_version`, `source_sha256`, `accessed_at`, `source_license` (only if known) |
| `source.metadata` on nodes/evidence | `file`, `line_start`, `line_end`, `latex_label`, `printed_page_label`, `pdf_page_index`                               |
| `node.metadata`                     | `scope`, `scope_rationale`, `title_origin`, `original_kind`, `original_statement_latex`, `extraction_transformations` |
| `edge.metadata`                     | `inference_rationale`, `uncertainty`, `conditions`, `review` (identity/date/what was reviewed)                        |
| Root `metadata`                     | `extraction_protocol`, `extraction_date`, `coverage_status`, `source_manifest_reference`                              |

Store exact LaTeX in JSON strings using JSON escaping; an `excerpt` is verbatim while a `note` is explanatory. A file locator is relative to the recorded source root, not an invented hyperlink. Use `source.page` consistently as the one-based PDF page index in new extractions; preserve the printed page label separately. For LaTeX-only input, file/line locators suffice and `page` can be omitted. Do not rewrite pre-existing provenance to impose this convention.

For example, an actual known version belongs at `paper.metadata.source_version`, not at a new `paper.version` structural key. Unknown node scope is represented by omitting `scope` and recording the uncertainty, not by inventing a third recognized classification. Review of extraction fidelity is distinct from a claim that the mathematics was independently verified.

## Read-only validation command

Use Node >=22.12 and pnpm 11.25.0, as pinned in `package.json`. Existing dependencies suffice; no package or lockfile changes are required.

```sh
node scripts/extraction/validate.mjs path/to/graph.json
node scripts/extraction/validate.mjs path/to/graph.json --inventory path/to/node-inventory.graph.json
```

The command prints a JSON report to standard output and never rewrites inputs. To save it, choose a distinct report path (never an input path):

```sh
node scripts/extraction/validate.mjs examples/real-papers/PAPER-SLUG/graph.json --inventory examples/real-papers/PAPER-SLUG/node-inventory.graph.json > examples/real-papers/PAPER-SLUG/validation-report.json
```

`PAPER-SLUG` is a placeholder for an actual supplied paper. On this desktop, when Node is absent from the shell, the existing bundled runtime can be selected for the current shell only:

```sh
export PATH="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback:$PATH"
```

The command loads `scripts/extraction/audit.ts` through installed Vite and calls the existing `src/graph/validation.ts` parser. It does not use the application config, start an HTTP listener, watch files, or send content anywhere. This avoids a second implementation of canonical schema/reference validation.

| Exit | Meaning                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------- |
| 0    | Canonical parse and file size passed; inventory matched if supplied. Warnings/manual checks may remain. |
| 1    | Schema/JSON/reference, file-size, or inventory check failed; see JSON issues.                           |
| 2    | Invocation, file access, or tool-loading error; see standard error. No success report is implied.       |

The report includes exact input hashes and byte count; parse/size/inventory statuses; node counts by type/section/scope; edge counts by relation/origin/verification; isolated/global-context node IDs; issues/warnings; and explicit unverified categories. Counts always cover the full graph. File size is a Viewer limit, separate from canonical schema validity.

## Independent inventory and reporting gates

1. **Source audit:** Build `node-inventory.graph.json` during Phase B directly from the accessible paper. It has ordinary canonical `paper` and `nodes`, and `edges: []`. Check its inventory independently against the coverage/environment ledger before any edge extraction. A tool cannot establish that this audit happened.
2. **Freeze and compare:** The final graph must have the same full paper and node records as the inventory; node ordering and object-key ordering do not matter. Node IDs, statements (including whitespace), labels, numbers, source, title, scope, node evidence, and other node metadata must match. Full `paper` comparison includes version metadata and the section catalog. Root metadata may change to record extraction progress; edges are added to the final graph.
3. **Intentional corrections:** Added/deleted/revised objects, source changes, new node evidence, or reclassification require a source review and an entry in the correction ledger before updating the baseline. Do not overwrite an independently audited inventory from the final graph to silence errors.
4. **Manual mathematics checks:** Reconcile rendered/source numbering, assumptions, statement boundaries, external citations, proof ownership, edge direction, evidence, and scope. An exact match to an incomplete inventory remains incomplete. No automated number-sequence heuristic can substitute for paper-specific counters and local numbering.
5. **Compatibility:** Parser/size success is checked programmatically. Keep ordinary browser checks local and synthetic, per `AGENTS.md`. For a paper, report visual testing as not run unless it was actually run under explicit authorization consistent with that rule. Unsupported math and complex layouts may still have visual limitations. Never conflate a synthetic browser smoke test with visual review of the paper.
6. **Report:** Use the [report](../prompts/templates/extraction-report.md) and [notes](../prompts/templates/extraction-notes.md) templates. Link the exact validation report/hash and record source coverage, actual tests, warnings, unresolved objects/dependencies, and the next checkpoint. No automatic completion, coverage percentage, or proof-validity claim is generated.

Run checks after relevant extraction-tool changes:

```sh
pnpm test
pnpm typecheck
pnpm build
```

Run `pnpm test:e2e` after import/canvas/inspector/deployment changes; extraction-only scripts do not alter those paths. If a local synthetic browser check is performed, rebuild first and record the fixture, command, and results. Unit/CLI validation alone is not a visual check.

### Initialization checks — 2026-10-22

- Node 24.19.0 and pinned pnpm 11.25.0 were used locally.
- `pnpm test`: 52 tests passed across five files, including extraction preservation and CLI checks. Cases cover lost isolated/global objects, changed statements/numbering/provenance/metadata, paper-version mismatches, extra objects, duplicate properties, invalid references/evidence, and the byte-based Viewer limit.
- `pnpm typecheck` and `pnpm build`: passed after correcting a duplicate-property expression in the new test.
- The read-only CLI accepted the existing synthetic example: 16 nodes, 16 edges (12 explicit / 4 inferred), four global context nodes, and one isolated node. Its report is saved locally at `.local/extraction-setup/synthetic-validation-report.json`. No independent source inventory was supplied for that invocation; its inventory status is `not_run`.
- No real paper, source-completeness audit, or browser/visual check was performed. No Viewer/schema/package/deployment edits were made by this initialization; concurrent Viewer edits observed in the shared worktree were left untouched. No commit, push, or deployment was performed.

## Current schema limitations and separate extension candidates

| Limitation                                                                                           | Faithful treatment under 1.0.0                                                                                                                                                                                         | Candidate for separate design discussion                                         |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Paper version/source files/macros have no dedicated fields                                           | Use metadata plus manifest/notes; retain raw TeX.                                                                                                                                                                      | Typed source manifests and macro provenance, without unsafe execution.           |
| No external-node/citation endpoint type                                                              | Keep unresolved external citations in notes/metadata. Create a node only for an actually available complete formal statement with provenance.                                                                          | External result references with explicit availability/status.                    |
| Only ten node kinds; no distinct conjecture, problem, equation, proof, or algorithm type             | Record original kind; map only if mathematically faithful (e.g. a conjecture as a stated claim with its status retained). Otherwise retain the unresolved declaration and limitation in notes. Never drop it silently. | Additional object kinds after concrete paper examples and Viewer agreement.      |
| Only six binary relations; no shared-assumption, conditional implication, or joint-premise hyperedge | Use existing relations only when their meaning fits; preserve joint premise/conditions in notes/evidence/metadata. Pairwise edges do not assert each premise is sufficient alone.                                      | Typed conditional relations or premise groups with defined semantics.            |
| No first-class substatements, proof steps, local symbol scope, or section hierarchy                  | Keep full compound statements; preserve formally distinct local claims as nodes; use metadata/notes for grouping.                                                                                                      | Explicit grouping/containment and source anchors.                                |
| No node-level verification field or typed confidence/reviewer record                                 | Preserve supplied annotations in metadata; edge `verification` remains separate from `origin`.                                                                                                                         | Auditable review records that distinguish extraction review from proof checking. |
| Evidence/location strings are structurally checked, not authenticated                                | Manually check the actual passage. Metadata carries line ranges and provenance.                                                                                                                                        | Source-linked evidence validation independent of mathematical verification.      |
| Metadata is extensible but its conventions are not validated/displayed as dedicated features         | Preserve it exactly and document meaning. Do not expect the Viewer to apply macros, conditions, or arbitrary status fields.                                                                                            | Typed optional conventions backed by explicit product decisions.                 |
| Structural validity does not imply source completeness or correct direction/numbering                | Maintain the independent inventory and source/proof review ledgers.                                                                                                                                                    | Source-grounded audit helpers; never a truth claim from parser success.          |

The 10 MiB import limit, KaTeX subset, and uncharacterized large-graph performance are Viewer limitations, not reasons to change mathematics. Record a faithful failing case or a local synthetic reproducer when relevant. None of the extension candidates above changes the schema or authorizes Viewer development in this extraction workspace.
