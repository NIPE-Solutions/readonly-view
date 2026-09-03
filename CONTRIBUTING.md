# Contributing

Use Node.js 24 (`.nvmrc`) and npm.

```bash
npm ci
npm run check
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
