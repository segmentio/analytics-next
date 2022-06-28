## Releasing

This repo makes use of the [changesets](https://github.com/changesets/changesets) package to manage changelog generation, and publishing, and pushing appropriate github tags.


"A changeset is an intent to release a set of packages at particular semver bump types with a summary of the changes made.

The [@changesets/cli] package allows you to write changeset files as you make changes, then combine any number of changesets into a release, that flattens the bump-types into a single release per package, handles internal dependencies in a multi-package-repository, and updates changelogs, as well as release all updated packages from a mono-repository with one command."

To see what changes are going into the next release, run:
```
yarn changeset info
```
To test what the changelog will look like beforehand (locally), you can run:
```sh
% export GITHUB_TOKEN=<MY GITHUB TOKEN> // neccessary to get links to contributors
% yarn changeset version
```
(see https://github.com/settings/tokens)

Once you have tested your changes and they have been approved for a new release, merge the changeset pull request into master.



## How releasing works
1. As PRs are merged into master, we use a [special GitHub action](https://github.com/changesets/action) to updates the package versions and changelogs, automatically creating a `Versions Packages` PR.
2. Once we're ready to publish a new release, we can look at the `Version Packages` PR. If we like the way the Changelog looks, we can merge it in right there. If we want to edit the generated changelog, we can edit the changelog directly on that PR and then merge. If we aren't ready to merge things in and we want to add more detail to a changeset, we can always edit the changeset in .changesets/* and merge those in. Changesets are just text files, and are meant to be human-editable.

### Releasing is handled for us by the [Release GitHub Action](/.github/workflows/release.yml).

As PRs are opened against `master`, this action will open and update a PR which generates the appropriate `CHANGELOG.md` entries and `package.json` version bumps.
The generated PR has the title "Version Packages"

Once ready for a release, approve the "Version Packages" PR and merge it into `master`.

### Feature branches

Feature branches are automatically released under:

- `http://cdn.segment.com/analytics-next/br/<branch>/<latest|sha>/standalone.js.gz`
