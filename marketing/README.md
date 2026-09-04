# ReadonlyView launch library

> Status: draft only. Nothing in this directory is approved or published.

This directory contains launch-ready source material for `@nipe-solutions/readonly-view`. Every draft is for manual human review and manual publication. There is no publishing automation in this directory.

## Campaign brief

### Goal

Help TypeScript and JavaScript library authors recognize a specific ownership problem: an owner needs to keep changing a live object graph, while consumers need to inspect that graph without receiving a mutation path through the public reference.

The campaign should make the decision easy:

- use ReadonlyView for a lazy, live, deeply readonly access path;
- use another tool when the requirement is a snapshot, immutable state production, freezing the owner, subscriptions, or isolation from hostile code.

The campaign is successful when a reader can explain both what ReadonlyView does and what it deliberately does not do. Do not define success using unverified download, adoption, conversion, performance, or security claims.

### Primary audiences

1. **SDK and library authors** who expose connection, session, cache, registry, or diagnostic state.
2. **Plugin and platform authors** who give extensions a live context but want writes to stay behind host-owned APIs.
3. **TypeScript developers** who understand compile-time `readonly` and need to decide whether runtime enforcement belongs at a boundary.
4. **JavaScript infrastructure maintainers** interested in Proxy invariants, membranes, and fail-closed API design.

### Canonical positioning

> Expose live internal data without exposing mutation.

ReadonlyView is a lazy, live, deeply readonly runtime membrane with TypeScript types. The owner keeps the mutable source. Consumers receive a separate view that follows owner-side changes and rejects writes made through supported view paths.

Always include the limit alongside the promise: ReadonlyView does not freeze the source, revoke other mutable aliases, manage state, create snapshots, or isolate hostile JavaScript.

## Draft inventory

| File                                                     | Purpose                                                     | Suggested destination                                                          |
| -------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [`launch-announcement.md`](launch-announcement.md)       | Channel-native launch copy                                  | GitHub/NIPE, personal LinkedIn, NIPE LinkedIn, X/Bluesky, relevant communities |
| [`technical-article.md`](technical-article.md)           | Explain the JavaScript mechanics behind a readonly membrane | Engineering blog or article platform                                           |
| [`comparison-article.md`](comparison-article.md)         | Help readers choose among readonly and immutable tools      | Engineering blog, documentation, or article platform                           |
| [`sdk-tutorial.md`](sdk-tutorial.md)                     | Build and test a live readonly SDK state surface            | Engineering blog or tutorial platform                                          |
| [`mutation-escape-thread.md`](mutation-escape-thread.md) | Seven concrete ways a naive readonly Proxy can leak values  | X, Bluesky, Mastodon, or another threaded channel after length review          |

## Recommended publication sequence

1. **Run the launch checklist below.** Confirm the package version, links, examples, claims, and target-channel rules on the actual publication date.
2. **Publish the GitHub/NIPE announcement.** Treat it as the short source-of-truth launch note and link it from later posts if the destination supports that pattern.
3. **Publish the technical article.** It supplies the reasoning behind the implementation and gives technical readers something useful beyond the announcement.
4. **Publish the comparison article.** It catches readers who have the ownership problem but may need a snapshot, freeze, or immutable-update workflow instead.
5. **Publish the SDK tutorial.** It turns the positioning into an adoptable pattern with consumer-side and owner-side tests.
6. **Publish the personal and NIPE LinkedIn posts at different times.** The personal post tells the engineering story; the company post frames the library as a focused open-source primitive.
7. **Publish one short-form thread.** Choose the launch thread in `launch-announcement.md` for product context or `mutation-escape-thread.md` for Proxy mechanics. Do not post both back-to-back.
8. **Adapt the community draft separately for each community.** Answer questions in the venue and disclose the author/project relationship where required.

This is a sequence, not an automation schedule. A human chooses destinations and dates.

## Canonical URLs

Use these URLs unless the destination requires a channel-specific campaign link:

- Product and documentation site: <https://readonly-view.nipesolutions.com/>
- Repository: <https://github.com/NIPE-Solutions/readonly-view>
- npm package: <https://www.npmjs.com/package/@nipe-solutions/readonly-view>
- Ownership mental model: <https://github.com/NIPE-Solutions/readonly-view/blob/main/docs/mental-model.md>
- Use cases: <https://github.com/NIPE-Solutions/readonly-view/blob/main/docs/use-cases.md>
- Choosing an approach: <https://github.com/NIPE-Solutions/readonly-view/blob/main/docs/choosing-an-approach.md>
- Guarantees and non-guarantees: <https://github.com/NIPE-Solutions/readonly-view/blob/main/docs/guarantees.md>
- Supported types: <https://github.com/NIPE-Solutions/readonly-view/blob/main/docs/supported-types.md>
- Security and trust model: <https://github.com/NIPE-Solutions/readonly-view/blob/main/docs/security-and-trust.md>

Do not invent tracking URLs, shortened links, testimonials, customer logos, or publication URLs before they exist.

## Voice

- **Precise before promotional.** Name the ownership boundary and lifecycle instead of calling the package “magic,” “bulletproof,” or “the only solution.”
- **Educational.** Give readers a useful mental model or example even if they never install the package.
- **Direct and calm.** Prefer “writes through the view throw” over threat language.
- **Fair to alternatives.** TypeScript `readonly`, freezing, snapshots, and Immer-style workflows solve legitimate but different problems.
- **Concrete.** Say who owns the source, who receives the view, which writes remain allowed, and which access path rejects writes.
- **Transparent.** In personal or community posts, disclose the author’s relationship to the project according to the channel’s rules.

Capitalize the project as **ReadonlyView**. Use the exact package name `@nipe-solutions/readonly-view` in every standalone launch post.

## Claims that must not be published

Do not claim or imply any of the following:

- that ReadonlyView is a security sandbox, capability isolation for hostile JavaScript, or a substitute for process/realm isolation;
- that it prevents the owner or holders of another mutable alias from changing the source;
- that it is a state manager, subscription system, mutation API, clone, frozen snapshot, deep freeze, or Immer replacement;
- that all JavaScript values are supported or that arbitrary user getters, functions, and consumer proxies are made side-effect-free;
- that it has “zero overhead,” is faster than another approach, or improves application performance;
- adoption, customer, production-usage, reliability, audit, certification, vulnerability, or incident claims without current public evidence;
- bundle-size, dependency, compatibility, or version claims copied from memory instead of confirmed from the release artifact and current package metadata;
- that a TypeScript error alone is runtime protection, or that the runtime membrane makes an unsupported type safe.

It is accurate to say that supported view paths reject writes, nested wrapping is lazy, owner changes remain visible, and unsupported values fail explicitly. Keep those statements scoped exactly that way.

## Launch checklist

Complete this checklist separately for every destination immediately before publication:

- [ ] Confirm the destination’s current rules for promotional content, disclosures, links, hashtags, formatting, post length, code blocks, edits, and cross-posting.
- [ ] Disclose the author’s or NIPE Solutions’ relationship to ReadonlyView wherever the channel requires it; when uncertain, disclose plainly.
- [ ] Open every included link in a clean browser session and verify that it is live, public, canonical, and points to the intended version.
- [ ] Install the released package in a clean temporary project and run every code example exactly as rendered by the destination.
- [ ] Check code fences, syntax highlighting, smart quotes, escaped characters, indentation, and line wrapping after pasting into the destination editor.
- [ ] Confirm the released package name and exact version from npm, the supported Node/browser range from current documentation, and the publication date.
- [ ] Revalidate any bundle-size, dependency, compatibility, or benchmark statement against the release artifact; delete it if it is not necessary.
- [ ] Confirm that the post says what ReadonlyView is **not**: at minimum, not a sandbox and not a state manager.
- [ ] Confirm that the post does not imply protection for other aliases, owner-side immutability, or support for values outside the current type inventory.
- [ ] Proofread once for technical accuracy and once for plain-language flow; have a second human review long-form articles.
- [ ] Replace or remove any venue placeholders, optional hashtags, or disclosure notes.
- [ ] Record the final published URL outside this repository only after a human publishes the piece.

## Source-of-truth rule

If a marketing draft and the released documentation disagree, stop publication and update the draft from the released documentation. Marketing copy is downstream of the contract; it does not redefine it.
