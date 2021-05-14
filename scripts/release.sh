set -e

source "${SEGMENT_LIB_PATH}/aws.bash"

function main() {
    node scripts/release.js
}

run-with-role "arn:aws:iam::812113486725:role/ajs-private-assets-upload" main