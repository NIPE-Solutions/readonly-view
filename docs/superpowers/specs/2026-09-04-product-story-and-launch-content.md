# ReadonlyView Product Story and Launch Content Design

**Date:** 2026-09-04

**Status:** Approved

## Objective

Make ReadonlyView immediately understandable and compelling to library and SDK
authors without weakening its precise technical claims. Preserve the current
runtime, public API, documentation architecture, visual identity, and
framework-free website. This work changes product communication only.

The primary message is:

> Expose live internal data without exposing mutation.

The supporting definition remains:

> ReadonlyView creates deeply readonly, runtime-enforced views over mutable
> JavaScript data. The owner retains mutation authority; consumers receive a
> live read surface.

“Readonly membrane” remains useful technical vocabulary, but it follows the
problem statement rather than leading it.

## Audience and Jobs

The primary audience is authors of JavaScript and TypeScript libraries, SDKs,
plugin systems, developer tools, engines, and long-lived service objects. They
need to expose state that consumers can inspect and that owners can continue to
update, without returning a mutable internal reference.

The content must help a visitor answer, in order:

1. What problem does this solve?
2. Is that a problem I have?
3. Why not use TypeScript `readonly`, `Object.freeze`, a clone, or Immer?
4. What does the ownership model look like in real code?
5. What guarantees and limitations can I rely on?
6. How do I install and use it?

## Editorial Principles

- Lead with the user’s boundary problem, not Proxy terminology.
- Use “owner” and “consumer” consistently.
- Say that the source remains mutable; avoid presenting the source as
  immutable.
- Use concrete examples before abstraction.
- Keep every comparison scoped to the problem each tool actually solves.
- State limitations close to claims, including Proxy overhead, unsupported
  values, custom-class caveats, and the fact that this is not a sandbox.
- Do not claim “secure,” “zero cost,” “faster than Immer,” “tamper-proof,” or
  broad state-management capabilities.
- Do not invent customers, testimonials, adoption numbers, or benchmarks.
- Keep code examples executable and covered by tests.

## README Design

The README remains concise enough for npm and GitHub scanning. Its content
order becomes:

1. Product name and value proposition: “Expose live internal data without
   exposing mutation.”
2. One-sentence definition and the existing minimal source/view example.
3. Compact installation command and links to npm, documentation, and GitHub.
4. “Why this exists” using an SDK with private mutable state and a public live
   readonly view.
5. “Use ReadonlyView when” with five concrete boundary conditions.
6. Comparison table covering TypeScript `readonly`, `Object.freeze`, deep
   freeze, immutable snapshots/Immer, and ReadonlyView.
7. Ownership mental model rendered as a small text diagram.
8. Guarantees, supported values, and “When not to use it.”
9. Performance statement, API summary, and deeper documentation links.

The README may use a small badge row after the opening example, limited to npm
version, CI, and license. Badges are omitted if their visual weight pushes the
value proposition or example down significantly. Installation alternatives
for pnpm, Yarn, and Bun appear in a compact collapsed or inline form; this does
not constitute a compatibility claim beyond installing the package.

The comparison table distinguishes “live backing object” from “runtime
protection through the exposed reference.” `Object.freeze` is described as
shallow and as constraining the frozen object itself. Deep freeze is described
as recursive and owner-constraining. Immer is described as producing new state,
not as a direct competitor or a live view.

## Website Design

The current visual identity, typography, palette, interactive two-sided demo,
responsive layout, legal routes, and framework-free Vite implementation remain.
No decorative animation or redesign is introduced.

The home-page journey becomes:

1. Existing hero, with the headline or lede strengthened by the primary
   problem statement.
2. Existing proof strip.
3. New “Why this exists” section centered on the owner/consumer boundary and
   an SDK example.
4. New “Built for public read surfaces” section with three materially distinct
   scenarios:
    - SDK state that stays current after connection changes;
    - a registry whose owner can register entries while consumers only read;
    - a plugin context that prevents accidental configuration mutation.
5. New compact “Choose the right tool” comparison.
6. New “Good fit / not a fit” section.
7. Existing technical documentation, examples, support matrix, API, migration,
   and FAQ.

Primary calls to action are “Install from npm,” “Read the documentation,” and
“View on GitHub.” They appear near the hero and at the end of the fit section.
The page does not use pricing-style cards, fake social proof, or generic feature
tiles. New structural elements use the existing rules, spacing, blue accent,
and code surfaces.

The sidebar and on-page navigation gain entries for the new story sections.
Metadata continues to use the canonical production origin. Open Graph copy is
updated to the plain-language value proposition while preserving the existing
image and canonical URL.

## Documentation Design

Create these focused documents:

### `docs/mental-model.md`

Explain source ownership, the view, the membrane, liveness, laziness, identity,
and the access-path boundary. Include this conceptual flow:

```text
Owner code ──mutable reference──▶ Source object graph
                                      │
                                 readonlyView()
                                      │
Consumer code ◀──readonly access── Readonly membrane
```

State explicitly that controlling one access path does not make the underlying
graph globally immutable.

### `docs/use-cases.md`

Include complete examples for SDK public state, an internal registry, and a
plugin context. Add shorter treatments of response caches, configuration
managers, shared engine state, and diagnostics. Each major example states the
owner, consumer, why a clone would be stale, and which mutations remain valid.
Include “When not to use ReadonlyView.”

### `docs/choosing-an-approach.md`

Compare TypeScript `readonly`, `Object.freeze`, deep freeze, cloning/snapshots,
Immer-style immutable updates, and ReadonlyView. Give each approach a fair
“choose this when” explanation. Avoid declaring a universal winner.

### `docs/api.md`

Expand every public export with purpose, signature, minimal example,
guarantees, and edge cases. Cover independent membranes, re-wrapping an
existing view, error metadata, primitive behavior, unsupported roots and
nested values, and the type/runtime caveats of `DeepReadonly<T>`.

Update the README and website documentation indexes to link these pages. Do not
duplicate detailed reflection, custom-class, or unsupported-type material that
already has an authoritative home; link to it.

## Executable Example Coverage

Extend `test/integration/docs-examples.test.ts` with consumer fixtures matching
the new SDK, registry, and plugin examples. Tests verify both halves of the
contract:

- owner mutations remain visible through an existing view;
- consumer mutation attempts throw `DirectMutationError`;
- rejected attempts leave the source unchanged;
- nested objects and collection values remain protected;
- examples compile under the existing strict type test configuration where
  TypeScript-specific mutation assertions are appropriate.

Extend `scripts/verify-website.mjs` to assert the new home-page sections, core
copy, links, and examples are present in the production build. Extend the
website Playwright suite to verify the new navigation targets and CTA links,
and retain mobile overflow checks.

No runtime tests or implementation changes are expected because this project
does not alter semantics.

## Marketing Deliverables

Create a root `marketing/` directory. It is development material and remains
excluded from the npm tarball by the existing package `files` allowlist.

### `marketing/launch-announcement.md`

Provide channel-native drafts for:

- a concise GitHub/NIPE announcement;
- a personal LinkedIn post;
- a NIPE Solutions LinkedIn post;
- an X/Bluesky thread;
- a short community post that can be adapted only where self-promotion is
  permitted.

Each version leads with the boundary problem, includes one small example, names
the package, links to the canonical site and repository, and includes one
honest limitation. Do not paste identical copy across platforms.

### `marketing/technical-article.md`

Draft “Why a readonly Proxy is harder than it looks.” Cover naïve Proxy leaks
through descriptors, method returns, callbacks, iterator values, native
internal slots, and future platform methods. Explain the fail-closed method
inventory without reproducing internal source code. End with when the technique
is appropriate and link to the repository.

### `marketing/comparison-article.md`

Draft a practical decision guide comparing compile-time readonly types,
freezing, snapshots, immutable-update libraries, and live readonly views.

### `marketing/sdk-tutorial.md`

Draft a step-by-step tutorial that evolves an SDK from returning a mutable
internal state reference to exposing a live readonly view. Cover testing and
limitations.

### `marketing/mutation-escape-thread.md`

Draft a compact seven-part technical thread about common readonly Proxy escape
routes. The tone is educational rather than alarmist.

Every draft includes a short publishing checklist for final link verification,
channel rules, disclosure, formatting, and proofreading. Nothing is posted or
scheduled by this work.

## Search and Discoverability

Update package keywords to the focused set:

```text
readonly, deep-readonly, immutable, immutability, proxy, membrane,
typescript, javascript, live-view, runtime, object, map, set
```

Retain accurate page titles, canonical URLs, sitemap entries, Open Graph tags,
and social image references. Copy should naturally contain terms developers
search for, such as “runtime readonly,” “deep readonly,” and “live readonly
view”; do not keyword-stuff headings or prose.

## Non-Goals

- No runtime, public API, type, package-name, or support-policy changes.
- No React or framework integration.
- No state-management positioning.
- No analytics, newsletter, comments, search service, or tracking scripts.
- No visual redesign, animation campaign, or documentation framework migration.
- No automatic social posting or use of authenticated social accounts.
- No fabricated benchmarks, endorsements, users, or security claims.

## Verification and Acceptance

The change is accepted when:

- a first-time library author can identify the problem and intended audience
  from the README’s opening sections;
- README, website, and focused docs consistently explain owner versus consumer;
- SDK, registry, and plugin examples are executable and tested;
- comparison claims are precise and limitations remain prominent;
- every public export has useful API documentation;
- all marketing drafts are complete, channel-specific, and publication-ready
  after final human review;
- the package tarball still excludes website, docs source, tests, and marketing;
- `npm run release:check` passes;
- the full Playwright browser matrix passes in CI;
- no runtime files or public exports change.

## Delivery Strategy

Implement this as a dedicated pull request based on `main`, independent of the
post-release evidence PR. Keep commits reviewable by grouping documentation and
README work, website work, marketing drafts, and verification updates. The PR
must state that it changes communication only and does not publish marketing
content or a new npm version.
