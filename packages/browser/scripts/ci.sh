#!/bin/sh
set -e

echo '--- Build bundles'
make build

echo '--- Check Size'
yarn run -T browser size-limit

echo '--- Lint files'
make lint

echo '--- Run tests'
make test-unit
make test-integration
