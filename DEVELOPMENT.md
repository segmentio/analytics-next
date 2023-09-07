# Development

This project uses [Turborepo](https://turbo.build/repo/docs), for dependency-aware builds and linting. Please read up!

### Setup
```sh
 git clone git@github.com:segmentio/analytics-next.git && cd analytics-next
 nvm use  # install version of node defined in .nvmrc.
 yarn && yarn build
 yarn lint && yarn test
```

### 

### Build a specific package and all dependencies
You have a couple options:
1. you can _cd_ into a single package and run `yarn . build`  build a package and all its dependencies (most convenient!).

2. You can use turborepo directly to build a package and all dependencies. See: Turborepo https://turbo.build/repo/docs/core-concepts/monorepos/filtering#filter-syntax.

For example: 
```
yarn run -T turbo run build --filter=@segment/analytics-next
```
or
```
yarn run -T turbo run build --filter='./packages/node*'
```

^ Note, the following applies to not only `build`, but other tasks such as `test`, `lint`, etc.
