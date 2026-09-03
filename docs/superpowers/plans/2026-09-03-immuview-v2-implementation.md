# ImmuView v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ImmuView as a production-grade, deeply readonly, lazy, live JavaScript membrane with a minimal API, verified package, documentation website, and release-ready automation.

**Architecture:** Each `readonlyView` call owns a WeakMap-backed membrane that maps sources to invariant-safe shadow proxies and maps views back to sources. Generic objects/functions and dedicated Array, Map, Set, and Date adapters delegate reads live, wrap every exposed supported value, and reject every mutation route; unsupported built-ins fail lazily and explicitly.

**Tech Stack:** Node.js 24 LTS, TypeScript, Vite, Vitest, fast-check, ESLint flat config, Prettier, Playwright, esbuild, npm, vanilla TypeScript/CSS documentation site.

**Spec:** `docs/superpowers/specs/2026-09-03-immuview-v2-design.md`

## Global Constraints

- Package identity remains `immuview`; development version is `2.0.0-alpha.0`; do not publish.
- Runtime support is Node.js 22 and 24 plus current evergreen Chromium, Firefox, and WebKit; development and release use Node.js 24 LTS.
- Runtime dependency count is exactly zero.
- Public exports are exactly `readonlyView`, `isReadonlyView`, `DirectMutationError`, `UnsupportedTypeError`, and `DeepReadonly`.
- ImmuView never intentionally mutates, freezes, seals, prevents extensions on, serializes, or eagerly traverses a source.
- Separate top-level calls create separate membranes; identity is stable inside a membrane; passing an existing view is idempotent.
- Direct source proxies remain subject to the documented trust limitation.
- Unsupported built-ins throw `UnsupportedTypeError` when first reached.
- Runtime behavior follows red-green-refactor; configuration and generated-output tasks are verified immediately.
- Preserve v1 tags and history; remove the v1 API without a compatibility layer.

---

### Task 1: Modern toolchain and repository skeleton

**Files:**
- Modify: `package.json`
- Replace: `package-lock.json`, `tsconfig.json`
- Create: `.nvmrc`, `tsconfig.build.json`, `vite.config.ts`, `vitest.config.ts`, `eslint.config.js`, `.prettierignore`, `test/setup.ts`
- Remove: `jest.config.js`, `.eslintrc.js`, `.prettierrc`, `.npmignore`

**Interfaces:**
- Consumes: Node.js 24 and npm.
- Produces: strict TypeScript, Vitest projects, dual-format build commands, and format/lint/type/test scripts.

- [ ] **Step 1: Replace package metadata and scripts**

Set version `2.0.0-alpha.0`, `type: "module"`, `engines.node: ">=22 <25"`, zero runtime dependencies, and:

```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "sideEffects": false
}
```

Install current mutually compatible TypeScript, Vite, Vitest/coverage, ESLint flat-config packages, typescript-eslint, Prettier, fast-check, Playwright, esbuild, and Node types as dev dependencies.

- [ ] **Step 2: Configure strict compilation and tests**

Use ES2022, Bundler resolution, `strict`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `useUnknownInCatchVariables`, `verbatimModuleSyntax`, and `skipLibCheck: false`. Configure Vitest for `test/unit`, `test/integration`, and `test/regression`.

- [ ] **Step 3: Install and verify the harness**

Run:

```bash
npm install
npm outdated || true
npm ls --depth=0
npm run format:check
npm run lint
npm run typecheck
npm run test:unit -- --passWithNoTests
```

Expected: all validation commands exit 0 and no Jest reference remains.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .nvmrc tsconfig.json tsconfig.build.json vite.config.ts vitest.config.ts eslint.config.js .prettierignore test/setup.ts
git add -u
git commit -m "build: modernize the v2 toolchain"
```

### Task 2: Public types and error contract

**Files:**
- Create: `src/public-types.ts`, `src/errors.ts`, `test/types/deep-readonly.test-d.ts`, `test/unit/errors.test.ts`
- Replace: `src/index.ts`
- Remove: `src/ImmuView.ts`, `src/ImmuView.unit.spec.ts`

**Interfaces:**
- Consumes: strict compiler.
- Produces: `DeepReadonly<T>`, errors, and exact root exports; runtime functions may temporarily throw until Task 3.

- [ ] **Step 1: Write failing compile-time tests**

Cover primitives, nullability, symbols, unions, recursion, arrays, labeled/optional/rest tuples, Map, ReadonlyMap, Set, ReadonlySet, Date setter absence, and call signatures:

```ts
declare const view: DeepReadonly<{
  tuple: [number, { value: string }]
  map: Map<{ id: number }, { value: string }>
  date: Date
}>
// @ts-expect-error deeply readonly
view.tuple[1].value = 'changed'
// @ts-expect-error readonly collection
view.map.set({ id: 1 }, { value: 'x' })
// @ts-expect-error readonly Date
view.date.setTime(0)
```

Run `npm run test:types`; expect missing-type failures.

- [ ] **Step 2: Implement the public type**

Implement a distributive conditional in this order: primitives, functions, Date structural reader, tuple/array, Map, Set, object mapped type. Keep helper types private.

- [ ] **Step 3: Write failing error tests**

Assert `instanceof`, `name`, safe message, `operation`, optional `property`, and `objectKind` for `DirectMutationError`; assert kind metadata for `UnsupportedTypeError`. Include symbol properties and prove no source serialization.

- [ ] **Step 4: Implement errors and exports**

Use:

```ts
new DirectMutationError({
  operation: 'set',
  property: 'name',
  objectKind: 'Object',
})
new UnsupportedTypeError('RegExp')
```

Do not retain source objects.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:types
npm run test:unit -- test/unit/errors.test.ts
npm run build:dist
git add src test
git add -u
git commit -m "feat: define the v2 public contract"
```

Expected: declarations expose only the five approved exports and no internal helper.

### Task 3: Live object membrane and invariant-safe reflection

**Files:**
- Create: `src/membrane.ts`, `src/classify.ts`
- Modify: `src/index.ts`
- Create: `test/unit/objects.test.ts`, `test/unit/reflection.test.ts`, `test/regression/proxy-invariants.test.ts`, `test/integration/identity.test.ts`, `test/integration/source-integrity.test.ts`

**Interfaces:**
- Consumes: public types/errors.
- Produces: `createMembrane().wrap`, `readonlyView`, `isReadonlyView`, source-to-view and view-to-source WeakMap metadata.

- [ ] **Step 1: Write failing root/liveness/identity tests**

Test primitives unchanged, separate membranes unequal, existing-view idempotence, no eager getter invocation, source replace/add/delete visibility, cycles, and shared references. Run targeted tests and confirm failure from the missing implementation.

- [ ] **Step 2: Implement minimal registration and `get`**

Use:

```ts
interface Membrane {
  wrap<T>(value: T): DeepReadonly<T>
  unwrapSameMembrane(value: unknown): unknown
}
```

Create one extensible object-shaped shadow, register it before return, and only wrap a nested value from a trap.

- [ ] **Step 3: Write failing reflection/invariant tests**

Test keys, values, entries, names, symbols, descriptors, `Reflect.ownKeys/get/has`, `in`, `for...in`, spread, destructuring, null/custom prototypes, `instanceof`, and descriptor values. Include frozen/sealed/non-extensible sources and non-configurable/non-writable nested values.

- [ ] **Step 4: Implement reflection traps**

Add intentional `getOwnPropertyDescriptor`, `ownKeys`, `has`, and `getPrototypeOf`. Virtualize descriptors onto the extensible shadow, wrap data values, preserve accessor functions safely, and never invoke getters during enumeration.

- [ ] **Step 5: Write failing mutation-route tests**

Cover assignment, nested assignment, delete, defineProperty, Object.assign, all relevant Reflect operations, setPrototypeOf, preventExtensions, and symbol keys.

- [ ] **Step 6: Implement rejecting mutation traps**

All routes throw a shared `DirectMutationError` helper; none forwards or returns false.

- [ ] **Step 7: Verify source integrity and commit**

```bash
npm run test:unit -- test/unit/objects.test.ts test/unit/reflection.test.ts test/regression/proxy-invariants.test.ts test/integration/identity.test.ts test/integration/source-integrity.test.ts
git add src test
git commit -m "feat: add the invariant-safe live object membrane"
```

Expected: descriptor/prototype/extensibility snapshots remain byte-for-byte equivalent before and after creation/reads.

### Task 4: Functions, accessors, and custom classes

**Files:**
- Create: `src/functions.ts`
- Modify: `src/membrane.ts`
- Create: `test/unit/functions.test.ts`, `test/unit/accessors.test.ts`, `test/unit/classes.test.ts`, `test/regression/method-escape.test.ts`

**Interfaces:**
- Consumes: membrane wrap and private metadata.
- Produces: callable shadows with readonly view receivers and wrapped results.

- [ ] **Step 1: Write failing method tests**

Test `this.count++` throws without source change, read methods work, closure mutation remains possible, detached calls preserve JS semantics, function-owned objects are wrapped, and repeated reads preserve identity.

- [ ] **Step 2: Implement callable/construct traps**

If `thisArg` is a known view, keep it readonly; otherwise preserve the explicit receiver. Wrap returned objects. Construct with `Reflect.construct` only for constructable sources and wrap the result.

- [ ] **Step 3: Write failing accessor/class tests**

Test getters receive readonly `this`, returned values are wrapped, enumeration does not invoke getters, setters are blocked, prototypes and `instanceof` work, public class writes fail, and private-brand access rejects without mutable rebinding.

- [ ] **Step 4: Implement accessor/class semantics**

Use `Reflect.get(source, key, receiver)`. Descriptor accessors must not expose source-bound mutable receivers. Unknown custom prototypes use this generic path.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:unit -- test/unit/functions.test.ts test/unit/accessors.test.ts test/unit/classes.test.ts test/regression/method-escape.test.ts
git add src test
git commit -m "feat: secure functions accessors and class receivers"
```

### Task 5: Arrays and tuple fidelity

**Files:**
- Create: `src/builtins/array.ts`
- Modify: `src/membrane.ts`, `test/types/deep-readonly.test-d.ts`
- Create: `test/unit/arrays.test.ts`, `test/regression/array-escapes.test.ts`

**Interfaces:**
- Consumes: membrane/callable behavior.
- Produces: an array shadow for which `Array.isArray(view)` is true.

- [ ] **Step 1: Write failing array read/mutation tests**

Cover live indexes/length/holes, symbols, iteration, all listed non-mutating methods, nested outputs, and every mutator: copyWithin, fill, pop, push, reverse, shift, sort, splice, unshift. Cover index/delete/length writes.

- [ ] **Step 2: Run and confirm array length/invariant failures**

Run `npm run test:unit -- test/unit/arrays.test.ts test/regression/array-escapes.test.ts`.

- [ ] **Step 3: Implement the array adapter**

Use `[]` as shadow, report its unavoidable non-configurable `length` compatibly, delegate live reads, reject the exact mutator set, and operate non-mutating methods against the view so callback values are protected.

- [ ] **Step 4: Extend compile tests**

Cover labeled, optional, readonly, variadic, and nested tuples; verify fixed positions/rest values are deeply readonly.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:unit -- test/unit/arrays.test.ts test/regression/array-escapes.test.ts
npm run test:types
git add src test
git commit -m "feat: add invariant-safe readonly arrays"
```

### Task 6: Map and Set adapters

**Files:**
- Create: `src/builtins/map.ts`, `src/builtins/set.ts`
- Modify: `src/membrane.ts`
- Create: `test/unit/map.test.ts`, `test/unit/set.test.ts`, `test/integration/collection-identity.test.ts`, `test/regression/collection-escapes.test.ts`

**Interfaces:**
- Consumes: `wrap`, `unwrapSameMembrane`.
- Produces: protected collection reads/iteration/callbacks and rejected mutators.

- [ ] **Step 1: Write failing Map tests**

Cover size/get/has/keys/values/entries/iterator/forEach, source-side changes, wrapped keys/values, same-membrane view lookup, callback collection, and stable methods.

- [ ] **Step 2: Write failing Set tests**

Cover size/has/keys/values/entries/iterator/forEach, source-side changes, wrapped values, same-membrane lookup, callback collection, and stable methods.

- [ ] **Step 3: Run and confirm native receiver failures**

Run targeted collection tests; expect internal-slot receiver errors or missing behavior.

- [ ] **Step 4: Implement lazy adapters**

Iterators wrap on each `next()`; Map entries return `[wrap(key), wrap(value)]`; callbacks receive wrapped arguments and the view. Translate only recognized same-membrane views for get/has.

- [ ] **Step 5: Write and satisfy collection escape tests**

Test extracted set/add/delete/clear functions plus every iterator/callback/descriptor path; source snapshots must remain unchanged after rejection.

- [ ] **Step 6: Verify and commit**

```bash
npm run test:unit -- test/unit/map.test.ts test/unit/set.test.ts test/integration/collection-identity.test.ts test/regression/collection-escapes.test.ts
git add src test
git commit -m "feat: add readonly Map and Set adapters"
```

### Task 7: Date and unsupported values

**Files:**
- Create: `src/builtins/date.ts`
- Modify: `src/classify.ts`, `src/membrane.ts`
- Create: `test/unit/date.test.ts`, `test/unit/unsupported.test.ts`, `test/regression/date-mutators.test.ts`, `test/integration/existing-proxy.test.ts`

**Interfaces:**
- Consumes: wrapping/errors.
- Produces: complete Date semantics and conservative known-built-in rejection.

- [ ] **Step 1: Write failing Date tests**

Test all common local/UTC reads, conversions, method identity, source-side mutation visibility, and every runtime Date setter including deprecated `setYear` when present.

- [ ] **Step 2: Implement centralized Date classification**

Bind only safe reads to the source internal-slot receiver. Every name classified as a Date setter returns a rejecting function. Keep the list exhaustive and test-generated.

- [ ] **Step 3: Write failing unsupported tests**

Parameterize RegExp, Error, URL, URLSearchParams, ArrayBuffer, SharedArrayBuffer when available, DataView, every TypedArray, WeakMap, WeakSet, Promise, and identifiable native/host objects. Assert root and lazy nested rejection with safe kind metadata.

- [ ] **Step 4: Implement side-effect-minimizing classification**

Use known intrinsic prototypes/constructors with guarded feature detection. Do not read `Symbol.toStringTag` or call `Object.prototype.toString`.

- [ ] **Step 5: Test source proxies**

Use forwarding, throwing, and trap-counting proxies. Assert no unnecessary eager traps and faithful propagation under the trust limitation.

- [ ] **Step 6: Verify and commit**

```bash
npm run test:unit -- test/unit/date.test.ts test/unit/unsupported.test.ts test/regression/date-mutators.test.ts test/integration/existing-proxy.test.ts
git add src test
git commit -m "feat: support Date and reject unsafe built-ins"
```

### Task 8: Adversarial, randomized, and documentation-example tests

**Files:**
- Create: `test/regression/adversarial.test.ts`, `test/regression/property-based.test.ts`, `test/integration/docs-examples.test.ts`, `test/types/docs-examples.ts`, `test/fixtures/graphs.ts`

**Interfaces:**
- Consumes: complete runtime API.
- Produces: broad source-escape, invariant, random-graph, and example-drift confidence.

- [ ] **Step 1: Add deterministic escape-route tests**

Attack nested objects, arrays, Map/Set outputs, descriptors, getters, functions, iterators, callbacks, symbols, spread, and destructuring through every write/reflection route.

- [ ] **Step 2: Prove the regression test can fail**

Temporarily disable wrapping for one iterator route, run its targeted test to see the expected failure, restore the implementation, and rerun green.

- [ ] **Step 3: Add bounded fast-check graphs**

Generate depth-limited objects/arrays/symbols/Map/Set/Date plus shared references and explicit cycles. Assert termination, stable descriptors, identity, no invariant TypeErrors, and no source change after attempted mutation.

- [ ] **Step 4: Mirror documentation examples**

Create runtime and compile-time cases for basic, nested, live, arrays, Maps, Sets, Dates, cycles, identity, and methods.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:unit
npm run test:types
npm run coverage
git add test
git commit -m "test: add adversarial randomized and example coverage"
```

### Task 9: Build and real tarball verification

**Files:**
- Modify: `vite.config.ts`, `tsconfig.build.json`, `package.json`
- Create: `test/package/consumer-esm.mjs`, `test/package/consumer-cjs.cjs`, `test/package/consumer-types.ts`, `test/package/consumer-bundle.mjs`, `test/package/tsconfig.json`, `test/package/verify-package.mjs`, `test/package/verify-package.test.mjs`, `scripts/extract-public-api.mjs`, `scripts/extract-public-api.test.mjs`

**Interfaces:**
- Consumes: root source entry.
- Produces: ESM/CJS/declaration output and packed-artifact consumer checks.

- [ ] **Step 1: Write failing package-contract tests**

Assert allowed tarball files, exact five exports, working ESM/require/types/bundler, tree shaking, metadata, and rejected private imports such as `immuview/src/membrane`.

- [ ] **Step 2: Run `npm run test:package` and confirm failure**

Expected: missing or invalid dist/tarball contract.

- [ ] **Step 3: Finalize dual output**

Vite emits `dist/index.js` and `dist/index.cjs`; TypeScript emits only `dist/index.d.ts`. No runtime dependency is bundled or declared.

- [ ] **Step 4: Implement isolated tarball installation**

Use `npm pack --json`, `mkdtemp`, install the exact tarball with scripts disabled, run ESM/CJS, compile types, bundle with esbuild, reject private paths, then delete only the validated temporary directory.

- [ ] **Step 5: Verify and commit**

```bash
npm run build:dist
npm run test:api
npm run test:package
npm pack --dry-run
git add package.json package-lock.json vite.config.ts tsconfig.build.json scripts test/package
git commit -m "build: verify the real dual-format npm package"
```

### Task 10: Browser matrix

**Files:**
- Create: `playwright.config.ts`, `test/browser/index.html`, `test/browser/browser.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: real built ESM.
- Produces: `npm run test:browser` for Chromium, Firefox, and WebKit.

- [ ] **Step 1: Write the browser semantic harness**

Cover objects, invariant descriptors, arrays, Map, Set, Date, symbols, cycles, shared identity, source liveness, and representative rejected mutations.

- [ ] **Step 2: Run Chromium and confirm wiring failure**

```bash
npx playwright install chromium
npm run test:browser -- --project=chromium
```

- [ ] **Step 3: Configure build/server and three projects**

Use a deterministic localhost port, Playwright `webServer`, trace on first retry, and no touch project because this library has no input UI.

- [ ] **Step 4: Verify and commit**

```bash
npx playwright install chromium firefox webkit
npm run test:browser
git add playwright.config.ts test/browser package.json package-lock.json
git commit -m "test: verify semantics in evergreen browsers"
```

### Task 11: Benchmarks and measured size budgets

**Files:**
- Create: `benchmarks/benchmark.mjs`, `benchmarks/fixtures.mjs`, `benchmarks/README.md`, `scripts/check-bundle-size.mjs`, `scripts/check-bundle-size.test.mjs`, `scripts/size-budget.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: dist/esbuild.
- Produces: `benchmark`, `benchmark:smoke`, `test:size`.

- [ ] **Step 1: Add correct-result benchmark scenarios**

Measure plain access, creation, first/repeated reads, large shallow creation, deep reads, arrays, Map, Set, Date, shallow freeze, and recursive deep freeze. Print runtime/OS/sampling method.

- [ ] **Step 2: Run and document the baseline**

Run `npm run benchmark`; record factual results and tradeoffs in `benchmarks/README.md`.

- [ ] **Step 3: Write failing size checker tests**

Measure minified ESM, gzip, declarations, and packed artifact; verify clear over-budget errors.

- [ ] **Step 4: Set real budgets after measurement**

Choose round limits with reasonable headroom above the measured implementation baseline and record baseline plus limits in `scripts/size-budget.json`.

- [ ] **Step 5: Verify and commit**

```bash
npm run benchmark:smoke
node --test scripts/check-bundle-size.test.mjs
npm run test:size
git add benchmarks scripts package.json package-lock.json
git commit -m "perf: add transparent benchmarks and size budgets"
```

### Task 12: README, architecture, migration, and project docs

**Files:**
- Rename/replace: `Readme.md` -> `README.md`, `LICENCE.md` -> `LICENSE`, `CODEOFCONDUCT.md` -> `CODE_OF_CONDUCT.md`
- Replace: `CONTRIBUTING.md`
- Create: `CHANGELOG.md`, `SECURITY.md`, `docs/architecture.md`, `docs/guarantees.md`, `docs/supported-types.md`, `docs/migration-v1-v2.md`, `docs/performance.md`, `docs/security-and-trust.md`, `docs/RELEASING.md`, and ADRs 0001–0005 for the five approved consequential decisions

**Interfaces:**
- Consumes: actual semantics, scripts, size, benchmark results.
- Produces: precise user/maintainer docs whose examples are tested.

- [ ] **Step 1: Rewrite README**

Lead with the 30-second ownership example, then installation, guarantees, comparisons, supported values, API, performance, documentation, contribution, and license. Remove state-management wording and old badges.

- [ ] **Step 2: Write semantic/architecture docs**

Document mappings, shadows, traps, adapters, identity, descriptors, methods/classes/private fields, unsupported values, proxies, memory, and trust. Cite relevant test paths.

- [ ] **Step 3: Write migration and changelog**

Show exact v1/v2 code; list removal of `.value`, `internalSet`, deep merge, validation, lifecycle, default export, and internals. Keep Unreleased and undated 2.0.0 preparation.

- [ ] **Step 4: Modernize community/release docs**

Use Contributor Covenant 2.1, GitHub private reporting, Node 24 setup, actual scripts, regression workflow, PR expectations, and provenance release procedure.

- [ ] **Step 5: Verify and commit**

```bash
npm run test:types
npm run test:unit -- test/integration/docs-examples.test.ts
npm run format:check
git add README.md LICENSE CODE_OF_CONDUCT.md CONTRIBUTING.md CHANGELOG.md SECURITY.md docs
git add -u
git commit -m "docs: document the focused v2 ownership model"
```

### Task 13: Collection-ready documentation website

**Files:**
- Create: `website/index.html`, `website/main.ts`, `website/styles/tokens.css`, `website/styles/site.css`, `website/content/navigation.ts`, `website/content/pages.ts`, `website/components/header.ts`, `website/components/docs-shell.ts`, `website/components/code-example.ts`, `website/components/support-table.ts`, `website/examples/runtime.ts`, `website/tsconfig.json`, `vite.website.config.ts`, `scripts/verify-website.mjs`, `scripts/verify-website.test.mjs`, `test/browser/website.spec.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: built ImmuView and docs.
- Produces: framework-free static site and `dev`, `build:website`, `test:website`.

- [ ] **Step 1: Define collection-ready visual tokens**

Create accessible neutral surfaces/ink, one restrained accent, technical typography, responsive spacing/type/radius/shadow tokens, visible focus, and reduced-motion behavior. Reserve a collection identity slot without inventing other products.

- [ ] **Step 2: Build the reference-inspired shell**

Implement a strong first screen, evidence blocks, persistent desktop/mobile docs navigation, table of contents, previous/next links, support tables, copyable code, and restrained footer using semantic HTML.

- [ ] **Step 3: Add real interactive examples**

Import the built library; demonstrate basic/nested/live/array/Map/Set/Date/cycle/identity/method behavior. Render safe error metadata and never evaluate arbitrary code.

- [ ] **Step 4: Write website verifier tests first**

Assert every route/heading/example exists, local links resolve, no React/framework imports exist, and no private package import is used. Run and confirm failure before implementing the verifier.

- [ ] **Step 5: Build and browser-test**

Test desktop/mobile navigation, copy controls, live-view output, mutation errors, focus, reduced motion, and narrow overflow in the three-browser setup.

- [ ] **Step 6: Verify and commit**

```bash
npm run test:website
npm run build:website
npm run test:browser -- --grep "documentation"
git add website vite.website.config.ts scripts test/browser/website.spec.ts package.json package-lock.json
git commit -m "docs: add the collection-ready ImmuView website"
```

### Task 14: GitHub hygiene, CI, and guarded release

**Files:**
- Replace: `.github/workflows/ci.yml`, `.github/workflows/publish.yml` with `.github/workflows/release.yml`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`, `.github/ISSUE_TEMPLATE/feature.yml`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/PULL_REQUEST_TEMPLATE.md`, `renovate.json`, `scripts/verify-release-readiness.mjs`, `scripts/verify-release-readiness.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: all quality scripts.
- Produces: `check`, `release:check`, CI/browser jobs, and manual provenance publishing.

- [ ] **Step 1: Write failing release-policy tests**

Fixture-test exact version/channel confirmation, next/latest rules, changelog/package/license/README, zero dependencies, exports, and tarball allowlist.

- [ ] **Step 2: Implement release readiness and `npm run check`**

Order: format, lint, types, unit/type tests, dist, API, size, package, website verification/build, benchmark smoke. The verifier never publishes.

- [ ] **Step 3: Create least-privilege CI**

Node 24 quality job followed by Chromium/Firefox/WebKit jobs; use npm caching, concurrency cancellation, and failure-only artifacts.

- [ ] **Step 4: Create manual guarded release**

Require `publish <version> with <channel>`, protected environment, id-token only in publish, full quality/browser checks, unpublished-version test, provenance publish, registry propagation, and GitHub release. Do not add automatic publish triggers.

- [ ] **Step 5: Add low-noise Renovate and templates**

Group compatible dev tooling, limit concurrent PRs, schedule reasonably, and collect minimal reproduction/environment data in issues.

- [ ] **Step 6: Verify and commit**

```bash
node --test scripts/verify-release-readiness.test.mjs
npm run check
git add .github renovate.json scripts package.json package-lock.json
git add -u
git commit -m "ci: add v2 quality and guarded release workflows"
```

### Task 15: Final adversarial audit and readiness evidence

**Files:**
- Create: `docs/releases/v2-alpha-readiness.md`
- Modify only after failing regression tests: relevant `src/*`, `test/regression/*`, docs, and size baseline

**Interfaces:**
- Consumes: complete repository.
- Produces: traceable Definition-of-Done evidence without publishing.

- [ ] **Step 1: Audit every source-exposure path**

Review reads, descriptors, accessors, methods, iterators, callbacks, symbols, spread/destructuring, collection translation, Date binding, classes/private fields, constructors, unsupported classification, and proxies. Every confirmed defect receives a failing regression test before its fix.

- [ ] **Step 2: Audit every Proxy trap against ECMAScript invariants**

Check get, set, deleteProperty, defineProperty, getOwnPropertyDescriptor, ownKeys, has, getPrototypeOf, setPrototypeOf, isExtensible, preventExtensions, apply, and construct across all shadow/source states.

- [ ] **Step 3: Audit runtime/types/docs alignment**

Map each support-table row and `DeepReadonly` branch to runtime classification and tests; remove or correct any unverified statement.

- [ ] **Step 4: Run fresh full evidence commands**

```bash
npm ci
npm run check
npm run test:browser
npm run benchmark
npm pack --dry-run
```

Record exact test counts, browser projects, sizes, benchmark environment/summary, tarball list, dependency count, and limitations in the readiness document.

- [ ] **Step 5: Verify publication safety and commit**

```bash
git diff --check
git status --short
npm view immuview@2.0.0-alpha.0 version || true
git add docs/releases/v2-alpha-readiness.md README.md docs scripts/size-budget.json src test
git commit -m "chore: complete the ImmuView v2 alpha audit"
```

Expected: registry lookup finds no v2 prerelease; nothing is published, tagged, pushed, or released.

- [ ] **Step 6: Re-run final verification**

```bash
npm run check
npm run test:browser
git status --short --branch
```

Expected: both gates pass and the working tree is clean.

