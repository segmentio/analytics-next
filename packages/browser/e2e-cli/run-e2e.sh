#!/bin/bash
#
# Run E2E tests for analytics-next (Browser SDK)
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

echo "=== Building analytics-next (Browser) e2e-cli ==="

# Apply HTTP patch (needed for browser SDK to use http:// URLs)
cd "$SDK_ROOT"
if git apply --check "$E2E_DIR/patches/analytics-browser-http.patch" 2>/dev/null; then
    git apply "$E2E_DIR/patches/analytics-browser-http.patch"
    echo "HTTP patch applied"
else
    echo "HTTP patch already applied or not applicable (skipping)"
fi

# Install and build SDK monorepo
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
    --sdk-path "$SDK_ROOT" \
    "$@"
