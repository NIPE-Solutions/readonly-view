# ReadonlyView Legal, Deployment, and Stable Release Design

**Status:** Approved on 2026-09-03

## Outcome

ReadonlyView will expose complete bilingual legal pages, deploy its Vite documentation site through Vercel at `https://readonly-view.nipesolutions.com`, align repository automation with the NIPE Solutions reference repository, and publish `@nipe-solutions/readonly-view@2.0.0` under npm's `latest` tag.

## Legal pages

The site will publish four stable routes:

- `/privacy/`
- `/impressum/`
- `/de/datenschutz/`
- `/de/impressum/`

The text and operator data will be adapted from the NIPE Solutions React Spring Bottom Sheet v5 site. The operator is NIPE Solutions e.U., proprietor Nicholas Petrasek, Achtergasse 10, 1230 Wien, Austria. Contact, VAT, company-register, court, authority, chamber, and trade details remain identical to the approved reference pages. Privacy text will describe Vercel hosting, ordinary request logs, email/contact handling, no non-essential cookies or analytics, GDPR rights, and the Austrian data-protection authority. The pages must not claim legal guarantees beyond the source text.

Legal pages use the established ReadonlyView visual system: shared masthead and footer, narrow readable measure, explicit language switching, keyboard-visible focus styles, and responsive layouts. The main footer links all English and German legal routes.

## Website architecture

The existing framework-free Vite website remains in place. Legal pages are static HTML entry points with shared CSS; Vite is configured as a multi-page build so route directories produce deployable `index.html` files. The site remains zero-JavaScript on legal routes and retains the current interactive module only on the documentation home page.

The hero contains only the product proposition, install command, and interactive ownership demonstration. It must not use a release-status pill or the phrase `v2 alpha · zero runtime dependencies`. Version and zero-dependency facts belong in the quieter proof/metadata area.

The documentation home includes concise, copyable code examples for nested objects, owner-side live updates, arrays, Map, Set, Date, circular references, shared identity, and rejected mutations. Examples use the real public API, remain short enough to scan, and are mirrored by automated documentation-example tests rather than presented as decorative code.

Production metadata, canonical URLs, Open Graph URLs, sitemap, robots file, package homepage, and repository documentation use `https://readonly-view.nipesolutions.com`.

The tab icon uses the established ReadonlyView brand mark rather than a generic shield or lock: a dark rounded-square `R` core with a blue membrane accent, simplified for legibility at 16×16. The site ships a scalable SVG favicon plus raster browser and Apple-touch variants, with theme colors and manifest metadata shared by every page.

## Vercel and DNS

The repository will include a `vercel.json` with `npm ci`, `npm run build:website`, and `website/dist` output. The GitHub repository will be connected to Vercel using Git integration: pull requests receive preview deployments and `main` is the production branch. The custom domain is `readonly-view.nipesolutions.com`; its exact Vercel-provided DNS record will be configured in GoDaddy and verified rather than guessed.

## GitHub workflows

Automation follows the reference repository's sequencing and supply-chain model without importing React-specific jobs:

- current pinned major versions for checkout, Node setup, and artifact upload;
- Node 24 primary quality gate and retained Node 22 compatibility gate;
- browser jobs depend on quality and cover Chromium, Firefox, and WebKit;
- Playwright diagnostics upload only on failure;
- release runs only from `main`, requires exact version/channel/confirmation, verifies package and registry state, uses the protected `npm` environment and OIDC trusted publishing, verifies propagation, and creates a GitHub release;
- packed artifact verification, declaration checks, size budgets, website build, and benchmarks remain required.

Vercel deployment uses Vercel Git integration, not duplicated GitHub Actions deployment secrets.

## Stable npm publication

The package name is `@nipe-solutions/readonly-view`, version `2.0.0`, visibility public, and distribution tag `latest`. Package metadata and the lockfile must agree. The changelog will contain a real `2.0.0` entry and a fresh empty `Unreleased` section.

Before publication, the exact packed artifact must pass the full release check and browser matrix. npm trusted publishing will be configured for `NIPE-Solutions/readonly-view`, workflow `release.yml`, environment `npm`, if npm permits initial publication through OIDC. If the registry requires an authenticated first publication, the first release may use the already authenticated npm organization account, but it must still publish the verified artifact with provenance when supported. Publication is followed by registry import checks, provenance inspection, and a GitHub `v2.0.0` release.

The old `immuview` package is outside this change and will be deprecated separately by the owner.

## Release order

1. Add and test legal pages and production metadata.
2. Align workflows and release documentation.
3. Run the full local quality, package, website, and browser gates.
4. Merge the reviewed release-preparation branch to `main` and wait for green CI.
5. Link and deploy Vercel, configure GoDaddy DNS, and verify HTTPS/routes.
6. Configure npm/GitHub trusted publishing and protection.
7. Dispatch the stable release and verify npm and GitHub release state.

Public npm publication must not precede a green release commit on `main`.
