#!/bin/sh
# A CI script to ensure people remember to rebuild workerbox related files if workerbox changes

node scripts/build-workerbox.js
# Check for changes in the workerbox directory
changed_files=$(git diff --name-only | grep 'lib/workerbox')

# Check for changes in the workerbox directory
if [ -n "$changed_files" ]; then
  echo "Error: Changes detected in the workerbox directory. Please commit the changed files:"
  echo "$changed_files"
  exit 1
else
  echo "Files have not changed"
  exit 0
fi