#!/bin/bash
# Changesets does not support yarn, so if the resolutions change, we want to commit them as part of the version pipeline.
echo "Checking if yarn.lock is up-to-date"
yarn install
if [[ -n $(git status --porcelain | grep yarn.lock) ]]; then
  echo "Adding yarn.lock..."
  git add yarn.lock
  # The yarn.lock will be auto-commited by the changeset github action
else
  echo "No yarn.lock updates needed"
fi
