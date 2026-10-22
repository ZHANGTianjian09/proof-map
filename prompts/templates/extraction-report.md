# Extraction report — [paper title]

Status: [in progress / incomplete / complete for the explicitly described accessible source]. Replace placeholders with observed facts; use “not checked” when appropriate. Do not use this template as a completed report.

## Identity and source

- Paper title, authors, stable identifier/source URL:
- Version/date and source file hashes (or link to manifest):
- Access date, available formats, missing/retrieval-failed inputs:
- Source/distribution permissions known so far:
- Extraction protocol revision/date and operator/reviewer:

## Coverage

| Section / appendix / supplement                  | Source files or PDF pages | Inventory audited | Proofs reviewed | Missing/unreadable material |
| ------------------------------------------------ | ------------------------- | ----------------- | --------------- | --------------------------- |
| [actual section, including zero-object sections] |                           | not checked       | not checked     |                             |

Describe how formal declarations, custom environments, unnumbered/local claims, and appendix numbering were reconciled. Identify supplements not available. Do not assert completeness from counts alone.

## Graph totals

Copy observed counts from the matching `validation-report.json`; supply no estimated quality scores.

- Total nodes and counts for all ten types:
- Counts by section:
- Total edges; counts by relation and by explicit/inferred origin:
- Supplied verification labels and their review provenance:
- Scope counts: global context, local proof, unclassified, unrecognized:
- Isolated node count/IDs; retained global context IDs:
- Unresolved declarations, unsupported object kinds, and unaccepted candidate relationships (outside graph totals):

## Validation and compatibility

| Check                                                      | Result (passed/failed/not run/partial) | Evidence, command, date, artifact |
| ---------------------------------------------------------- | -------------------------------------- | --------------------------------- |
| Strict JSON, duplicate properties, canonical schema        | not run                                |                                   |
| Unique IDs, section references, valid edge endpoints       | not run                                |                                   |
| 10 MiB Viewer file limit                                   | not run                                |                                   |
| Independent inventory equality (paper + full node records) | not run                                |                                   |
| Source inventory completeness and original numbering       | not checked                            |                                   |
| Full statements, hypotheses, quantifiers, raw TeX fidelity | not checked                            |                                   |
| Dependencies, direction, evidence, and scope review        | not checked                            |                                   |
| Isolated/global context objects retained                   | not checked                            |                                   |
| Actual local browser test and exact graph/fixture used     | not run                                |                                   |
| Full JSON export round trip, if executed                   | not run                                |                                   |
| Independent proof verification                             | not performed by this workflow         |                                   |

Record graph/inventory SHA-256 values, validation report path, all warnings and their disposition. A synthetic browser check does not test this paper's rendering. Document known rendering/import limitations and any synthetic bug reproducer.

## Uncertainties and potential missing dependencies

| Issue ID | Node/edge/source | What is unresolved | Evidence and possible interpretations | Required follow-up |
| -------- | ---------------- | ------------------ | ------------------------------------- | ------------------ |

Include uncertain classifications, unavailable external results, unresolved local references, missing/omitted proofs, OCR/TeX problems, and schema limitations. Distinguish a candidate relationship from an accepted inferred edge. State which completion gates remain open.

## Outputs and retrospective

- Links to `graph.json`, `node-inventory.graph.json`, `validation-report.json`, and `extraction-notes.md`:
- What worked; difficult objects/macros; ambiguous dependencies; actual errors and corrections:
- Generalizable lesson added to `docs/EXTRACTION_LESSONS.md` (if supported by this experience):
- Regression candidate and source reuse permission:
- Next checkpoint / review needed:

This extraction represents the paper's stated architecture; it does not establish the truth of its proofs.
