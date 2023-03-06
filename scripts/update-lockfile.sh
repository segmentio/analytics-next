#!/bin/bash
# # Changesets does not support yarn, so if the resolutions change, we want to commit them as part of the version pipeline.

echo "pwd: $(pwd)"
echo "Checking if yarn.lock is up-to-date"

yarn_path=$(grep "yarnPath:" .yarnrc.yml | awk 'NF>1{print $NF}')
YARN_ENABLE_IMMUTABLE_INSTALLS=false node "$yarn_path" # https://github.com/changesets/action/issues/170
git add yarn.lock
git status --porcelain

