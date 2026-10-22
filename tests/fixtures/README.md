# Synthetic QA fixtures

These authored fixtures contain no private research and are not extracted from published papers. Supplied verification labels are test annotations, not independent mathematical verification.

| Fixture                                   | Objects / relationships | Purpose                                                                                                                                                                                                                                              |
| ----------------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `valid/minimal.graph.json`                | 4 / 1                   | Optional fields absent; literal appendix labels; isolated definition/example                                                                                                                                                                         |
| `valid/theoretical-statistics.graph.json` | 16 / 19                 | Synthetic concentration argument; all object/relation types; shared prerequisites; cycles, equivalence, self loop, parallel relationships; source evidence; all six origin/status combinations; appendix objects; nested metadata and explicit scope |
| `valid/complex-150.graph.json`            | 150 / 211               | Ten replicated synthetic groups, shared cross-group links, disconnected components, ten standalone objects                                                                                                                                           |
| `invalid/*.json`                          | 16 rejected documents   | Syntax, escaped duplicate properties, duplicate IDs, unsupported vocabulary/version, missing content/evidence, dangling endpoints, unknown structural fields, invalid page type, empty section catalog                                               |

`invalid-cases.json` records expected error locations and diagnostic fragments. Some invalid files are deliberately not parseable JSON. Tests load the literal file contents so duplicate keys and malformed text are exercised before ordinary parsing can discard information.

The complex fixture tests connectivity and preservation only; its cross-group links do not claim mathematical justification. A passing layout smoke test is not a performance benchmark. Fixtures are kept outside public examples and are not emitted into the production build.
