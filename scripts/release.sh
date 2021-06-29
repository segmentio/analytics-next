set -e

source "${SEGMENT_LIB_PATH}/aws.bash"

function main() {
    node scripts/release.js
}

run-with-role ${AJS_PRIVATE_ASSETS_UPLOAD} main