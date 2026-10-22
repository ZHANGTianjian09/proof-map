# Proof Map test plan

## Reproduce checks

Use Node >=22.12 (CI: Node 24) and the exact pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
pnpm exec playwright install chromium
CI=1 pnpm test:e2e
```

Browser checks use the production build at `http://127.0.0.1:4173/proof-map/`. Rebuild after application changes. Port 4173 must be free when `CI=1` starts an owned server. An installed Chrome may be selected with `CI=1 PLAYWRIGHT_CHANNEL=chrome pnpm test:e2e`. Failure traces/screenshots and generated PDFs stay in ignored `.local/` paths. Keep browser inputs local and synthetic.

Wheel-to-zoom scaling can differ between local Chrome and Linux Chromium. Tests that require the maximum zoom use bounded gestures and verify the resulting zoom before testing pan boundaries, rather than assuming one gesture reaches the limit.

## Coverage and acceptance

| Area                           | Automated evidence                                        | Required behavior                                                                                                                                                     |
| ------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Import boundary                | `validation.test.ts`, `fixtures.test.ts`                  | Strict JSON, duplicate-key rejection, actionable paths; required fields, types, version, evidence and references checked without coercion                             |
| Canonical preservation         | `graph.test.ts`, `fixtures.test.ts`, `refinement.test.ts` | Every object and relationship retained; original strings, labels, sources, evidence, sections, metadata and status preserved by export                                |
| Direction and semantics        | `graph.test.ts`, `fixtures.test.ts`, `viewer-v02.test.ts` | `uses` remains prerequisite → dependent; other relations retain their meaning; origin and verification remain independent                                             |
| Disconnected and cyclic graphs | `graph.test.ts`, `fixtures.test.ts`                       | Isolated objects, shared dependencies, cycles, self loops, parallel/equivalent relations survive indexing and layout                                                  |
| Scope and filtering            | `refinement.test.ts`, `fixtures.test.ts`, browser tests   | Only explicit global context is initially hidden; view filters do not delete data; intentional scope edits preserve siblings                                          |
| Rendering and safety           | `math.test.ts`, browser tests                             | Local KaTeX, inert imported HTML, untrusted TeX disabled, raw formula fallback, no external content requests in exercised workflows                                   |
| Canvas and inspection          | viewport/navigation unit tests and browser suites         | Fixed positions during selection, independent camera/inspector state, complete statements, searchable hidden/isolated objects, keyboard and narrow-screen interaction |
| PDF                            | PDF planning and browser suites                           | Full visible bounds independent of pan/zoom; readable tiling; controls excluded; retry after export failure                                                           |
| Deployment                     | CI and manual Pages workflow                              | Locked installation, unit/type/build/browser gates, correct base path, worker/fonts and canonical artifacts served from production output                             |

Fixtures and their limitations are documented in [tests/fixtures/README.md](../tests/fixtures/README.md). The 150-node case is a correctness smoke test with a 20-second test timeout, not a measured capacity or usability claim. Existing browser tests also exercise a larger synthetic search case.

## Manual release checks

After publication, check the live entry point and the worker, CSS, JavaScript, fonts, schema and synthetic example paths. Keep mathematical import/browser interaction tests local. Confirm the initial empty state, import a synthetic graph locally, inspect an original statement and evidence, search an isolated appendix object, and inspect a downloaded PDF. Ensure no imported content is committed or emitted as a public asset.

Physical trackpad behavior, Safari/Firefox, screen-reader workflows, dense graph readability and real-paper fidelity require separate review. Structural validation and green software tests do not establish mathematical correctness. Record actual failures and environments; do not fabricate benchmark scores.

## Failure handling

Treat object/relationship loss, reversed canonical edges, changed provenance/status, or private-content transmission as release blockers. For an invalid import, verify the accepted graph stays unchanged. Distinguish application failures from unavailable browsers, occupied ports and stopped preview servers; rerun only after resolving the identified condition. Preserve local traces when useful and report unverified behavior explicitly.
