## Releasing

### Feature branches

Feature branches are automatically released under:

- `http://cdn.segment.com/analytics-next/br/<branch>/<latest|sha>/standalone.js.gz`

### Production

Once you have tested your changes and they have been approved for a new release, merge your pull request and follow the steps:

- `make release`
  > creates a release tag that is then compiled and published in CI
