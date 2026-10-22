# Canonical mathematical graph — version 1.0.0

The normative structural contract is [`schemas/proof-map.v1.schema.json`](../schemas/proof-map.v1.schema.json), JSON Schema draft-07. TypeScript types live in [`src/graph/types.ts`](../src/graph/types.ts). Files use UTF-8 JSON. The viewer accepts only the exact `schema_version` string `1.0.0`.

## Root

| Field            | Required | Meaning                                                    |
| ---------------- | -------- | ---------------------------------------------------------- |
| `schema_version` | Yes      | Exactly `"1.0.0"`                                          |
| `paper`          | Yes      | Paper identity and optional section catalog                |
| `nodes`          | Yes      | Array of all mathematical objects, including isolated ones |
| `edges`          | Yes      | Array of mathematical relationships                        |
| `metadata`       | No       | Arbitrary JSON-valued extension object                     |

All structural objects reject unknown properties. Extension values belong inside `metadata`. Empty node/edge arrays are valid. No values are coerced or defaulted. Nonempty text fields must contain a non-whitespace character, but their original whitespace is preserved.

## Paper and sections

`paper` requires nonempty string `id` and `title`. Optional fields are `authors` (array of names), `year` (positive integer), `description`, `citation`, `sections`, and `metadata`.

Each section requires `id`, `title`, and `kind` (`section` or `appendix`). Section IDs must be unique. If the catalog is present, every node's `section` must refer to an entry, including when the catalog is empty. Without a catalog, `node.section` is a literal nonempty section/appendix label. The viewer never guesses section membership.

## Mathematical objects

| Field       | Required | Meaning                                                                                                                       |
| ----------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `id`        | Yes      | Unique nonempty opaque string                                                                                                 |
| `type`      | Yes      | `theorem`, `lemma`, `proposition`, `corollary`, `definition`, `assumption`, `example`, `counterexample`, `remark`, or `claim` |
| `label`     | Yes      | Original label, e.g. `Lemma A.2`; never generated from the ID                                                                 |
| `number`    | No       | Original numbering as a string, e.g. `A.2`; omit for unnumbered objects                                                       |
| `title`     | Yes      | Short descriptive title                                                                                                       |
| `statement` | Yes      | Full original statement as text with TeX delimiters                                                                           |
| `section`   | Yes      | Section catalog ID, or literal label if no catalog                                                                            |
| `source`    | Yes      | Original source location                                                                                                      |
| `role`      | No       | Descriptive mathematical role, e.g. `Main result`                                                                             |
| `evidence`  | No       | Array of evidence records                                                                                                     |
| `metadata`  | No       | Extension object                                                                                                              |

TeX delimiters: `$...$` and `\(...\)` inline; `$$...$$` and `\[...\]` display. Escape backslashes in JSON (`"$\\alpha$"`). Plain text is not interpreted as HTML or Markdown. The viewer does not add macros or rewrite statements. Unsupported TeX displays its original text with a rendering notice. Original node JSON is available in the inspector.

### Optional scope classification

The existing metadata extension supports `node.metadata.scope` with the recognized values `"global_context"` and `"local_proof"`. This is an additive viewer convention within version **1.0.0**, with no new required fields or changes to the normative schema.

- `global_context`: standing assumptions, foundational definitions, notation, or other explicitly designated global context. Hidden from the main map by default and accessible through Context or search.
- `local_proof`: a proof-specific object, eligible for the main map, including local definitions and assumptions.
- Missing metadata, absent scope, or any unrecognized scope value: unclassified and eligible for the main map. The viewer preserves unknown values until the user explicitly reclassifies that object.

Scope never follows automatically from object type or node degree. The Context drawer and node inspector let the user edit classification. Selecting Unclassified removes only the scope key. Existing metadata siblings and all statements, sources, IDs, relationships, and evidence remain unchanged. Export JSON includes scope edits and all hidden data; exporting PDF includes only the visible subgraph. An edge is displayed only when both endpoints are visible. Temporarily showing global context is view state and is not exported to JSON. Global search indexes these objects even when hidden; selecting a search result can display its statement without revealing it. Section palette assignments, border families, and selection are derived presentation only and never written into the canonical data.

## Source and evidence

A source requires `location` (a nonempty human-readable locator), and optionally `page` (positive, one-based integer) and `metadata`. A location can identify a section, paragraph, equation, appendix, or named proof. If an extractor cannot identify the source, it should resolve that uncertainty before producing canonical data; the viewer will not invent it.

An evidence record requires `source`; optional `excerpt` is verbatim source text, `note` is explanatory text, and `metadata` contains extensions. A note is not a quotation. For the bundled synthetic example, all locators and quotations belong to the illustrative document, not to a real paper.

## Relationships

An edge requires unique `id`, existing node IDs `source` and `target`, `relation`, `origin`, and `verification`. Optional fields are `evidence`, `note`, and `metadata`.

| Relation            | Orientation and meaning                                                                                                      |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `uses`              | **Prerequisite → dependent result**. `A → B` means B uses A. Also covers explicitly recorded use of definitions/assumptions. |
| `implies`           | Premise → consequence. Records logical implication, not automatically a direct proof citation.                               |
| `equivalent_to`     | Symmetric equivalence. Source/target are retained as supplied; the canvas renders two arrowheads. One record is sufficient.  |
| `generalizes`       | More general object → special case.                                                                                          |
| `illustrates`       | Example/object → object it illustrates.                                                                                      |
| `counterexample_to` | Counterexample → challenged claim. The target may be false.                                                                  |

`origin` must be `explicit` or `inferred`. An explicit relationship **requires at least one evidence record**. Inferred relationships may carry evidence, but supporting text does not make the inferred connection explicit. If an evidence array is supplied on an edge, it must be nonempty.

`verification` must be `unverified`, `verified`, or `disputed`. This is a supplied annotation and is independent of `origin`. Proof Map never promotes status automatically and does not itself verify claims. For additional reviewer identity, timestamps, or uncertainty, use metadata.

Node IDs and edge IDs are unique within their own arrays; they may overlap across arrays. All valid edges are retained, including parallel relations, self loops, and cycles. An equivalent relation remains one canonical edge, not two synthetic edges. Lookup indexes report stored source/target incidence even for equivalence. Layout may internally orient edges differently to calculate positions, but cannot alter exported relations.

## Validation and preservation

The import pipeline is strict JSON parsing → duplicate JSON-property detection → JSON Schema validation → duplicate ID/reference checks → canonical graph. Repeated JSON object keys are rejected, because ordinary JSON parsing would silently discard earlier values. Errors include a JSON Pointer where available; syntax errors include the browser parser's diagnostic.

Ajv checks structural fields, enumerations, and evidence conditions. Application checks enforce unique node/edge/section IDs, existing endpoints, and section references; external users of the JSON schema must also enforce these semantic constraints. Validation is not a test of mathematical truth or extraction completeness relative to a PDF.

Normalization only constructs lookup maps. No strings, numbers, provenance, or metadata are replaced during import. Explicit scope edits are the sole supported data mutation. Export preserves semantic JSON content, array order, and string contents, but re-indents JSON and does not preserve original whitespace outside strings. Filters, automatic positions, selection, pan, zoom, and the context visibility toggle are presentation state and are not exported.

## Minimal example

```json
{
  "schema_version": "1.0.0",
  "paper": { "id": "sample", "title": "An illustrative note" },
  "nodes": [
    {
      "id": "def-1",
      "type": "definition",
      "label": "Definition 1",
      "number": "1",
      "title": "Sample mean",
      "statement": "Let $\\bar X_n = n^{-1}\\sum_{i=1}^n X_i$.",
      "section": "1. Setup",
      "source": { "location": "Section 1, Definition 1", "page": 1 }
    }
  ],
  "edges": []
}
```

The complete synthetic example is [`examples/statistical-estimation.graph.json`](../examples/statistical-estimation.graph.json). Future deterministic adapters belong before the canonical validation boundary; arbitrary LLM-powered conversion is out of scope.
