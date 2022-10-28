#!/bin/sh
PKG_VERSION=$(node --eval="process.stdout.write(require('./package.json').version)")

cat <<EOF >src/generated/version.ts
// This file is generated.
export const version = '$PKG_VERSION'
EOF

git add src/generated/version.ts
