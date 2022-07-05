#!/bin/sh
set -e

echo '--- Build bundles'
make build-prod

echo '--- Check Size'
yarn workspace @segment/analytics-next size-limit

echo '--- Lint files'
make lint

echo '--- Run tests'
make test-unit
make test-integration
