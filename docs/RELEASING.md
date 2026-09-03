# Releasing

Releases are manual and protected.

1. Use Node 24 and run `npm ci`.
2. Update version and promote Unreleased notes.
3. Run `npm run release:check` and the browser matrix.
4. Review `npm pack --dry-run`, declarations, budgets, and license.
5. Configure npm trusted publishing for the `NIPE-Solutions/readonly-view`
   repository and the `release.yml` workflow, with the `npm` GitHub environment
   protected by required reviewers.
6. Dispatch Release from `main` with the exact version, the `next` or `latest`
   channel, and the literal `publish VERSION with CHANNEL` confirmation.
7. Verify registry propagation and create the matching GitHub release.

Stable versions use `latest`; prereleases use `next`. Never publish during implementation.
