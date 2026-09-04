# ReadonlyView Product Story and Launch Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe ReadonlyView around the owner/consumer boundary, add concrete use-case and decision documentation, and prepare honest channel-native launch content without changing runtime behavior.

**Architecture:** Preserve the existing single-page, framework-free Vite site and repository documentation structure. Add product-story sections before the technical reference, keep all code examples synchronized through executable integration tests, and store unpublished campaign drafts in a root `marketing/` directory excluded by the package allowlist.

**Tech Stack:** Markdown, semantic HTML, CSS, TypeScript, Vite 8, Vitest, Playwright, Node.js 22/24

**Spec:** `docs/superpowers/specs/2026-09-04-product-story-and-launch-content.md`

## Global Constraints

- Do not modify `src/`, public exports, runtime semantics, or support policy.
- Lead with “Expose live internal data without exposing mutation.”
- Use “owner” and “consumer” consistently; never describe the source as immutable.
- Preserve the current website identity, interactive demo, legal pages, and framework-free implementation.
- Do not add dependencies, tracking, analytics, decorative animation, fabricated social proof, or security claims.
- Keep limitations prominent and comparisons fair to the problem each alternative solves.
- Every published code example must execute in tests.
- Nothing in `marketing/` is posted or scheduled by this work.

---

### Task 1: README product story and executable boundary examples

**Files:**

- Modify: `README.md`
- Modify: `test/integration/docs-examples.test.ts`
- Modify: `test/types/docs-examples.ts`

**Interfaces:**

- Consumes: `readonlyView`, `DirectMutationError`, and existing integration/type-test conventions.
- Produces: canonical SDK, registry, and plugin examples reused conceptually by the website and focused docs.

- [ ] **Step 1: Add failing runtime examples**

Add three tests to `test/integration/docs-examples.test.ts`. The SDK test must construct a class with private `#state`, expose `readonly state = readonlyView(this.#state)`, mutate through `connect`, observe the update through the existing view, reject `Reflect.set(view.user, 'name', ...)`, and verify the source-owned user is unchanged. The registry test must expose a readonly `Map`, allow owner-side `register`, reject `view.set`, and compare entries before/after rejection. The plugin test must pass a readonly context into `initialize`, reject nested configuration mutation, and preserve the source value.

- [ ] **Step 2: Run the focused test and confirm the new cases fail before fixtures exist**

Run: `npx vitest run --project unit test/integration/docs-examples.test.ts`

Expected: failure caused by the newly referenced SDK, registry, or plugin fixtures not yet being defined.

- [ ] **Step 3: Implement the fixtures and assertions**

Use complete local fixtures in the test file, including this SDK shape:

```ts
class Client {
    #state = { connected: false, user: null as { name: string } | null };
    readonly state = readonlyView(this.#state);

    connect(user: { name: string }) {
        this.#state.connected = true;
        this.#state.user = user;
    }
}
```

Assert owner liveness, rejected consumer mutation, and source snapshots explicitly.

- [ ] **Step 4: Add compile-time examples**

In `test/types/docs-examples.ts`, add the SDK public state shape and `@ts-expect-error` assignments for `client.state.connected`, registry `.set`, and nested plugin configuration. Keep valid reads and owner methods free of expected errors.

- [ ] **Step 5: Rewrite the README**

Use this section order: opening value proposition and minimal example; Install; Why this exists (SDK); Use ReadonlyView when; comparison table; ownership mental model; guarantees; supported values; When not to use it; performance; API; documentation; license. Include npm/docs/GitHub links, compact npm/pnpm/Yarn/Bun install commands, and no more than three badges after the opening example if they do not displace it.

The comparison columns must be TypeScript `readonly`, `Object.freeze`, deep freeze, snapshot/Immer, and ReadonlyView. Rows must cover compile-time protection, runtime depth, whether the owner retains mutation, liveness, traversal/copying, and new-state production.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run --project unit test/integration/docs-examples.test.ts && npm run test:types && npx prettier --check README.md test/integration/docs-examples.test.ts test/types/docs-examples.ts`

Expected: focused runtime and type tests pass; formatting passes.

Commit: `docs: explain readonly-view through library boundaries`

### Task 2: Focused mental-model, use-case, choice, and API documentation

**Files:**

- Create: `docs/mental-model.md`
- Create: `docs/use-cases.md`
- Create: `docs/choosing-an-approach.md`
- Modify: `docs/api.md`
- Modify: `README.md`

**Interfaces:**

- Consumes: canonical examples and vocabulary established in Task 1.
- Produces: authoritative destinations for ownership, fit, comparisons, and every public export.

- [ ] **Step 1: Create the mental-model page**

Explain owner, source graph, `readonlyView`, membrane, consumer, lazy wrapping, liveness, stable same-membrane identity, independent top-level membranes, and access-path—not global—protection. Include the exact diagram from the spec and links to guarantees, supported types, and security/trust.

- [ ] **Step 2: Create the use-case page**

Include complete SDK, registry, and plugin-context examples aligned with Task 1. For each, label owner, consumer, why a clone becomes stale, allowed owner mutation, and rejected consumer mutation. Add shorter sections for response caches, configuration managers, engine state, and diagnostic state, followed by “When not to use ReadonlyView.”

- [ ] **Step 3: Create the decision guide**

Give TypeScript `readonly`, `Object.freeze`, deep freeze, cloning/snapshots, Immer-style updates, and ReadonlyView an individual “choose this when” section. Add the same precise comparison matrix used by the README and conclude that the approaches solve different ownership/lifecycle problems.

- [ ] **Step 4: Expand the API reference**

For `readonlyView`, `isReadonlyView`, `DirectMutationError`, `UnsupportedTypeError`, and `DeepReadonly`, add signature, purpose, minimal example, guarantees, and edge cases. Explicitly cover primitives, existing views, independent membranes, error metadata, lazy unsupported nested values, and generic/overloaded callable type limitations. Link detailed semantics rather than duplicating them.

- [ ] **Step 5: Wire the documentation index**

Add Mental model, Use cases, and Choosing an approach to the README documentation links. Check every relative link with:

```bash
node -e "const fs=require('node:fs'); for(const f of ['README.md','docs/mental-model.md','docs/use-cases.md','docs/choosing-an-approach.md','docs/api.md']) { if(!fs.existsSync(f)) throw new Error(f) }"
```

- [ ] **Step 6: Verify and commit**

Run: `npx prettier --check README.md docs/mental-model.md docs/use-cases.md docs/choosing-an-approach.md docs/api.md && npm run test:unit && npm run test:types`

Expected: formatting, 77+ runtime tests, and strict type examples pass.

Commit: `docs: add readonly-view adoption guides`

### Task 3: Website story, use cases, fit, and comparison

**Files:**

- Modify: `website/index.html`
- Modify: `website/styles.css`
- Modify: `scripts/verify-website.mjs`
- Modify: `test/browser/website.spec.ts`

**Interfaces:**

- Consumes: README positioning and canonical examples from Tasks 1–2.
- Produces: a conversion-oriented home-page journey before the existing technical reference.

- [ ] **Step 1: Add failing build assertions**

In `scripts/verify-website.mjs`, require the built home page to contain IDs `why`, `use-cases`, `comparison`, and `fit`; the primary sentence; SDK, registry, and plugin headings; “Good fit” and “Not a fit”; links to npm, GitHub, and the three new GitHub-hosted docs; and canonical production metadata.

- [ ] **Step 2: Add failing browser expectations**

In `test/browser/website.spec.ts`, verify sidebar links scroll to the four new IDs, the three CTA destinations have correct `href` values, each new section has one visible level-two heading, and the existing narrow-viewport overflow assertion still applies after navigating to `#use-cases`.

- [ ] **Step 3: Run red tests**

Run: `npm run test:website && npm run test:browser -- --project=chromium`

Expected: failures for missing new sections and navigation links.

- [ ] **Step 4: Implement semantic HTML**

Retain the hero demo and proof strip. Insert, before the existing Introduction section: “Why this exists” with the SDK boundary; “Built for public read surfaces” with SDK, registry, and plugin scenarios; “Choose the right tool” with a compact accessible table; and a two-column “Good fit / Not a fit” section followed by npm/docs/GitHub CTAs. Add matching sidebar and on-page links. Update description/OG copy to “Expose live internal data without exposing mutation.”

- [ ] **Step 5: Extend the existing design system**

Add focused CSS for `.story`, `.use-case-list`, `.fit-grid`, and `.story-actions`. Use current paper/ink/blue tokens, rules, code surfaces, typography, and breakpoint conventions. Avoid identical rounded cards, new shadows, all-caps eyebrows, and non-interactive motion. Ensure readable lines below 80 characters and one-column mobile layouts.

- [ ] **Step 6: Run green website verification**

Run: `npm run test:website && npm run test:browser -- --project=chromium`

Expected: website build assertions and Chromium browser tests pass.

- [ ] **Step 7: Commit**

Run: `git diff --check && npx prettier --check website/index.html website/styles.css scripts/verify-website.mjs test/browser/website.spec.ts`

Commit: `docs(website): lead with readonly-view use cases`

### Task 4: Launch-ready marketing library

**Files:**

- Create: `marketing/README.md`
- Create: `marketing/launch-announcement.md`
- Create: `marketing/technical-article.md`
- Create: `marketing/comparison-article.md`
- Create: `marketing/sdk-tutorial.md`
- Create: `marketing/mutation-escape-thread.md`

**Interfaces:**

- Consumes: canonical positioning, examples, guarantees, and limitations from Tasks 1–3.
- Produces: drafts for manual human review and publication; no automated external actions.

- [ ] **Step 1: Create the campaign index**

Document audience, goal, recommended publication sequence, canonical URLs, voice, prohibited claims, and a checklist requiring final channel-rule review, live-link checks, code formatting, disclosure, proofreading, and date/version confirmation.

- [ ] **Step 2: Draft channel-native launch announcements**

Write distinct GitHub/NIPE, personal LinkedIn, NIPE LinkedIn, X/Bluesky thread, and adaptable community versions. Each must state the boundary problem, show or link one concise example, identify `@nipe-solutions/readonly-view`, link the production site and repository, and acknowledge that it is not a sandbox or state manager.

- [ ] **Step 3: Draft the technical article**

Write “Why a readonly Proxy is harder than it looks” with concrete sections on property descriptors, getters/method returns, callback collection arguments, iterators, internal slots, and future native APIs. Explain shadow targets and fail-closed inventories in approachable language and end with appropriate/non-appropriate use cases.

- [ ] **Step 4: Draft the comparison article and SDK tutorial**

Keep the comparison fair and decision-oriented. In the tutorial, evolve a mutable leaked SDK reference into the tested `Client` pattern, add consumer and owner tests, then cover unsupported values, Proxy overhead, and trust boundaries.

- [ ] **Step 5: Draft the seven-part escape-route thread**

Use one post each for the naïve proxy premise, descriptors, returns/getters, callbacks, iterators, internal-slot built-ins, and future methods/fail-closed behavior. Finish with the repository and documentation links without alarmist security language.

- [ ] **Step 6: Verify package exclusion and commit**

Run: `npx prettier --check marketing && npm pack --dry-run --json | node -e "let s=''; process.stdin.on('data', d => s += d).on('end', () => { const p=JSON.parse(s)[0]; if(p.files.some(f => f.path.startsWith('marketing/'))) throw new Error('marketing shipped') })"`

Expected: all drafts format cleanly and no `marketing/` path appears in the tarball.

Commit: `docs(marketing): prepare readonly-view launch campaign`

### Task 5: Discoverability, complete verification, and handoff

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `docs/release-readiness.md`

**Interfaces:**

- Consumes: all prior content and tests.
- Produces: focused npm keywords and final evidence for a communication-only pull request.

- [ ] **Step 1: Update package keywords**

Set both manifests to the spec’s ordered keyword list: `readonly`, `deep-readonly`, `immutable`, `immutability`, `proxy`, `membrane`, `typescript`, `javascript`, `live-view`, `runtime`, `object`, `map`, `set`. Do not change the published version.

- [ ] **Step 2: Update release-readiness documentation**

Add a short post-release communication note stating that README/site/use-case/API content was expanded without runtime or export changes. Do not overwrite the existing `STABLE READY` evidence or imply a new npm release was published.

- [ ] **Step 3: Run the complete local gate**

Run: `npm run release:check`

Expected: formatting, lint, typecheck, 77+ runtime tests, strict types, size limits, package consumers, website verification, benchmark smoke, release metadata, and package artifact all pass.

- [ ] **Step 4: Run the local browser suite**

Run: `npm run test:browser`

Expected: Chromium and Firefox pass; WebKit follows the existing macOS 14 exclusion and remains required in Linux CI.

- [ ] **Step 5: Inspect scope and package**

Run: `git diff origin/main...HEAD --stat && git diff origin/main...HEAD -- src/ && npm pack --dry-run --json`

Expected: no `src/` diff, no new exports or dependencies, and the same seven intended package files apart from updated package metadata/README content.

- [ ] **Step 6: Commit final metadata**

Commit: `docs: finalize readonly-view product story`

- [ ] **Step 7: Request review and open a pull request**

Use `superpowers:requesting-code-review`, address verified findings, push `docs/product-story`, and open a PR against `main`. State explicitly that the PR changes communication and development-only drafts, not runtime semantics, and that nothing was posted externally.
