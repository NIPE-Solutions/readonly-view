# ReadonlyView release readiness

This record deliberately separates the released `2.0.0` baseline from the
unpublished `2.0.1` hardening candidate. Evidence or guarantees in one section
must not be attributed to the other version.

Delivery order: release and verify the native-hardening candidate first. Do not
merge `docs/product-story-final`, deploy its hardening-specific site/README
claims, or post its marketing drafts until
`npm view @nipe-solutions/readonly-view@2.0.1 version` and
`npm view @nipe-solutions/readonly-view dist-tags.latest` both return `2.0.1`.
This records a required handoff order; it does not state that `2.0.1` is
published.

## Released baseline: 2.0.0

### Public release evidence

Version `2.0.0` is released, not a release candidate. Registry and GitHub checks
on 2026-09-04 established that:

- npm reports package version `2.0.0` and the `latest` dist-tag points to
  `2.0.0`; npm records publication at `2026-09-03T22:01:04.084Z`.
- The public tarball is
  `https://registry.npmjs.org/@nipe-solutions/readonly-view/-/readonly-view-2.0.0.tgz`.
  It is 7,018 B downloaded and 33,691 B unpacked, contains seven files, has
  SHA-1 `9463b4d177b3dfbb088306b73afb92240d1eb2ac`, and npm integrity
  `sha512-WqdJb4ZZayPgtgngLM1SpwUXar7T4CNyypjJikecqn7kT0govmugnKej0Fce2AnYFWuFaNsENASH6mwWJfWx4w==`.
- GitHub release `v2.0.0` is public and targets commit
  `251b0c9e86740a681c50426569c50651290db140`.
- The production home page, four legal routes, `/robots.txt`, and
  `/sitemap.xml` all returned HTTP 200 over HTTPS.

The initial publication and bootstrap-token revocation are complete. The
current release workflow uses npm trusted publishing with short-lived OIDC
credentials and stores no npm token secret.

### Historical 2.0.0 validation

The 2.0.0 local release gate ran on 2026-09-03 using macOS 14.6.1 arm64, Node
24.20.0, and npm 11.19.0. It passed 77 runtime tests across 21 files and the
strict compile-time suite. The package boundary passed five additional tests:
one packed-consumer test and four registry-classification tests. A fresh
coverage run over the 77 runtime tests measured 91.34% statements, 89.11%
branches, 93.10% functions, and 96.41% lines.

The local browser run passed all 22 scheduled tests: 11 on Chromium and 11 on
Firefox. WebKit was excluded on the macOS 14 host under the documented upstream
compatibility rule; the Linux CI WebKit job remained the hosted requirement.

The 2.0.0 benchmark on the same host measured 100,000 iterations: view creation
26.90 ms, first nested access 77.62 ms, repeated nested read 15.34 ms, deep read
23.88 ms, array iteration 1,446.00 ms, Map read 20.00 ms, Set iteration 40.35
ms, and Date read 16.05 ms. These are diagnostic local results, not marketing
claims.

### 2.0.0 contract boundary

The fail-closed Map, Set, and Date inventories, protected ES2025 Set results,
IteratorClose hardening, Date secondary-dispatch protection, and the corrected
`Set#forEach` callback type described below are **not** claimed for 2.0.0.

## Unpublished candidate: 2.0.1

Status on 2026-09-04: `2.0.1` is a local hardening candidate. It has not been
published, npm `latest` still resolves to `2.0.0`, and no `v2.0.1` release is
claimed here.

### Hardening contract introduced by 2.0.1

The following guarantees apply only to the 2.0.1 candidate and to a future
published 2.0.1 containing these commits:

- Map, Set, and Date use explicit native-member inventories and fail closed for
  unknown members reached on their intrinsic prototypes.
- The proposed Map mutators `getOrInsert` and `getOrInsertComputed` are rejected
  before invocation.
- Current Set composition and relation methods accept readonly set-like
  operands. Composition returns remain protected readonly views, including when
  composition is reached through the third `Set#forEach` callback argument.
- Set operand iteration forwards IteratorClose, including the original `return`
  receiver and error.
- Date secondary dispatch through `toJSON` and `Symbol.toPrimitive` remains on
  the protected path.

These guarantees assume untampered intrinsics and do not turn ReadonlyView into
a sandbox.

The dependent product-story work expands the README, website, use-case, and API
content without further runtime or package-export changes. It must not merge or
deploy until this candidate is published and verified as `2.0.1`; that work did
not publish a new npm release.

### Current local candidate evidence

The following evidence was collected from this 2.0.1 worktree on 2026-09-04
using Node 24.20.0 and npm 11.19.0:

- `npm run test:unit`: 99 tests passed across 23 files.
- `npm run test:types`: the strict compile-time suite passed, including the
  ES2025 `Set#forEach` callback composition regression.
- `npm run release:check`: the complete local release gate passed, including
  formatting, lint, source typechecking, package and website checks, benchmark
  smoke, release metadata verification, and artifact creation.
- `npm run test:size`: minified ESM 9,195/10,000 B, minified+gzip ESM
  2,725/3,000 B, declarations 3,188/3,500 B, and packed tarball 8,626/12,000 B.
- `npm run package:artifact`: produced
  `.artifacts/nipe-solutions-readonly-view-2.0.1.tgz`, 8,626 B packed and 48,867
  B unpacked, with SHA-1 `550e7581c850b1b3afd28a7db4114668e37b3252`.
- The candidate tarball contains exactly `CHANGELOG.md`, `LICENSE`, `README.md`,
  `package.json`, `dist/index.js`, `dist/index.cjs`, and `dist/index.d.ts`.
  Runtime dependencies remain zero.
- A direct registry query for `@nipe-solutions/readonly-view@2.0.1` returned npm
  `E404`; `latest` remained `2.0.0`.

This is local candidate evidence, not publication evidence. Rebuilding after a
source or package-content change invalidates the recorded artifact hash and
requires fresh measurements.

### Pre-publication local confirmation

The candidate gate passed in this worktree. Repeat the complete gate on the
reviewed `main` commit before publication:

```bash
npm ci
npm run release:check
npm run test:browser
npm run coverage
npm run benchmark
npm pack --dry-run --json
tar -tzf .artifacts/nipe-solutions-readonly-view-2.0.1.tgz
```

`release:check` includes formatting, lint, source typechecking, the 99-test unit
suite, compile-time tests, size limits, packed-consumer and registry-classifier
tests, website verification, benchmark smoke, release metadata verification,
and creation of the candidate tarball.

### Hosted prerequisites

Do not publish 2.0.1 until all of these conditions hold for the reviewed commit:

1. Merge the reviewed hardening change to `main` and require green Node 24
   quality, Node 22 compatibility, Chromium, Firefox, WebKit, and Vercel preview
   checks.
2. Require green `main` CI. Verify the production Vercel deployment and every
   HTTPS route: `/`, `/privacy/`, `/impressum/`, `/de/datenschutz/`,
   `/de/impressum/`, `/robots.txt`, and `/sitemap.xml`.
3. Confirm the protected GitHub environment is `npm`, is limited to `main`, and
   requires review. Confirm npm trusts repository
   `NIPE-Solutions/readonly-view`, workflow `release.yml`, and environment `npm`.
4. Confirm `npm view @nipe-solutions/readonly-view@2.0.1 version` returns a real
   npm `E404`. Authentication, network, and registry-server failures are not
   evidence that the version is available.

### Patch-release procedure

From the reviewed `main` commit, dispatch the protected workflow with the exact
stable-release inputs:

```bash
version=2.0.1
channel=latest
gh workflow run release.yml --ref main \
  -f version="$version" \
  -f channel="$channel" \
  -f "confirmation=publish $version with $channel"
```

Approve the `npm` environment deployment. The workflow must carry the single
artifact from verification through browser testing, reconfirm registry absence,
publish those exact bytes with OIDC provenance, wait for registry propagation,
and only then create GitHub release `v2.0.1` at the immutable workflow commit.
There is no bootstrap-token step for 2.0.1.

After publication, verify npm metadata, `latest`, provenance attestation, an
exact-version install in a temporary consumer, every production HTTPS route,
and the GitHub release target. Only after those checks may this section be
changed from “unpublished candidate” to “released.”

## Shared 2.0 product record

### Architecture and public API

Each `readonlyView` call creates an independent WeakMap-backed membrane.
Controlled extensible shadow targets preserve proxy invariants without modifying
sources. Values are wrapped lazily and identity is stable inside a membrane.

The package exports `readonlyView`, `isReadonlyView`, `DirectMutationError`,
`UnsupportedTypeError`, and the type-only `DeepReadonly`. The exports map blocks
private subpaths. Vite emits ES2022 ESM and CommonJS builds; TypeScript plus
Rollup emits one declaration entry.

### Breaking changes and supported values

The package is now `@nipe-solutions/readonly-view`. Version 1's wrapper,
`.value`, `internalSet`, validation, deep merge, lifecycle, default export, and
state-manager positioning are removed.

Primitives, plain and null-prototype objects, arrays and tuples, Map, Set, Date,
functions with documented semantics, public-state custom classes, circular
graphs, shared references, symbols, and accessors are supported.

RegExp, Error, URL, URLSearchParams, ArrayBuffer, SharedArrayBuffer, DataView,
typed arrays, WeakMap, WeakSet, and Promise throw `UnsupportedTypeError`.
Consumer proxies are accepted under the documented trust limitation.

### Semantic decisions and limitations

Separate top-level calls create separate membranes; passing an existing view
returns it unchanged. Collection keys from the same membrane are privately
translated for lookup. Prototype reflection returns protected views, so
custom-class `instanceof` is intentionally false. Private-field brand checks may
fail. Independently captured mutable references and getter/function side effects
are outside the boundary.

ReadonlyView is not a sandbox. Generic or overloaded callable types cannot
always be transformed without losing signature information. Cross-realm and
consumer-proxy behavior is limited by the supplied realm or proxy. Bun, Deno,
older TypeScript, and additional native adapters must not be claimed without
dedicated CI.
