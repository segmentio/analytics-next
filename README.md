# analytics-next

Add a description of the service here.

## Get started

To add a buildkite status badge for this repo, copy the markdown found here: https://buildkite.com/segment/analytics-next/settings/badges

```sh
git clone git@github.com:segmentio/analytics-next.git
cd analytics-next
robo docker.login
docker-compose up -d
yarn install
yarn dev
```

## Running

After starting the dependent Docker services by running `robo docker.login` and `docker-compose up -d`, the server can be started using `yarn dev`. The server can also be started using the VS Code launch config instead, which will run the server inside VS Code and automatically reconnect the debugger after each code change.

## Testing

The tests are written in [Jest](https://jestjs.io) and can be run be using `yarn test` or `yarn test --watch`.

Linting is done using [ESLint](https://github.com/typescript-eslint/typescript-eslint/) and can be run using `yarn lint`.

## Deploying

Builds are manually deployed to production or staging using [Trebuchet](https://trebdocs.segment.com/).

<!---
The `master` and `staging` branches are auto deployed to production and staging respectively using [Trebuchet](https://trebdocs.segment.com/).
--->
