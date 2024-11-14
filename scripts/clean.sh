#!/bin/sh
# Clear build artifacts and build cache

find . \( -name ".turbo" -o -name "dist" -o -name ".next" -o -name "tsconfig.tsbuildinfo" -o -name "coverage" \) ! -path "*/node_modules/*" -print0 | xargs -0 rm -rf
rm -rf node_modules/.cache

echo "Build files and cache deleted."
