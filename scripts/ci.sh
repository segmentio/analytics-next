#!/bin/sh

echo '--- Install development dependencies'
yarn install
yarn add --dev playwright

echo '--- Build bundles'
make build-prod

echo '--- Check Size'
yarn size-limit

echo '--- Lint files'
make lint

echo '--- Run tests'
make test-unit
make test-integration
