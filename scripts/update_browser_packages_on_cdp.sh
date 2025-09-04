#!/bin/bash
set -e

# Load mise environment
eval "$(mise env --shell=bash)"
mise use node@14.21.3

# Save current directory
ORIGINAL_DIR=$(pwd)

# Move to project root (relative to script)
cd "$(dirname "$0")/.."

echo "📦 Installing dependencies..."
yarn install

echo "🏗️ Building project..."
yarn build

echo "📁 Moving to asset_util directory..."
cd ~/code/cdp/cmds/asset_util

echo "🚚 Copying UMD assets to edge API assets folder..."
go run main.go \
  --source ~/code/cdp-analytics-js/packages/browser/dist/umd \
  --destination ~/code/cdp/edge/api/endpoints/assets

echo "⚙️  Running mage manifest..."
cd ~/code/cdp

# Load mise environment for this directory (which should have mage)
eval "$(mise env --shell=bash)"

# Check if mage is now available
if ! command -v mage &> /dev/null; then
  echo "❌ 'mage' not found in PATH after loading mise environment."
  echo "   Make sure mage is installed in the cdp project with: mise install mage"
  exit 1
fi

mage manifest

cd "$ORIGINAL_DIR"
echo "✅ Done! Returned to $ORIGINAL_DIR"
