# analytics-next

Client Side Instrumentation Platform.

## Get started

### Development

```sh
git clone git@github.com:segmentio/analytics-next.git
cd analytics-next
make dev
```

### Enabling AJSN

To enable analytics-next for a source you must first add your workspace to flagon. To do this, run the following command in slack

```sh
/flagon-{stage/prod} -f app-ui-analytics-js -n analytics-next {workspaceID}
```

or manually add your workspace ID to the overrides list in the flagon UI (ie. https://flagon.segment.com/families/app-ui-analytics-js/flags/analytics-next).
Once this is done you can navigate to the Settings > Analytics.js tab of your javascript source and toggle analytics-next. Once ajs-renderer has rebuilt your project (<5 minutes), you're all set!

## Testing

The tests are written in [Jest](https://jestjs.io) and can be run be using `make test-unit`
Linting is done using [ESLint](https://github.com/typescript-eslint/typescript-eslint/) and can be run using `make lint`.

To compare payloads of analytics-next and analytics-classic to check parity, see https://github.com/segmentio/analytics-next/blob/master/e2e-tests/README.md

## Releasing

Once you have tested your changes and they have been approved for a new release, merge your pull request and follow the steps:

- `make release-prod` - this will compile the code, create a new version and publish the changes to s3
- `make rebuild-sources-prod` - rebuild all sources that use AJS Next
