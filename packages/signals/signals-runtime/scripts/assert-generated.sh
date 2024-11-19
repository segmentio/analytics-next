#!/bin/sh
# A CI script to ensure people remember to rebuild workerbox related files if workerbox changes

yarn build:global

# Check for changes in the workerbox directory
changed_files=$(git diff --name-only | grep 'generated')

# Check for changes in the workerbox directory
if [ -n "$changed_files" ]; then
  echo "Error: Changes detected. Please commit the changed files:"
  echo "$changed_files"
  exit 1
else
  echo "Files have not changed"
  exit 0
fi
