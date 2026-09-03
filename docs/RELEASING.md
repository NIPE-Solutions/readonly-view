# Releasing

Releases are manual, protected, and run only from `main`. The current workflow is
locked to the first stable release: `@nipe-solutions/readonly-view@2.0.0` on the
`latest` npm channel. Its inputs remain versioned so a future release can update
the explicit authorization gate without redesigning the workflow.

## Hosted documentation

Vercel's Git integration owns documentation deployments for the
`NIPE-Solutions/readonly-view` repository. Pull requests receive preview
deployments; a merge to the production branch, `main`, creates the production
deployment using the committed `vercel.json`. The production project must have
`readonly-view.nipesolutions.com` attached as its custom domain with valid DNS
and TLS before npm publication. Verify the home page, all four legal routes,
`/robots.txt`, and `/sitemap.xml` on that HTTPS origin.

If a documentation deployment is defective, restore the previous known-good
Vercel deployment immediately and follow with a reviewed revert or fix on
`main`. Do not publish a package merely to repair the hosted documentation.

## One-time npm and GitHub setup

Create a protected GitHub environment named `npm`, restrict deployments to
`main`, and require a reviewer when the repository plan supports it. Configure
the npm trusted publisher with this exact tuple:

- repository owner/name: `NIPE-Solutions/readonly-view`
- workflow filename: `release.yml`
- GitHub environment: `npm`

Use OIDC trusted publishing; do not add a long-lived npm token.

## Stable 2.0.0 procedure

1. On the reviewed `main` commit, use Node 24 and run `npm ci`,
   `npm run release:check`, and `npm run test:browser`.
2. Review `npm pack --dry-run`, declarations, bundle budgets, license, and the
   exact tarball. Confirm the production documentation checks above pass.
3. Confirm `npm view @nipe-solutions/readonly-view@2.0.0 version` returns an npm
   `E404`; an existing version must never be overwritten.
4. Dispatch the protected workflow with exactly these inputs:

    ```bash
    gh workflow run release.yml --ref main \
      -f version=2.0.0 \
      -f channel=latest \
      -f 'confirmation=publish 2.0.0 with latest'
    ```

5. Approve the `npm` environment deployment, then monitor the publish job. It
   reconfirms registry absence, publishes with provenance, waits for registry
   propagation, and only then allows creation of GitHub release `v2.0.0`.
6. Verify the public result:

    ```bash
    npm view @nipe-solutions/readonly-view@2.0.0 name version dist-tags.latest repository homepage
    npm exec --yes --package=@nipe-solutions/readonly-view@2.0.0 -- \
      node -e "import('@nipe-solutions/readonly-view').then(m => console.log(typeof m.readonlyView))"
    gh release view v2.0.0 --repo NIPE-Solutions/readonly-view
    ```

The metadata must report version `2.0.0`, `latest` must resolve to `2.0.0`, the
homepage must be `https://readonly-view.nipesolutions.com`, the import must print
`function`, npm must show provenance, and the GitHub release must exist.

npm versions are immutable: never attempt to republish `2.0.0`. If the package
is defective, deprecate it with a precise warning when appropriate, publish a
reviewed patch version, and move `latest` only through the guarded workflow. Do
not deprecate or otherwise mutate the old `immuview` package.
