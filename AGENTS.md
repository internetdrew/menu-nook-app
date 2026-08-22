# Project Instructions

## Testing Policy

- Keep tests centralized under `src/routes`.
- Do not add component, shared schema, utility, or implementation-detail tests.
- Test user-observable behavior through route-level tests.
- Extend existing `src/routes/*.test.tsx` patterns when adding coverage.
- Do not scatter tests next to components, shared modules, or server utilities unless explicitly requested.
- When testing configured limits, import the real product constants instead of duplicating numeric values in the test.
- Use realistic user-facing input text in route tests. Avoid synthetic strings like `"A".repeat(...)` unless repeated content is the clearest way to express the behavior.

## Verification

- For UI behavior changes, prefer the narrowest relevant route test.
- Run `npm run test -- src/routes/<file>.test.tsx` for focused route coverage.
- Run `npm run build` when changes touch TypeScript contracts, shared validation, routing, or production code paths.
