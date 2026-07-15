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
if [ "$SKIP_NETWORK_TESTS" != "1" ]; then
  make test-integration
else
  echo 'SKIP_NETWORK_TESTS=1: skipping test-integration (e2e-tests/performance drives a real headless-Chromium lighthouse run, needs a downloaded Playwright browser + open egress)'
fi
