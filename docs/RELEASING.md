# Releasing

Releases are manual and protected.

1. Use Node 24 and run `npm ci`.
2. Update version and promote Unreleased notes.
3. Run `npm run release:check` and the browser matrix.
4. Review `npm pack --dry-run`, declarations, budgets, and license.
5. Dispatch release with exact version/channel/confirmation.
6. Verify registry propagation and GitHub release.

Stable versions use `latest`; prereleases use `next`. Never publish during implementation.
