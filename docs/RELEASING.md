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

## First-publication authentication

Create a protected GitHub environment named `npm`, restrict deployments to
`main`, and require a reviewer when the repository plan supports it. Because npm
does not allow trusted-publisher setup until the package exists, the initial
`2.0.0` publication uses a short-lived granular npm access token:

1. Immediately before dispatch, create a granular token with the shortest
   practical expiry. Scope its package and organization permissions only as
   narrowly as npm permits for the initial `@nipe-solutions/readonly-view`
   publication, grant the required package write access, and select the token's
   `Bypass 2FA` option. Bypassing 2FA is required for this non-interactive direct
   publication because GitHub Actions cannot enter a one-time password.
2. Add it as an environment secret named `NPM_TOKEN` on the protected `npm`
   environment, not as a repository-wide secret. Only the `publish` job reads
   it.
3. After `2.0.0` exists and all checks below pass, configure the npm trusted
   publisher with this exact tuple:

    - repository owner/name: `NIPE-Solutions/readonly-view`
    - workflow filename: `release.yml`
    - GitHub environment: `npm`

4. Immediately after the trusted publisher is configured, delete the
   `NPM_TOKEN` GitHub environment secret and revoke the granular token before
   any further release work. For future versions, update the explicit release
   authorization and remove `NODE_AUTH_TOKEN` from the publish step so npm
   authenticates through the trusted publisher.

The initial workflow uses the token for registry authentication and the
publish job's OIDC permission for `--provenance`; it is not an OIDC-only
publication. Never use a long-lived npm token.

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
   downloads the single tarball produced by the verified job, reconfirms
   registry absence, publishes those exact bytes with provenance, waits for
   registry propagation, and only then creates GitHub release `v2.0.0` at the
   immutable workflow commit.
6. Verify the public result:

    ```bash
    npm view @nipe-solutions/readonly-view@2.0.0 name version dist-tags.latest repository homepage
    test -n "$(npm view @nipe-solutions/readonly-view@2.0.0 dist.attestations.url)"

    consumer_dir="$(mktemp -d)"
    (
      cd "$consumer_dir"
      npm init --yes >/dev/null
      npm install --ignore-scripts --save-exact @nipe-solutions/readonly-view@2.0.0
      node --input-type=module -e \
        "import('@nipe-solutions/readonly-view').then(m => console.log(typeof m.readonlyView))"
    )

    for route in / /privacy/ /impressum/ /de/datenschutz/ /de/impressum/ /robots.txt /sitemap.xml; do
      curl --fail --silent --show-error --location \
        "https://readonly-view.nipesolutions.com${route}" >/dev/null
    done

    gh release view v2.0.0 --repo NIPE-Solutions/readonly-view \
      --json tagName,targetCommitish,url
    ```

The metadata must report version `2.0.0`, `latest` must resolve to `2.0.0`, the
homepage must be `https://readonly-view.nipesolutions.com`, the import must print
`function` from the temporary consumer, the attestation URL must be nonempty,
all production requests must succeed over HTTPS, and the GitHub release target
must match the dispatched `main` SHA. Remove `consumer_dir` after inspection.

npm versions are immutable: never attempt to republish `2.0.0`. If the package
is defective, deprecate it with a precise warning when appropriate, publish a
reviewed patch version, and move `latest` only through the guarded workflow. Do
not deprecate or otherwise mutate the old `immuview` package.
