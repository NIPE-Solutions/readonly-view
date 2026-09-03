# Contributing

Use Node.js 24 (`.nvmrc`) and npm.

```bash
npm ci
npm run release:check
```

## Commands

- `npm run test:unit`: semantic, integration, regression, and randomized tests.
- `npm run test:types`: compile-time contract.
- `npm run test:package`: real packed ESM/CJS/TypeScript/bundler consumers.
- `npm run test:browser`: Playwright engine matrix.
- `npm run test:size`: artifact budgets.
- `npm run benchmark`: diagnostic benchmarks.
- `npm run build:website`: production documentation site.

Add a failing regression test before fixing a defect. Tests should name an observable break and exercise real behavior. Keep changes focused, document public behavior, and explain API, compatibility, size, or security impact in the pull request.

## Deployment and release changes

Vercel's Git integration creates previews for pull requests and deploys
documentation from `main` to the custom domain
`https://readonly-view.nipesolutions.com`. Changes to `vercel.json`, public URLs,
legal routes, DNS expectations, or release automation must describe their preview
and production verification in the pull request.

Publishing is restricted to the protected GitHub environment `npm` and the npm
trusted-publisher tuple `NIPE-Solutions/readonly-view`, `release.yml`, `npm`.
The stable release is dispatched from `main` with exactly `version=2.0.0`,
`channel=latest`, and `confirmation=publish 2.0.0 with latest`. After publication,
verify the npm metadata and import, provenance, the `v2.0.0` GitHub release, and
the production site; see [the release runbook](docs/RELEASING.md) for the exact
commands.

Never attempt to overwrite or republish an npm version. A package defect requires
a reviewed patch release (and a precise deprecation warning when appropriate); a
site defect should be rolled back in Vercel and corrected on `main`. Do not
deprecate or otherwise mutate the old `immuview` package.
