#!/bin/sh
# Delete all .tsbuildinfo files in packages.
# the .tsbuildinfo files can sometimes result in stale errors or missing errors
# e.g. https://github.com/microsoft/TypeScript/issues/49527

find . -iname "*.tsbuildinfo" ! -path "*/node_modules/*" -print0 | xargs -0 rm -rf

echo "Build files and cache deleted."
