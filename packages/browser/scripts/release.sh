#!/bin/bash

set -e

: "${SEGMENT_LIB_PATH:?"is a required environment variable"}"
: "${AJS_PRIVATE_ASSETS_UPLOAD:?"is a required environment variable"}"

source "${SEGMENT_LIB_PATH}/aws.bash"

function main() {
    node scripts/release.js
}

run-with-role ${AJS_PRIVATE_ASSETS_UPLOAD} main
