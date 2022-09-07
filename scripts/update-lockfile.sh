#!/bin/bash
# Changesets does not support yarn, so if the resolutions change, we want to commit them as part of the version pipeline.
echo "pwd: $(pwd)"
echo "Checking if yarn.lock is up-to-date"
YARN_ENABLE_IMMUTABLE_INSTALLS=false node .yarn/releases/yarn-3.2.1.cjs # https://github.com/changesets/action/issues/170
git add yarn.lock
git status --porcelain
