#!/bin/sh
set -e

echo '--- Install development dependencies'
make node_modules

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
