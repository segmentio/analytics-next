#!/bin/sh
# Run this script on master when ready to publish node.

## Sometimes the latest version gets overwritten by changesets, lets ensure we are using the release uploaded to npm with the latest tag.
latest_version=$(npm show @customerio/cdp-analytics-node version)
echo "latest npm version: $latest_version"
tmp=$(mktemp)
jq ".version = \"$latest_version\"" package.json >"$tmp" && mv "$tmp" package.json

echo "bumping version..." &&
  npm version prerelease &&
  version=$(jq -r .version ./package.json) &&
  git add package.json &&
  git commit -m "Bump node version: $version." --no-verify

echo "modifying package.json..." &&
  # delete private field from package.json
  echo "$(jq 'del(.private)' package.json)" >package.json &&
  # add repository info to package.json
  yarn constraints --fix

echo "building and publishing..." &&
  yarn run -T clean &&
  yarn run -T node+deps build &&
  npm publish &&
  git push --no-verify

echo "cleaning up" &&
  git checkout .
