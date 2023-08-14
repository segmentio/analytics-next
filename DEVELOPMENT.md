# Development

This project uses [Turborepo](https://turbo.build/repo/docs), for dependency-aware builds and linting. Please read up!

### Setup
```sh
 git clone git@github.com:segmentio/analytics-next.git && cd analytics-next
 nvm use  # install version of node defined in .nvmrc.
 yarn && yarn build
 yarn lint && yarn test
```



### Build a specific package and all dependencies
```
yarn run -T turbo run build --filter=<package or glob>
```

or 

```
yarn turbo run build --filter=<package OR glob>
```

