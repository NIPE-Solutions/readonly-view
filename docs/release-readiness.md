# ReadonlyView 2.0 release readiness

Status: **STABLE READY and released.** `2.0.0` passed its complete local gate on
2026-09-03 using macOS 14.6.1 arm64, Node 24.20.0, and npm 11.19.0. It was
published publicly with provenance, released on GitHub, and deployed to the
production documentation origin. The subsequent trusted-publishing update is
merged to `main`, whose full CI matrix is green.

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

The release-candidate run passed 77 runtime tests across 21 files and the strict
compile-time suite. The package boundary run passed five more tests: one real
packed-consumer test and four unpublished-registry classification tests. It
covers mutation routes, descriptors, frozen/sealed/non-extensible values,
liveness, identity, cycles, native adapters, randomized graphs, documentation
examples, and regression cases from the final independent review. A fresh
coverage run passed the same 77 tests and measured 91.34% statements, 89.11%
branches, 93.10% functions, and 96.41% lines.

## 8. Package and build

Vite emits ES2022 ESM and CommonJS builds; TypeScript plus Rollup emits one
declaration entry. The exact seven-file npm tarball contains `CHANGELOG.md`,
`LICENSE`, `README.md`, `package.json`, `dist/index.js`, `dist/index.cjs`, and
`dist/index.d.ts`. It contains no tests, website source, benchmarks, source
maps, or private modules. The tarball is installed into an isolated consumer
and exercised through ESM, CommonJS, strict TypeScript, esbuild, tree shaking,
and blocked private imports. Runtime dependencies: zero.

The release-candidate `.artifacts/nipe-solutions-readonly-view-2.0.0.tgz` was
6,971 B packed and 33,691 B unpacked. The public registry reports the same
seven-file manifest and 33,691 B unpacked, SHA-1
`9463b4d177b3dfbb088306b73afb92240d1eb2ac`, and integrity
`sha512-WqdJb4ZZayPgtgngLM1SpwUXar7T4CNyypjJikecqn7kT0govmugnKej0Fce2AnYFWuFaNsENASH6mwWJfWx4w==`.

## 9. CI and release

CI runs the Node 24 quality gate, Node 22 compatibility, and
Chromium/Firefox/WebKit jobs. Release is manual, main-only, exact-confirmation
gated, environment protected, checks version/channel policy and registry
availability, carries the verified tarball through the browser gate, and waits
for propagation before creating a SHA-targeted GitHub release. The initial
publication used a short-lived granular token plus OIDC provenance. That
bootstrap token and its GitHub secret were revoked after publication. Future
releases use the configured npm trusted publisher and short-lived OIDC
credentials only.

`@nipe-solutions/readonly-view@2.0.0` is public under `latest`. Its npm
attestation reports SLSA provenance. GitHub release `v2.0.0` targets the
reviewed release commit `251b0c9e86740a681c50426569c50651290db140`. The first
release workflow published successfully but timed out while polling registry
propagation, so the SHA-targeted GitHub release was completed separately after
the registry became available. This did not change the published artifact.

The local browser command passed all 22 scheduled tests: 11 on Chromium and 11
on Firefox. Playwright deliberately excluded WebKit on this macOS 14 host under
the repository's documented upstream-compatibility rule. Linux CI subsequently
passed Chromium, Firefox, and WebKit together with the Node 24 quality and Node
22 compatibility jobs.

## 10. Documentation

The repository contains a rewritten README, API, guarantees, compatibility, supported-types, architecture, security/trust, performance, migration, FAQ, contribution, release, security-policy, changelog, and five decision records. The framework-free documentation website mirrors these semantics and has interactive runtime examples and responsive browser tests.

## 11. Size

Release-candidate measurements: minified ESM 5,807 B (7,000 B budget),
minified+gzip ESM 1,900 B (2,500 B), declarations 2,026 B (2,500 B), packed
tarball 6,971 B (10,000 B), and unpacked tarball 33,691 B.

## 12. Benchmark summary

On Node 24.20.0, macOS arm64, 100,000 iterations measured: view creation 26.90
ms, first nested access 77.62 ms, repeated nested read 15.34 ms, deep read 23.88
ms, array iteration 1,446.00 ms, Map read 20.00 ms, Set iteration 40.35 ms, and
Date read 16.05 ms. The required 100-iteration benchmark smoke also passed as
part of `release:check`. These are diagnostic local results, not marketing
claims; see the methodology for caveats.

## 13. Known limitations

ReadonlyView is not a sandbox. Generic/overloaded callable types cannot always
be transformed without losing signature information. Custom class views do
not preserve `instanceof`; private fields can reject proxy receivers.
Cross-realm and consumer-proxy behavior is limited by the supplied realm/proxy.
WebKit is excluded locally on macOS 14 and is therefore verified in Linux CI.

## 14. Release evidence and remaining scope

- Production documentation: <https://readonly-view.nipesolutions.com>
- npm: <https://www.npmjs.com/package/@nipe-solutions/readonly-view/v/2.0.0>
- GitHub release: <https://github.com/NIPE-Solutions/readonly-view/releases/tag/v2.0.0>
- Green post-release `main` CI: <https://github.com/NIPE-Solutions/readonly-view/actions/runs/33813908218>
- Production Vercel deployment: commit
  `962e6a00778ba83a24f303b6fd3fd3b0e90d8b6a`

No blocker remains for `2.0.0`. Bun, Deno, older TypeScript, and additional
native adapters remain deliberately unclaimed until they receive dedicated CI.

## Local verification

```bash
npm ci
npm run release:check
npm run test:browser
npm run coverage
npm run benchmark
npm pack --dry-run --json
tar -tzf .artifacts/nipe-solutions-readonly-view-2.0.0.tgz
```
