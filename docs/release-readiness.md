# ReadonlyView 2.0 release readiness

Status: alpha implementation complete; main-branch CI and npm trusted-publisher configuration remain external release prerequisites. No package or website was published by this work.

## 1. Architecture

Each `readonlyView` call creates an independent WeakMap-backed membrane. Controlled extensible shadow targets preserve proxy invariants without modifying sources. Values are wrapped lazily, identity is stable inside a membrane, and Map, Set, and Date use narrow native adapters.

## 2. Public API

The package exports `readonlyView`, `isReadonlyView`, `DirectMutationError`, `UnsupportedTypeError`, and the type-only `DeepReadonly`. The exports map blocks private subpaths.

## 3. Breaking changes

The package is now `@nipe-solutions/readonly-view`. Version 1's wrapper, `.value`, `internalSet`, validation, deep merge, lifecycle, default export, and state-manager positioning are removed.

## 4. Supported types

Primitives, plain and null-prototype objects, arrays and tuples, Map, Set, Date, functions with documented semantics, public-state custom classes, circular graphs, shared references, symbols, and accessors are supported.

## 5. Explicitly unsupported types

RegExp, Error, URL, URLSearchParams, ArrayBuffer, SharedArrayBuffer, DataView, typed arrays, WeakMap, WeakSet, and Promise throw `UnsupportedTypeError`. Consumer proxies are accepted under the documented trust limitation.

## 6. Important semantic decisions

Separate top-level calls create separate membranes; passing an existing view returns it unchanged. Collection keys from the same membrane are privately translated for lookup. Prototype reflection returns protected views, so custom-class `instanceof` is intentionally false. Private-field brand checks may fail. Independently captured mutable references and getter/function side effects are outside the boundary.

## 7. Tests

The local suite currently contains 72 runtime tests across 21 files, plus strict compile-time tests. It covers mutation routes, descriptors, frozen/sealed/non-extensible values, liveness, identity, cycles, native adapters, randomized graphs, documentation examples, and regression cases from the final independent review. Coverage evidence: 91.34% statements, 89.11% branches, 93.10% functions, and 96.41% lines.

## 8. Package and build

Vite emits ES2022 ESM and CommonJS builds; TypeScript plus Rollup emits one declaration entry. The real six-file npm tarball is installed into an isolated consumer and exercised through ESM, CommonJS, strict TypeScript, esbuild, tree shaking, and blocked private imports. Runtime dependencies: zero.

## 9. CI and release

CI runs the Node 24 quality gate, Node 22 compatibility, and Chromium/Firefox/WebKit jobs. Release is manual, main-only, exact-confirmation gated, environment protected, checks version/channel policy and registry availability, repeats quality and browsers, uses npm OIDC trusted publishing, waits for propagation, then creates a GitHub release. Repository-side npm trusted-publisher and environment-reviewer settings must be configured before use.

## 10. Documentation

The repository contains a rewritten README, API, guarantees, compatibility, supported-types, architecture, security/trust, performance, migration, FAQ, contribution, release, security-policy, changelog, and five decision records. The framework-free documentation website mirrors these semantics and has interactive runtime examples and responsive browser tests.

## 11. Size

Current measured artifacts: minified ESM 5,807 B (7,000 B budget), minified+gzip ESM 1,900 B (2,500 B), declarations 2,026 B (2,500 B), packed tarball 6,521 B (10,000 B).

## 12. Benchmark summary

On Node 24.20.0, macOS arm64, 100,000 iterations measured: view creation 26.20 ms, first nested access 77.04 ms, repeated nested read 15.38 ms, deep read 23.52 ms, array iteration 1,484.39 ms, Map read 20.69 ms, Set iteration 40.86 ms, and Date read 15.41 ms. These are diagnostic local results, not marketing claims; see the methodology for caveats.

## 13. Known limitations

ReadonlyView is not a sandbox. Generic/overloaded callable types cannot always be transformed without losing signature information. Custom class views do not preserve `instanceof`; private fields can reject proxy receivers. Cross-realm and consumer-proxy behavior is limited by the supplied realm/proxy. WebKit could not launch under the local macOS 14 Playwright bundle and must be proven by the Linux CI job.

## 14. Recommended follow-up

Run the branch on GitHub Actions, configure the npm trusted publisher and protected `npm` environment, decide the final alpha/stable version, promote `Unreleased` changelog notes, and only then invoke the manual release workflow. Bun, Deno, older TypeScript, and additional native adapters should be claimed only after dedicated CI.

## Local verification

```bash
npm ci
npm run release:check
npm run test:browser
npm run coverage
npm run benchmark
```
