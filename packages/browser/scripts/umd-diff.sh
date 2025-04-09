#!/bin/bash

# This script is for detecting how the webpack build has changed.

# 1. yarn umd && cp dist/umd dist/umd.old 
# 2. make changes to your webpack config
# 3. `bash scripts/umd-diff.sh` to see changes

# Ensure the script stops on errors
set -e

# Define directories
DIST_DIR="./dist/umd"
TMP_DIR="./dist/umd.old"

# Run the UMD build
echo "Running 'yarn umd' to compile into $DIST_DIR..."
yarn umd

# Check if the temporary directory exists
if [ ! -d "$TMP_DIR" ]; then
  echo "Temporary directory $TMP_DIR does not exist. Exiting."
  exit 1
fi

# Compare the directories
echo "Comparing $DIST_DIR with $TMP_DIR..."
if command -v colordiff &> /dev/null; then
  # Use colordiff if available for a prettier diff
  diff -r "$DIST_DIR" "$TMP_DIR" | grep -E "^(Only in|diff|@@)" | colordiff
fi

rm 
# Print completion message
echo "Comparison complete."
