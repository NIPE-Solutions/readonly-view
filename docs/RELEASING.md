# Releasing

Releases are manual, protected, and run only from `main`. The workflow requires
an exact version, npm channel, and matching confirmation phrase. Stable versions
use `latest`; prereleases use `next`.

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

## Trusted publishing

The protected GitHub environment is named `npm`, permits only `main`, and
requires review. npm trusts this exact publisher tuple:

    - repository owner/name: `NIPE-Solutions/readonly-view`
    - workflow filename: `release.yml`
    - GitHub environment: `npm`

The workflow uses GitHub's short-lived OIDC identity and npm provenance. No npm
token secret is stored in GitHub. npm publishing access is set to require 2FA
and disallow bypass-2FA tokens. Do not add a long-lived npm token.

## Release procedure

1. On the reviewed `main` commit, use Node 24 and run `npm ci`,
   `npm run release:check`, and `npm run test:browser`.
2. Review `npm pack --dry-run`, declarations, bundle budgets, license, and the
   exact tarball. Confirm the production documentation checks above pass.
3. Confirm `npm view @nipe-solutions/readonly-view@<version> version` returns an npm
   `E404`; an existing version must never be overwritten.
4. Dispatch the protected workflow with matching inputs:

    ```bash
    version=2.0.1
    channel=latest
    gh workflow run release.yml --ref main \
      -f version="$version" \
      -f channel="$channel" \
      -f "confirmation=publish $version with $channel"
    ```

5. Approve the `npm` environment deployment, then monitor the publish job. It
   downloads the single tarball produced by the verified job, reconfirms
   registry absence, publishes those exact bytes with provenance, waits for
   registry propagation, and only then creates GitHub release `v<version>` at the
   immutable workflow commit.
6. Verify the public result:

    ```bash
    version=2.0.1
    channel=latest
    npm view "@nipe-solutions/readonly-view@$version" name version "dist-tags.$channel" repository homepage
    test -n "$(npm view "@nipe-solutions/readonly-view@$version" dist.attestations.url)"

    consumer_dir="$(mktemp -d)"
    (
      cd "$consumer_dir"
      npm init --yes >/dev/null
      npm install --ignore-scripts --save-exact "@nipe-solutions/readonly-view@$version"
      node --input-type=module -e \
        "import('@nipe-solutions/readonly-view').then(m => console.log(typeof m.readonlyView))"
    )

    for route in / /privacy/ /impressum/ /de/datenschutz/ /de/impressum/ /robots.txt /sitemap.xml; do
      curl --fail --silent --show-error --location \
        "https://readonly-view.nipesolutions.com${route}" >/dev/null
    done

    gh release view "v$version" --repo NIPE-Solutions/readonly-view \
      --json tagName,targetCommitish,url
    ```

The metadata must report the requested version, the requested channel must
resolve to that version, the
homepage must be `https://readonly-view.nipesolutions.com`, the import must print
`function` from the temporary consumer, the attestation URL must be nonempty,
all production requests must succeed over HTTPS, and the GitHub release target
must match the dispatched `main` SHA. Remove `consumer_dir` after inspection.

npm versions are immutable: never attempt to republish an existing version. If the package
is defective, deprecate it with a precise warning when appropriate, publish a
reviewed patch version, and move `latest` only through the guarded workflow. Do
not deprecate or otherwise mutate the old `immuview` package.
