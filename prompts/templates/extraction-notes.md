# Extraction notes — [paper slug]

## Resume checkpoint

- Exact paper identity/version and directory:
- Current phase (A–F), last completed step/date:
- Next concrete step and outstanding blockers:
- Protocol revision and inventory/graph/report hashes:
- Decisions already reviewed; facts still uncertain:

## Source manifest and environment map

| File / source URL | Version / SHA-256 | Local source-root-relative path | Accessed / available | Role and include parent |
| ----------------- | ----------------- | ------------------------------- | -------------------- | ----------------------- |

Record main entry point, include tree, conditional/excluded files, appendices/supplements, theorem/custom environment definitions, counters/resets, macros, source licensing, missing files, and retrieval failures. Match PDF and LaTeX versions. Specify PDF page-index versus printed-label convention.

## Coverage and declaration ledger

| Section / source range | Formal environment / heading | Original labels and numbers | Stable node IDs | Statement audit / unresolved items |
| ---------------------- | ---------------------------- | --------------------------- | --------------- | ---------------------------------- |

Include zero-object sections and unresolved/unreadable declarations. Explain stable IDs for repeated/unnumbered statements, restatements, local claims, and original-kind mappings. Source-audit the complete statements in `node-inventory.graph.json` before edge work; the ledger is independent evidence of this review.

## Proof and relationship review ledger

| Result / proof location | Invoked object or citation | Context/evidence | Accepted edge ID and origin, or rejected/pending reason | Review status |
| ----------------------- | -------------------------- | ---------------- | ------------------------------------------------------- | ------------- |

Record proofs with no relationships found, missing/deferred proofs, unresolved external results, inference rationale, joint premises, conditional implications, and citations that are not proof dependencies. Do not silently discard pending candidates or pretend they are verified edges.

## Context and notation decisions

| Node / source | Global/local/unclassified decision | Source-grounded rationale and uncertainty |
| ------------- | ---------------------------------- | ----------------------------------------- |

Preserve raw statements/macros. Log any presentation transformations and where the original fragment is retained. Record mathematical observations separately from verbatim quotations and from claims of proof correctness.

## Correction and issue ledger

| Issue ID / date | Object and source | Previous value / problem | Source-reviewed correction or uncertainty | Inventory updated / review evidence |
| --------------- | ----------------- | ------------------------ | ----------------------------------------- | ----------------------------------- |

Never regenerate the baseline from the final graph to hide a mismatch. Record source-version changes explicitly; a new version normally has its own directory.

## Validation runs and retrospective

Record commands, date, exit status, exact input hashes, report paths, warnings, actual browser fixtures, and any unperformed checks. Record real errors and generalizable lessons only after they occur. Keep paper-specific choices here and link any justified general update to `docs/EXTRACTION_LESSONS.md`.
