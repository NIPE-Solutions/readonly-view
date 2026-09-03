# Changelog

## Unreleased

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

## 2.0.0

Prepared but not released. Promote Unreleased notes when publishing.
