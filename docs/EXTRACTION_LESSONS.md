# Extraction lessons and known risks

## Status

Initialized 2026-10-22 from repository inspection. No real paper has been processed in this workspace yet. The entries below are schema facts or preventive risks, not empirical findings from a paper or measurements of extraction quality.

## Established contract facts

- Reuse the Viewer parser: JSON Schema alone misses duplicate JSON properties, duplicate IDs, dangling endpoints, and section-reference checks performed by the application.
- Preserve all declarations and supported relations. Cycles, self loops, parallel edges, disconnected objects, and globally hidden context are valid canonical data.
- `uses` is prerequisite → dependent; `generalizes` is general → special. Equivalence is one symmetric relation. Neither a textual reference nor another relation type is automatically a proof dependency.
- Explicit edges require evidence, but explicit/inferred origin is independent of supplied verification. No extraction or schema check establishes mathematical truth.
- Unknown structural fields are rejected. Version, source files, LaTeX labels, macros, uncertainty, and richer review information belong in existing metadata or notes until a separate schema decision is approved.
- Only explicit `metadata.scope: "global_context"` hides nodes by default. Scope cannot be inferred from node type or degree.

## Preventive risk register — not yet paper-tested

| Risk                                                                | Detection / mitigation                                                                                                 | Status     |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------- |
| Missing appendix, supplementary, unnumbered, or proof-local objects | Source/include manifest, environment + prose/PDF inspection, section ledger including zero-object sections             | Preventive |
| Custom environments or counter resets produce wrong labels          | Inspect class/style definitions and macros; reconcile against same-version PDF when available                          | Preventive |
| OCR or copied formulas lose hypotheses/quantifiers                  | Inspect ambiguous pages; retain raw fragments; record unreadable content instead of guessing                           | Preventive |
| Generated summaries replace rigorous statements                     | Store complete source statement; short title is separate and marked when generated                                     | Preventive |
| Citations become false proof dependencies                           | Inspect the actual proof argument; log rejected/pending citations and proof owner                                      | Preventive |
| Implicit use is mislabeled explicit or verified                     | Separate origin, evidence, inference rationale, uncertainty, and supplied reviewer status                              | Preventive |
| Incomplete inventory yields a misleading successful comparison      | Build/audit inventory before edges; reconcile source coverage manually; never derive the baseline from the final graph | Preventive |
| Cross-paper/version contamination                                   | Versioned directories, file hashes, namespaced IDs, full paper comparison                                              | Preventive |
| Independent premises incorrectly shown as individually sufficient   | Review logical conditions; preserve joint-premise details; do not substitute implication for use                       | Preventive |
| Global definitions/assumptions misclassified or discarded           | Classify from role; leave uncertainty visible; compare all inventory nodes, including isolated/context objects         | Preventive |
| Valid JSON mistaken for successful rendering or proof checking      | Report structural, inventory, source, browser, and mathematical review statuses separately                             | Preventive |

## Add an observed lesson after each paper

Record date; paper/version and issue IDs; precise source-backed observation; root cause; correction; generalizable protocol change (if any); validation evidence; and a regression fixture with reuse permission when practical. Distinguish a hypothesis from a repeated failure, and a paper-specific adjustment from a general rule. Do not add invented success rates or claim a real-paper corpus until one exists.

Use [paper notes](../prompts/templates/extraction-notes.md) for unresolved mathematical questions and paper-specific decisions. Use [the workflow limitations](EXTRACTION_WORKFLOW.md#current-schema-limitations-and-separate-extension-candidates) for proposed schema discussions; this file does not authorize changing the Viewer or schema.
