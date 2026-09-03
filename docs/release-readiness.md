# ReadonlyView 2.0 release readiness

Status: the stable `2.0.0` release candidate passed its complete local gate on
2026-09-03 using macOS 14.6.1 arm64, Node 24.20.0, and npm 11.19.0. Main-branch
CI, Vercel production deployment, the protected `npm` environment, and
first-publication authentication remain external release prerequisites. No
package or website was published by this work.

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

The inspected `.artifacts/nipe-solutions-readonly-view-2.0.0.tgz` is 6,971 B
packed and 33,691 B unpacked. Its SHA-1 is
`de84bb58a5ab30d6cfa3152f26d491e59d5aee82`; npm reported integrity
`sha512-vXQXfQNoO7LeTxFexZxSDY93NUClX04ZRl1CFjH8jCIcBIkwrUGL5uD5wkpMYvX05PMjIv+XefQ8I9LSbcbQmw==`.

## 9. CI and release

CI runs the Node 24 quality gate, Node 22 compatibility, and
Chromium/Firefox/WebKit jobs. Release is manual, main-only, exact-confirmation
gated, environment protected, checks version/channel policy and registry
availability, carries the verified tarball through the browser gate, and waits
for propagation before creating a SHA-targeted GitHub release. The first
publication uses a short-lived granular `NPM_TOKEN` environment secret plus
OIDC provenance. After the package exists, that token must be revoked and
deleted and the documented npm trusted publisher must replace it for future
releases.

The local browser command passed all 22 scheduled tests: 11 on Chromium and 11
on Firefox. Playwright deliberately excluded WebKit on this macOS 14 host under
the repository's documented upstream-compatibility rule; the Linux CI WebKit
job remains required.

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
WebKit is excluded locally on macOS 14 and must be proven by the Linux CI job.

## 14. Recommended follow-up

Push the reviewed branch and open a pull request; require green Node 24 quality,
Node 22 compatibility, Chromium, Firefox, WebKit, and Vercel preview checks.
After merge, require green `main` CI, link the Vercel project, configure the
exact Vercel-provided GoDaddy DNS record, and verify HTTPS plus every production
route. Then configure the protected `npm` environment and short-lived granular
bootstrap token, dispatch the exact stable release, and verify registry
propagation, provenance, dist-tags, consumer import, and the SHA-targeted GitHub
release. Finally revoke and delete the bootstrap token and configure the
documented npm trusted publisher for future OIDC releases. Bun, Deno, older
TypeScript, and additional native adapters should be claimed only after
dedicated CI.

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
