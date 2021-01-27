# analytics-next

Client Side Instrumentation Platform.

## Get started

```sh
git clone git@github.com:segmentio/analytics-next.git
cd analytics-next
make dev
```

## Testing

The tests are written in [Jest](https://jestjs.io) and can be run be using `make test-unit`
Linting is done using [ESLint](https://github.com/typescript-eslint/typescript-eslint/) and can be run using `make lint`.

## Releasing

Once you have tested your changes and they have been approved for a new release, merge your pull request and follow the steps:

- `make release-prod` - this will compile the code, create a new version and publish the changes to s3
- `make rebuild-sources-prod` - rebuild all sources that use AJS Next
