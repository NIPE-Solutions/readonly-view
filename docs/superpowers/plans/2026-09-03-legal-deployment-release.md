# ReadonlyView Legal, Deployment, and Stable Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bilingual legal pages, production Vercel deployment, reference-grade GitHub automation, and publish `@nipe-solutions/readonly-view@2.0.0` as a verified stable release.

**Architecture:** Keep the Vite site framework-free and add four static legal entry points sharing the existing design system. Use Vercel Git integration for preview/production deployments and the guarded GitHub release workflow for npm OIDC publication after all local and hosted checks pass.

**Tech Stack:** HTML, CSS, TypeScript, Vite 8, Playwright, GitHub Actions, Vercel, GoDaddy DNS, npm trusted publishing.

**Spec:** `docs/superpowers/specs/2026-09-03-legal-deployment-release-design.md`

## Global Constraints

- Publish exactly `@nipe-solutions/readonly-view@2.0.0` publicly under `latest`.
- Use `https://readonly-view.nipesolutions.com` as the production documentation origin.
- Preserve zero runtime dependencies and the framework-free Vite website.
- Reuse the approved NIPE Solutions e.U. legal operator data and bilingual reference text.
- Do not publish until the release commit is merged to `main`, CI is green, and the exact tarball is verified.
- Do not deprecate or otherwise mutate the old `immuview` npm package.

---

### Task 1: Bilingual legal routes and production website metadata

**Files:**
- Create: `website/privacy/index.html`
- Create: `website/impressum/index.html`
- Create: `website/de/datenschutz/index.html`
- Create: `website/de/impressum/index.html`
- Create: `website/legal.css`
- Create: `website/public/robots.txt`
- Create: `website/public/sitemap.xml`
- Create: `website/public/favicon.svg`
- Create: `website/public/favicon-32x32.png`
- Create: `website/public/apple-touch-icon.png`
- Create: `website/public/site.webmanifest`
- Modify: `website/index.html`
- Modify: `website/styles.css`
- Modify: `vite.website.config.ts`
- Modify: `scripts/verify-website.mjs`
- Modify: `test/browser/website.spec.ts`
- Modify: `test/integration/docs-examples.test.ts`

**Interfaces:**
- Consumes: existing `.masthead`, `.brand`, footer, color tokens, and `npm run build:website`.
- Produces: four stable legal routes, language cross-links, canonical production URLs, and multi-page Vite output under `website/dist`.
- Produces: a crisp ReadonlyView tab-icon family derived from the existing `R` brand mark.

- [ ] **Step 1: Add failing build-verification assertions**

Extend `scripts/verify-website.mjs` to read all five built HTML files and assert their defining content:

```js
const pages = new Map([
    ['privacy/index.html', ['Privacy Policy', 'Vercel Inc.', 'no non-essential cookies']],
    ['impressum/index.html', ['Impressum', 'NIPE Solutions e.U.', 'ATU78464412']],
    ['de/datenschutz/index.html', ['Datenschutzerklärung', 'Vercel Inc.', 'Datenschutzbehörde']],
    ['de/impressum/index.html', ['Impressum', 'NIPE Solutions e.U.', 'FN 585066t']],
]);
```

Also assert that the main page links each route and no page contains `v2 alpha`.

Assert that the home page contains examples for nested protection, owner-side live updates, arrays, Map, Set, Date, cycles, shared identity, and mutation rejection.

Assert that all pages link `/favicon.svg`, `/favicon-32x32.png`, `/apple-touch-icon.png`, and `/site.webmanifest`, and that every referenced asset exists in `website/dist`.

- [ ] **Step 2: Run the website check and confirm it fails**

Run: `npm run test:website`

Expected: failure because the legal build outputs do not exist.

- [ ] **Step 3: Add the legal HTML and shared legal layout**

Create semantic pages with one `h1`, a last-updated date, language switch, linked email/phone, company details, and the approved English/German privacy sections. Use a shared `.legal-shell`, `.legal-content`, and `.legal-meta` layout in `website/legal.css`; retain `:focus-visible` and a one-column mobile breakpoint.

- [ ] **Step 4: Configure the Vite multi-page build**

Change `vite.website.config.ts` to resolve these inputs:

```ts
rollupOptions: {
    input: {
        index: resolve(import.meta.dirname, 'website/index.html'),
        privacy: resolve(import.meta.dirname, 'website/privacy/index.html'),
        impressum: resolve(import.meta.dirname, 'website/impressum/index.html'),
        datenschutz: resolve(import.meta.dirname, 'website/de/datenschutz/index.html'),
        'de-impressum': resolve(import.meta.dirname, 'website/de/impressum/index.html'),
    },
},
```

Use root-absolute asset and navigation URLs because production routes are nested.

- [ ] **Step 5: Update the home page, examples, and crawl metadata**

Create an original SVG favicon with a dark rounded-square core, white `R`, and blue membrane accent. Render deterministic 32×32 and 180×180 PNG variants from that SVG, add a minimal web manifest, and add favicon, Apple-touch, manifest, and theme-color tags to every page.

Remove the hero release-status pill entirely. Move `v2` and `zero runtime dependencies` into the proof/metadata area, add canonical/OG production URLs, and add footer links to all legal pages. Add copyable examples for nested objects, owner-side live updates, arrays, Map, Set, Date, cycles, shared identity, and mutation rejection. Add `robots.txt` and a sitemap containing the five canonical URLs.

Extend `test/integration/docs-examples.test.ts` with executable equivalents of the new examples, including:

```ts
const shared = { id: 1 };
const source = {
    items: [shared],
    map: new Map([['selected', shared]]),
    set: new Set([shared]),
};
const view = readonlyView(source);
expect(view.items[0]).toBe(view.map.get('selected'));
expect([...view.set][0]).toBe(view.items[0]);
expect(() => Reflect.set(view.items[0], 'id', 2)).toThrow(
    DirectMutationError,
);
```

- [ ] **Step 6: Add browser route coverage**

Add a Playwright test that opens each route and checks its heading, language link, footer, and absence of horizontal overflow:

```ts
for (const [route, heading] of legalRoutes) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth)).toBeLessThanOrEqual(
        await page.evaluate(() => document.documentElement.clientWidth),
    );
}
```

- [ ] **Step 7: Verify and commit**

Run: `npm run test:website && npm run test:browser -- --project=chromium`

Expected: all website and Chromium tests pass.

Commit: `feat(website): add bilingual legal pages`

### Task 2: Vercel configuration and public metadata

**Files:**
- Create: `vercel.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `SECURITY.md`
- Modify: `docs/compatibility.md`
- Modify: `scripts/verify-release.mjs`

**Interfaces:**
- Consumes: `npm run build:website` and `website/dist` from Task 1.
- Produces: repeatable Vercel builds and a single canonical documentation origin across metadata.

- [ ] **Step 1: Add failing metadata verification**

Extend `scripts/verify-release.mjs` with exact assertions:

```js
assert(pkg.homepage === 'https://readonly-view.nipesolutions.com', 'Homepage is stale');
const vercel = JSON.parse(await readFile(resolve(root, 'vercel.json'), 'utf8'));
assert(vercel.buildCommand === 'npm run build:website', 'Unexpected Vercel build');
assert(vercel.outputDirectory === 'website/dist', 'Unexpected Vercel output');
```

- [ ] **Step 2: Confirm the release verifier fails**

Run: `node scripts/verify-release.mjs`

Expected: failure because package homepage and `vercel.json` are not production-ready.

- [ ] **Step 3: Add Vercel configuration**

Create:

```json
{
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "buildCommand": "npm run build:website",
    "framework": null,
    "installCommand": "npm ci",
    "outputDirectory": "website/dist"
}
```

- [ ] **Step 4: Update public URLs and package version**

Run `npm version 2.0.0 --no-git-tag-version`, set `homepage` to the production domain, and update README, security, and compatibility links. Confirm both `package-lock.json` version fields equal `2.0.0`.

- [ ] **Step 5: Verify and commit**

Run: `npm run build:website && node scripts/verify-release.mjs`

Expected: both commands pass for `@nipe-solutions/readonly-view@2.0.0`.

Commit: `chore(release): prepare v2 production metadata`

### Task 3: Reference-grade CI and guarded release workflow

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/release.yml`
- Modify: `docs/RELEASING.md`
- Modify: `CONTRIBUTING.md`

**Interfaces:**
- Consumes: `npm run release:check`, Playwright projects, packed artifact output, npm channel verifier.
- Produces: dependency-ordered CI, failure diagnostics, and a stable-only guarded release path using GitHub environment `npm`.

- [ ] **Step 1: Validate workflow syntax before edits**

Run: `npx prettier --check .github/workflows/ci.yml .github/workflows/release.yml`

Expected: pass, establishing the existing baseline.

- [ ] **Step 2: Align the CI workflow**

Use `actions/checkout@v7`, retain `actions/setup-node@v7` and `actions/upload-artifact@v7`, change primary quality to `npm run release:check`, make Node 22 and browser jobs depend on `quality`, and upload `playwright-report/` plus `test-results/` only on browser failure. Keep Chromium, Firefox, WebKit, packed artifact, Node 22, concurrency, and read-only permissions.

- [ ] **Step 3: Tighten stable release validation**

Use `actions/checkout@v7`, keep exact confirmation `publish 2.0.0 with latest`, require `main`, use environment `npm`, grant `id-token: write` only to publish, verify `2.0.0` is absent before publish, then verify registry propagation before the GitHub release. Preserve generic version inputs for future releases but enforce stable/latest through `verify-release-channel.mjs`.

- [ ] **Step 4: Document hosted deployment and publication**

Update `docs/RELEASING.md` and `CONTRIBUTING.md` with Vercel Git behavior, custom domain, npm environment/trusted-publisher tuple, exact dispatch inputs, post-publish checks, and rollback/non-republish guidance.

- [ ] **Step 5: Verify and commit**

Run: `npm run format:check && npm run lint && node scripts/verify-release-channel.mjs latest`

Expected: all commands pass.

Commit: `ci: align deployment and stable release gates`

### Task 4: Finalize changelog and verify the release candidate

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `docs/release-readiness.md`

**Interfaces:**
- Consumes: completed Tasks 1–3 and version `2.0.0`.
- Produces: an auditable stable changelog and exact local release evidence.

- [ ] **Step 1: Promote release notes**

Leave an empty `## Unreleased` section and move the complete v2 notes beneath `## 2.0.0 - 2026-09-03`, retaining Breaking Changes, Added, Fixed, Performance, and Documentation headings.

- [ ] **Step 2: Run the practical local gate**

Run: `npm ci && npm run release:check`

Expected: formatting, lint, TypeScript, 65+ semantic tests, type tests, size, packed consumers, website verification, benchmark smoke, release metadata, and tarball creation all pass.

- [ ] **Step 3: Run the browser matrix**

Run: `npm run test:browser`

Expected: Chromium, Firefox, and WebKit pass, except the repository's documented macOS 14 WebKit exclusion when applicable.

- [ ] **Step 4: Inspect the exact package**

Run: `npm pack --dry-run --json` and `tar -tzf .artifacts/nipe-solutions-readonly-view-2.0.0.tgz`

Expected: only package metadata, README, LICENSE, changelog, and intended `dist` files; no tests, website source, benchmarks, source maps, or private modules.

- [ ] **Step 5: Record measurements and commit**

Update `docs/release-readiness.md` with exact test totals, tarball sizes, minified/gzip sizes, browser results, and the pending hosted steps.

Commit: `docs: finalize readonly-view 2.0.0 release notes`

### Task 5: Review, merge, and Vercel production deployment

**Files:**
- External: GitHub pull request and CI
- External: Vercel project for `NIPE-Solutions/readonly-view`
- External: GoDaddy DNS for `nipesolutions.com`

**Interfaces:**
- Consumes: reviewed release branch and `vercel.json`.
- Produces: green `main`, Vercel preview/production deployments, DNS verification, and valid HTTPS at the production origin.

- [ ] **Step 1: Push and open a focused pull request**

Push the release-preparation branch, open a PR against `main`, and include legal routes, workflow deltas, local gate evidence, package version, and explicit statement that npm is not yet published.

- [ ] **Step 2: Review CI and preview deployment**

Wait for quality, Node 22, Chromium, Firefox, WebKit, and Vercel preview checks. Open the preview and verify the home page plus all legal routes on desktop and mobile.

- [ ] **Step 3: Merge and verify production CI**

Merge only after all required checks pass, then wait for the `main` CI run to finish successfully.

- [ ] **Step 4: Link the Vercel project**

In the authenticated Vercel account, import `NIPE-Solutions/readonly-view`, select the appropriate NIPE Solutions team, confirm production branch `main`, and verify that Vercel reads the committed build and output settings.

- [ ] **Step 5: Configure the custom domain**

Add `readonly-view.nipesolutions.com` to the Vercel project, read the exact required DNS record, create that record in the authenticated GoDaddy account, and wait for Vercel to report a valid configuration and issued TLS certificate.

- [ ] **Step 6: Verify production**

Check status 200, canonical URL, title, home interaction, all four legal routes, sitemap, robots, and HTTPS using both browser inspection and HTTP requests.

### Task 6: npm trusted publishing and irreversible stable release

**Files:**
- External: GitHub environment `npm`
- External: npm organization/package trusted-publisher settings
- External: GitHub Actions Release run
- External: npm package and GitHub release

**Interfaces:**
- Consumes: green merge commit on `main`, exact version `2.0.0`, npm organization access, production documentation.
- Produces: public `@nipe-solutions/readonly-view@2.0.0`, `latest` dist-tag, provenance, and GitHub `v2.0.0` release.

- [ ] **Step 1: Configure GitHub release protection**

Create the repository environment `npm`, restrict it to `main`, and add the authenticated owner as a required reviewer when the repository plan supports reviewers. Do not add a long-lived npm token.

- [ ] **Step 2: Configure npm trusted publishing**

In npm organization/package settings, configure repository `NIPE-Solutions/readonly-view`, workflow `release.yml`, environment `npm`. If npm cannot create the package through OIDC, perform only the minimum authenticated first-publication setup allowed by npm, then retain OIDC for future releases.

- [ ] **Step 3: Reconfirm registry absence and commit identity**

Run: `npm view @nipe-solutions/readonly-view@2.0.0 version`

Expected before publication: npm `E404`. Confirm the release workflow SHA equals the reviewed green `main` SHA.

- [ ] **Step 4: Dispatch the release**

Run:

```bash
gh workflow run release.yml --ref main \
  -f version=2.0.0 \
  -f channel=latest \
  -f 'confirmation=publish 2.0.0 with latest'
```

Approve the protected `npm` environment deployment when prompted and monitor every job through registry propagation and GitHub release creation.

- [ ] **Step 5: Verify the public package**

Run:

```bash
npm view @nipe-solutions/readonly-view@2.0.0 name version dist-tags.latest repository homepage
npm exec --yes --package=@nipe-solutions/readonly-view@2.0.0 -- \
  node -e "import('@nipe-solutions/readonly-view').then(m => console.log(typeof m.readonlyView))"
gh release view v2.0.0 --repo NIPE-Solutions/readonly-view
```

Expected: exact name/version, `latest` equals `2.0.0`, production homepage, import prints `function`, provenance is visible in npm, and the GitHub release exists.

- [ ] **Step 6: Record final release evidence**

Update the release-readiness record or GitHub release notes with the production site, CI run, npm version, provenance, tarball integrity, and known limitations. Do not modify the old `immuview` package.
