# ReadonlyView v2 Design Specification

## Status

Approved in conversation on 2026-09-03. This document defines the semantic and engineering contract for the v2 rewrite. It does not authorize publishing a package.

## Product definition

ReadonlyView creates a deeply readonly, lazy, live view over mutable JavaScript data. It is a runtime-enforced readonly membrane with matching TypeScript readonly types.

ReadonlyView is not a state manager, store, reactive primitive, mutation API, validator, merge utility, snapshot, clone, or security sandbox. The source owner mutates the source directly. Consumers receive the view.

```ts
import { readonlyView } from '@nipe-solutions/readonly-view'

const source = { user: { name: 'Alice', roles: ['admin'] } }
const view = readonlyView(source)

source.user.name = 'Bob'
console.log(view.user.name) // Bob

view.user.roles.push('editor') // TypeScript error and DirectMutationError
```

## Public API

The package root exports only:

```ts
readonlyView
isReadonlyView
DirectMutationError
UnsupportedTypeError
DeepReadonly
```

There is no default export, configuration object, mutation API, `unwrap`, registry, plugin system, or public internal module. Package exports reject private subpath imports.

```ts
function readonlyView<T>(source: T): DeepReadonly<T>
function isReadonlyView(value: unknown): boolean
```

Primitives are returned unchanged. Passing a ReadonlyView view to `readonlyView` returns the same view.

## Core guarantees

- Writes made through a view are rejected with `DirectMutationError`.
- Supported nested values reachable through a view are protected lazily.
- ReadonlyView never intentionally writes to, freezes, seals, prevents extensions on, changes descriptors of, changes prototypes of, serializes, or eagerly traverses the source.
- Owner-side mutations remain visible through an existing view, including property replacement, addition and deletion and collection/Date changes.
- One source object maps to one view inside a membrane, including across object fields, arrays, collections, descriptors, iterators, and cycles.
- Circular graphs terminate and preserve identity.
- Unsupported values fail explicitly when first reached rather than exposing an unsafe reference.
- Runtime and public TypeScript declarations describe the same supported semantics.

## Non-guarantees and trust model

- ReadonlyView is not a security boundary or capability sandbox.
- It cannot revoke or protect another reference to the source.
- A function can mutate independently captured state or cause arbitrary external side effects.
- A getter can cause arbitrary side effects.
- A consumer-supplied Proxy can execute arbitrary traps or lie about its target. JavaScript provides no reliable general-purpose Proxy detection.
- Cross-realm and host objects can have environment-specific behavior. Values not classified as supported are rejected where they can be identified.
- Private class fields use JavaScript brand checks and may reject a proxy receiver.

The implementation avoids unnecessary user-code execution during classification. It does not depend on `Object.prototype.toString` or user-controlled `Symbol.toStringTag` for correctness.

## Membrane architecture

Every top-level object call creates a membrane containing two WeakMaps:

- source to view, for stable identity and cycle handling;
- view to source, for internal collection lookup translation and existing-view recognition.

The second map may also be represented by module-private WeakMap metadata shared only for view recognition. Neither mapping is exported, and no global strong reference retains a user graph.

Separate top-level calls create independent membranes:

```ts
readonlyView(source) !== readonlyView(source)
```

Identity is guaranteed inside each membrane. Existing ReadonlyView inputs are idempotent:

```ts
const first = readonlyView(source)
readonlyView(first) === first
```

The implementation registers a source/view pair before nested wrapping can occur.

## Shadow targets and Proxy invariants

ReadonlyView does not directly proxy arbitrary sources. Direct proxying cannot safely replace the value of a non-configurable, non-writable data property, because the Proxy `get` invariant requires the exact target value and would leak a mutable child.

Instead, views use controlled shadows:

- ordinary objects and class instances use extensible object-shaped shadows;
- arrays use array shadows so `Array.isArray(view)` remains true;
- functions use callable/constructable shadows where the source permits those operations;
- Map, Set, and Date use object shadows plus dedicated adapters.

Shadows remain internally extensible. `preventExtensions` on the view always throws, which allows live source keys to appear and disappear without conflicting with `ownKeys` invariants. View mutation traps never forward to the source.

`ownKeys`, `has`, `get`, and prototype observation delegate to current source state. Descriptor reflection virtualizes source descriptors onto the shadow. Data values and getter results are wrapped. Configurability is normalized when required by the shadow contract; source descriptors remain untouched. The architecture and API documentation state that reflected descriptors describe the view, not an identical copy of source descriptor identity.

Array `length` and callable shadow properties receive dedicated compatibility tests because their shadows contain unavoidable non-configurable properties. Every trap is justified by a semantic test and an invariant regression test.

## Mutation interception

All mutation entry points throw `DirectMutationError`:

- `set`, including nested properties, array indexes, and array length;
- `deleteProperty`;
- `defineProperty`;
- `setPrototypeOf`;
- `preventExtensions`;
- `Object.assign`, `Reflect.set`, `Reflect.deleteProperty`, and `Reflect.defineProperty` as consequences of those traps;
- Array mutators;
- Map `set`, `delete`, and `clear`;
- Set `add`, `delete`, and `clear`;
- all standard Date setter methods, including local and UTC variants.

The mutation error is small and stable:

```ts
class DirectMutationError extends Error {
  readonly operation: string
  readonly property?: PropertyKey
  readonly objectKind: string
}
```

Messages identify the operation and safe property representation without serializing or inspecting the source. Symbols are formatted without invoking user code. The exact exported metadata types are kept narrow and documented.

`UnsupportedTypeError` records the detected kind without retaining or stringifying the rejected object.

## Reads, descriptors, and reflection

The following behave naturally and live where Proxy invariants permit:

- `Object.keys`, `Object.values`, and `Object.entries`;
- own property names and symbols;
- own property descriptors;
- `Reflect.ownKeys`, `Reflect.get`, and `Reflect.has`;
- the `in` operator and `for...in`;
- spread and destructuring;
- `Object.getPrototypeOf`, `instanceof`, and `Array.isArray`.

Any path exposing an object value passes through the membrane, including descriptors, accessors, iteration results, collection callbacks, and well-known symbols.

Getters execute with the readonly receiver and returned values are wrapped. A setter is never invoked through the view. Getter side effects are outside the guarantee and are documented.

## Functions and methods

Generic functions retain their call signature in `DeepReadonly<T>` and are represented by callable views when runtime wrapping is needed. A normal `view.method()` invocation calls the source function with the readonly receiver. A write through `this` therefore reaches the membrane and throws.

Calls with another explicit `this` preserve normal JavaScript call semantics; ReadonlyView protects only values reached through the view. Function-owned object properties are deeply wrapped. Construct calls, where supported, wrap the returned object and never expose an unwrapped result.

Dedicated Map, Set, and Date adapters call native methods with valid source receivers and wrap outputs. Generic method handling never binds these native methods blindly.

Custom instances preserve their prototype. Public fields and public methods follow normal membrane semantics, so `instanceof` remains useful and writes through method `this` throw. Private-field methods and accessors may fail native brand checks because rebinding them to the source would create a mutation escape hatch. This limitation is explicit.

## Supported values

| Value | Classification | Semantics |
| --- | --- | --- |
| primitives, `null`, `undefined`, bigint, symbol | Fully supported | Returned unchanged |
| plain and null-prototype objects | Fully supported | Live property and reflection view |
| Array and tuple | Fully supported | Array identity preserved; mutators rejected |
| Map / ReadonlyMap | Fully supported | Read methods and iteration wrap keys and values; mutators rejected |
| Set / ReadonlySet | Fully supported | Reads and iteration wrap values; mutators rejected |
| Date | Fully supported | Read methods work; complete setter family rejected |
| Function | Supported with documented semantics | Calls allowed; readonly receiver; outputs wrapped; external side effects possible |
| custom class instance | Supported with documented semantics | Prototype preserved; public state protected; private brands may reject |
| consumer Proxy | Supported with trust limitation | Membrane does not claim stronger guarantees than source traps permit |
| RegExp | Explicitly unsupported | Stateful native methods and `lastIndex` make generic wrapping unsafe |
| Error | Explicitly unsupported | Engine-specific internal state and mutable custom fields are not claimed safe |
| URL / URLSearchParams | Explicitly unsupported | Native setters and mutators require a dedicated future adapter |
| ArrayBuffer / SharedArrayBuffer | Explicitly unsupported | Mutable backing memory cannot be made readonly by an object Proxy |
| DataView / TypedArray | Explicitly unsupported | Internal slots and backing-memory mutation require separate semantics |
| WeakMap / WeakSet | Explicitly unsupported | Mutating APIs and non-enumerable contents require dedicated semantics |
| Promise | Explicitly unsupported | Internal-slot methods and asynchronously exposed values require dedicated semantics |
| unknown host/native object | Explicitly unsupported when identifiable | Correctness is preferred over accidental method exposure |

Unsupported values throw lazily when accessed, including when used as a root. Support can expand in future minor releases only with complete semantics and tests.

## Array semantics

Index reads, iteration, callbacks, non-mutating methods, spread, and returned nested values use the membrane. Mutating methods throw before touching the source. The complete standardized mutator set includes `copyWithin`, `fill`, `pop`, `push`, `reverse`, `shift`, `sort`, `splice`, and `unshift`. New mutators introduced by the language must be evaluated before being treated as safe.

Non-mutating methods operate with the view as receiver where generic array semantics allow it, ensuring values encountered by callbacks are views. Tuple typing retains fixed positions and readonly structure.

## Map and Set semantics

Map keys and values exposed through `keys`, `values`, `entries`, iteration, and `forEach` are wrapped. `forEach` receives the readonly collection as its third argument. `get` and `has` translate a view from the same membrane back to its source solely for lookup, so both source and view key forms work when the caller already owns them. Unknown objects are passed through as lookup candidates without mutation.

Set iteration and callbacks expose wrapped values and the readonly Set. `has` applies the same same-membrane translation. Mutation methods always throw. Collection method functions have stable identity when repeatedly read from the same view.

## Date semantics

All standardized read methods work with a valid source receiver. All standardized local and UTC setter variants throw. Method classification is centralized, exhaustive against the target JavaScript library, and tested so an incomplete handwritten blacklist cannot silently ship. Owner mutation through the source Date remains live.

## TypeScript model

`DeepReadonly<T>` is distributive over unions and handles:

- primitives and functions;
- mutable and readonly arrays;
- tuples, including readonly tuples and optional/rest members;
- Map and ReadonlyMap as `ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>`;
- Set and ReadonlySet as `ReadonlySet<DeepReadonly<V>>`;
- Date as an unexported `ReadonlyDate` helper that structurally exposes only non-mutating Date members;
- optional and nullable properties;
- symbol keys;
- recursive object types without eager expansion errors.

Functions preserve calls while their owned properties are readonly where TypeScript can express that intersection cleanly. The public declaration file must not expose internal handler, membrane, shadow, or build-tool types. Dedicated positive and `@ts-expect-error` tests define the contract.

Types for explicitly unsupported roots remain representable because TypeScript cannot generally reject them without harming inference; runtime rejection and the support matrix are authoritative. The declarations must not falsely replace unsupported native mutation methods with a readonly interface.

## Performance and memory

Initial wrapping performs classification, creates one shadow/proxy, and registers WeakMap metadata. It does not walk nested properties or invoke getters. Nested views are created on first exposure and reused thereafter.

Benchmarks cover creation, first and repeated nested access, large shallow and deep graphs, arrays, Map reads, Set iteration, Date reads, plain access, shallow `Object.freeze`, and recursive deep freeze. Results include environment and methodology. CI runs a functional benchmark smoke test but does not gate noisy timing ratios.

No process-global strong cache retains sources or views. WeakMap entries become collectible with their membrane objects.

## Package and compatibility

The npm package is `@nipe-solutions/readonly-view`, the product name is ReadonlyView, and the repository is `NIPE-Solutions/readonly-view`. The public factory remains `readonlyView`. The package has zero runtime dependencies and uses current stable development dependencies at implementation time. Dependency versions are pinned by the npm lockfile and maintained with Renovate under a low-noise grouped policy.

Outputs:

- ESM;
- CommonJS;
- one clean TypeScript declaration entry point;
- source maps only if package verification demonstrates a concrete debugging benefit and the size budget includes them.

The package uses an explicit exports map, `main`, `module`, `types`, `files`, `sideEffects: false`, complete repository metadata, MIT license metadata, Node engine range, and npm provenance configuration. Runtime support is Node.js 22 and 24, current evergreen Chromium/Firefox/WebKit verified in CI, and modern bundlers. Development and release use Node.js 24 LTS. Deno and Bun are documented only after explicit verification.

The emitted JavaScript targets a modern baseline compatible with the verified runtime matrix. TypeScript's documented minimum version is determined by a consumer fixture and CI, not assumed from the compiler used to build.

## Repository structure

```text
.github/
  ISSUE_TEMPLATE/
  workflows/
benchmarks/
docs/
  adr/
  superpowers/
scripts/
src/
  builtins/
  errors.ts
  membrane.ts
  public-types.ts
  index.ts
test/
  browser/
  integration/
  package/
  regression/
  types/
  unit/
website/
```

Files are split by coherent responsibility, not to imitate a large monorepo. `src/index.ts` is the only package entry point.

## Test strategy

Development follows strict red-green-refactor cycles. Tests are organized by semantic contract rather than implementation trap count.

Required suites cover:

- primitive and root behavior;
- deep and live object behavior;
- shared identity and cycles;
- arrays and every mutation/read route;
- Map, Set, Date, functions, symbols, getters, descriptors, and classes;
- frozen, sealed, non-extensible, non-configurable, and non-writable source cases;
- all reflection and prototype operations;
- direct and nested adversarial mutation attempts;
- descriptor, iterator, callback, method, spread, and destructuring escape routes;
- unsupported values and existing proxies;
- source descriptor/prototype/extensibility snapshots before and after creation and reads;
- randomized graphs using `fast-check` when it materially expands state-space coverage;
- compile-time positive and negative cases;
- real packed-artifact ESM, CommonJS, TypeScript, bundler, tree-shaking, exports, metadata, and file-list contracts;
- Chromium, Firefox, and WebKit runtime behavior.

Every confirmed defect receives a failing regression test before its fix.

## Build, size, and quality gates

Modern TypeScript, ESLint flat config, Prettier, Vitest, Vite/library tooling, and Playwright are used at current mutually compatible versions. Tool selection may change during implementation if an equivalent simpler tool produces cleaner dual-format output; the zero-runtime-dependency and package-contract requirements do not change.

`npm run check` executes format checking, lint, type checking, unit/integration/regression/type tests, build, API/declaration checks, packed-package verification, size verification, and documentation build. Browser matrix and full benchmarks remain separate documented commands; CI runs browser tests in parallel jobs and a benchmark smoke test.

Size automation records minified ESM, minified+gzip ESM, declaration size, and packed artifact size. Exact budgets are established from the completed v2 baseline with documented reasonable headroom and then committed as hard CI limits. Budgets are not selected in advance or gamed by removing correctness code.

## Documentation and collection-ready website

The README explains the product in the first screen and links to deeper documentation. Every behavioral claim maps to a test.

The documentation set includes introduction, getting started, core/ownership model, guarantees and non-guarantees, runtime and compile-time behavior, support matrix, type-specific guides, functions/classes, cycles, symbols, descriptors/invariants, API, comparison, migration, performance/memory, security/trust, FAQ, contributing, release process, and selected ADRs.

The website is a framework-free Vite/TypeScript/CSS static site. It follows the reference repository's philosophy and information architecture: strong first-screen explanation, evidence-oriented feature sections, persistent docs navigation, responsive reading layouts, searchable or easily navigable API content, real runnable examples, and release/support information. Its visual identity is minimal, technical, premium, and consistent with a future collection of small NIPE-quality primitives.

Collection readiness means shared-looking design tokens, naming conventions, navigation slots, content components, and visual rhythm that could later be reused. It does not introduce `@nipe-solutions/core`, a runtime design package, React, or premature cross-repository abstractions. ReadonlyView remains independently buildable and publishable.

README and website examples have mirrored compile/runtime tests. Interactive examples execute the real built library and show both rejected view mutations and visible source-side changes.

## Migration and versioning

The development version is `2.0.0-alpha.0` until release workflow decisions require another prerelease. Nothing is published automatically during implementation.

The v1 API is removed:

- `readonly` becomes `readonlyView`;
- `.value` is removed;
- `internalSet`, validation, error-handler options, validation errors, deep merge, and public internals are removed;
- the owner mutates the source directly.

The migration guide is explicitly titled “ImmuView v1 to ReadonlyView v2,” explains the package rename and narrower ownership model, and points existing users to the retained v1 tags. No compatibility layer ships in v2.

## CI and release

Pull requests and main-branch pushes run install, formatting, lint, types, semantic tests, build, API/declaration checks, tarball consumer tests, size checks, documentation build, benchmark smoke tests, and the three-browser matrix.

The release workflow is manual and environment-protected. It requires exact version/channel confirmation, a clean quality gate, browser verification, changelog/version/license/package validation, an unpublished-version check, npm trusted publishing/provenance permissions, registry propagation verification, and GitHub release creation. Stable publication is restricted to the main branch and prereleases to an explicit non-latest tag.

Repository hygiene includes issue forms/templates, a PR template, Renovate configuration, a standard Code of Conduct, security policy using GitHub private vulnerability reporting, contribution guide, changelog with Unreleased/2.0.0 sections, and release documentation.

## Selected architecture decisions

Short ADRs record only consequential decisions:

1. live membrane instead of frozen snapshot;
2. removal of the state-management API;
3. shadow targets for invariant safety;
4. explicit rejection of unsupported built-ins;
5. custom-class and private-field semantics.

## Acceptance criteria

The implementation is complete only when the user-provided Definition of Done is traceable to implementation, tests, or explicit documented non-support; `npm run check` succeeds; configured browser tests succeed; the real tarball passes all consumer checks; size baselines and benchmark results are recorded; the final adversarial audit finds no confirmed untested escape hatch; and no package has been published.
