#!/bin/sh

echo '--- Install development dependencies'
yarn install
yarn add --dev playwright

echo '--- Build bundles'
NODE_ENV=production yarn build

echo '--- Check Size'
yarn size-limit

echo '--- Lint files'
yarn lint

echo '--- Run tests'
yarn test:coverage

echo '--- Run browser tests'
yarn test:browser
