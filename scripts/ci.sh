#!/bin/sh
set -e

echo '--- Install development dependencies'
yarn install --frozen-lockfile

echo '--- Build bundles'
make build-prod

echo '--- Check Size'
yarn size-limit

echo '--- Lint files'
make lint

echo '--- Run tests'
yarn add --dev playwright
make test-unit
make test-integration
