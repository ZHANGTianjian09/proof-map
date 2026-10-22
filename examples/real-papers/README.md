# Real-paper extraction workspace

No real paper is bundled here yet. Create a directory only when a paper is supplied.

Use `arxiv-<identifier>-v<version>-<short-title>` when a versioned arXiv source is available. Otherwise use `<author-or-organization>-<year-if-known>-<short-title>-<source-version-or-hash-prefix>`. Do not invent missing authors, dates, or versions. Record the full file hash and identity in notes. Different paper versions get different directories; any cross-version ID mapping must be reviewed explicitly.

```text
examples/real-papers/<paper-slug>/
  graph.json                    Full canonical graph
  node-inventory.graph.json     Source-audited Phase B nodes; edges: []
  extraction-report.md          Coverage, counts, checks, uncertainties
  extraction-notes.md           Source manifest, ledgers, checkpoints, decisions
  validation-report.json        Read-only command output with input hashes
.local/papers/<paper-slug>/sources/
  ...                           Local source/PDF/supplements (ignored by Git)
```

Copy the [report](../../prompts/templates/extraction-report.md) and [notes](../../prompts/templates/extraction-notes.md) templates when starting a paper; resolve their placeholders only from actual evidence. More detailed ledgers may be separate files linked from notes for long papers. Do not generate a fake `graph.json` from a template before obtaining statements.

Use the [protocol](../../prompts/extract-paper-map.md) and [validation workflow](../../docs/EXTRACTION_WORKFLOW.md). The inventory uses the existing canonical schema, with an empty edge array; it is an independent source checkpoint, not a second Viewer format. Freeze the full paper and node records after Phase B; add proof relationships to the final graph. Later node corrections require source review and a logged baseline update.

Raw source and unpublished research stay local. Graphs and statements may also contain protected material: local creation does not authorize committing, uploading, publishing, or deploying them. Preserve attribution and record distribution permissions before any future publication. The application build currently bundles only the named synthetic example; do not add real papers to deployment assets automatically.
