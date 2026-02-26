#!/bin/bash
#
# Run E2E tests for analytics-next (Node.js SDK)
#
# Prerequisites: Node.js 18+, yarn
#
# Usage:
#   ./run-e2e.sh [extra args passed to run-tests.sh]
#
# Override sdk-e2e-tests location:
#   E2E_TESTS_DIR=../my-e2e-tests ./run-e2e.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SDK_ROOT="$SCRIPT_DIR/../../.."
E2E_DIR="${E2E_TESTS_DIR:-$SDK_ROOT/../sdk-e2e-tests}"

echo "=== Building analytics-next (Node) e2e-cli ==="

# Install and build SDK monorepo
cd "$SDK_ROOT"
yarn install
yarn build

# Build e2e-cli
cd "$SCRIPT_DIR"
npm install
npm run build

echo ""

# Run tests
cd "$E2E_DIR"
./scripts/run-tests.sh \
    --sdk-dir "$SCRIPT_DIR" \
    --cli "node $SCRIPT_DIR/dist/cli.js" \
    "$@"
