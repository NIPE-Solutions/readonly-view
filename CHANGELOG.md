# Changelog

## Unreleased

## 2.0.1 - 2026-09-04

### Fixed

- Replaced open-ended Map, Set, and Date native-method dispatch with explicit,
  fail-closed member inventories.
- Blocked `Map.prototype.getOrInsert` and `getOrInsertComputed` where available.
- Added readonly modern Set composition and relation operations, including
  protected results, set-like operands, iterator cleanup, and aligned types.
- Prevented Date conversion methods from redispatching to source-owned method
  overrides with a mutable receiver.
- Added native prototype inventory tests so new platform methods require an
  explicit safety classification.

## 2.0.0 - 2026-09-03

### Breaking Changes

- Renamed `immuview` to `@nipe-solutions/readonly-view`.
- Replaced `readonly(...).value` with `readonlyView(...)`.
- Removed `internalSet`, validation, deep merge, mutation lifecycle, default export, and public internals.

### Added

- Deep, lazy, live readonly membrane and `DeepReadonly<T>`.
- Explicit object, array, Map, Set, Date, function, class, symbol, accessor, cycle, and shared-identity semantics.
- Dual ESM/CommonJS package, packed consumers, browser matrix, size budgets, benchmarks, docs site, and guarded provenance release preparation.

### Fixed

- Shadow targets prevent non-configurable properties leaking mutable children.
- Native collections and Date use valid internal-slot receivers.
- User methods receive readonly `this`.

### Performance

- Nested wrapping is lazy and WeakMap-cached.

### Documentation

- Rewritten around readonly-view ownership.
