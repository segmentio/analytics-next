## Releasing

This repo makes use of the [changesets](https://github.com/changesets/changesets) package to manage changelog generation, and publishing, and pushing appropriate github tags.
## What is a `changeset`?
> "A changeset is an intent to release a set of packages at particular semver bump types with a summary of the changes made."

Read: [An introduction to using changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md).





To see what changes are going into the next release, run:
```
yarn changeset info
```
To test what the changelog will look like beforehand (locally), you can run:
```bash
export GITHUB_TOKEN="???"
yarn changeset version
```
(see https://github.com/settings/tokens)

Once you have tested your changes and they have been approved for a new release, merge the changeset pull request into master.



## How releasing works
1. As PRs are merged into master, we use a [special GitHub action](https://github.com/changesets/action) to updates the package versions and changelogs, automatically creating a `Versions Packages` PR.
2. Once we're ready to publish a new release, we can look at the `Version Packages` PR. If we like the way the Changelog looks, we can merge it in right there. If we want to edit the generated changelog, we can edit the changelog directly on that PR and then merge. If we aren't ready to merge things in and we want to add more detail to a changeset, we can always edit the changeset in .changesets/* and merge those in. Changesets are just text files, and are meant to be human-editable.

### Creating a Changelog and releasse is handled for us by the [Release GitHub Action](https://github.com/changesets/action).

As PRs are opened against `master`, this action will open and update a PR which generates the appropriate `CHANGELOG.md` entries and `package.json` version bumps.
The generated PR has the title "Version Packages"

Once ready for a release, approve the "Version Packages" PR and merge it into `master`.

Feel free to edit the "Version Packages" PR. If you see a merge conflict in Version Packages, that PR can be closed and a new PR should automatically re-open.

## FAQ

### How do I publish packages to npm / create a new release?
1. Merge the `Version Packages` PR.

### What does merging in `Version Packages` PR do under the hood?
Information is in the [@changesets automation instructions](https://github.com/changesets/changesets/blob/main/docs/automating-changesets.md#how-do-i-run-the-version-and-publish-commands)

### How does the changeset bot and changeset github action work?
[Check out the @changesets automation instructions](https://github.com/changesets/changesets/blob/main/docs/automating-changesets.md#automating-changesets)

### What does `yarn release` do?
- run prepare scripts
- publish all packages to npm
- pushes tags to repo
- triggers a github release on CI (via tags)
- triggers a CDN release

### I don't want to use automation, how do I manually create a release?

```bash
export GITHUB_TOKEN="???" ## changelog generator requirement (https://github.com/settings/tokens)

yarn update-versions-and-changelogs && ## bump +  generate changelog + delete old changesets
git add . && # add generated artifacts
git commit -m "v1.X.X" &&
yarn release
```

### Feature branches

Feature branches are automatically released under:

- `http://cdn.segment.com/analytics-next/br/<branch>/<latest|sha>/standalone.js.gz`
