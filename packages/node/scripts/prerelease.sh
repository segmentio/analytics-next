#!/bin/sh
# Run this script on master when ready to publish node.

echo "bumping version..." &&
  npm version prerelease &&
  git add package.json &&
  git commit -m "bump node version"

echo "modifying package.json..." &&
  # delete private field from package.json
  echo "$(jq 'del(.private)' package.json)" >package.json &&
  # add repository info to package.json
  yarn constraints --fix

echo "building and publishing..." &&
  yarn build &&
  npm publish &&
  git push

echo "cleaning up" &&
  git checkout .
