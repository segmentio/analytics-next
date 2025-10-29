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
1. Run prepare scripts
2. Publish all packages to npm, pushes _all_ tags to github (e.g. "@segment/analytics-next@1.7.0", "@segment/analytics-node@1.2.3", etc) (Buildkite)
3. Triggets an update of the github releases page (Github Actions)

### How do I fix the repo if all the packages were published, but the CI Failed to update the [github releases page](https://github.com/segmentio/analytics-next/releases)?
```bash
# checkout master so the HEAD is pointing to the "Version Packages" PR
git co master && git pull --ff-only

# Reads from the current tags and create github releases
export GITHUB_TOKEN="???"
yarn scripts create-release-from-tags
```


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

## NPM Token Management

### How to Rotate/Update NPM Tokens

The repository uses an NPM token stored in GitHub Actions secrets (`NPM_TOKEN`) to publish packages automatically. Due to npm's security updates, tokens now have a maximum 90-day lifetime and classic tokens will be revoked. You should use **Granular Access Tokens** for better security.

#### Creating a New NPM Token

1. **Generate a new token at npm**:
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Granular Access Token"
   - Configure the token:
     - **Token Name**: Something descriptive like "analytics-next-ci"
     - **Expiration**: 90 days (maximum)
     - **Permissions**: Select "Read and write"
     - **Packages and scopes**: Select packages in `@segment` organization
   - Copy the token (starts with `npm_`)

2. **Test the token locally**:
   ```bash
   # Add token to your ~/.npmrc
   echo "//registry.npmjs.org/:_authToken=YOUR_NEW_TOKEN" > ~/.npmrc

   # Verify authentication
   npm whoami

   # Build packages
   yarn build

   # Test dry-run publish (doesn't actually publish)
   cd packages/core && npm publish --dry-run
   cd ../browser && npm publish --dry-run
   cd ../node && npm publish --dry-run
   ```

3. **Update GitHub Actions Secret**:
   - Go to: https://github.com/segmentio/analytics-next/settings/secrets/actions
   - Update secret for `NPM_TOKEN`