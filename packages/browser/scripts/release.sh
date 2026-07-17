#!/bin/bash

set -e

# The Segment upload role is assumed by the caller (see .buildkite/pipeline.yml)
# before this script runs - unlike the old Segment-Buildkite setup, there's no
# SEGMENT_LIB_PATH/run-with-role wrapper to do it here, so these must already
# be set as plain env vars by the time we get here.
: "${AWS_ACCESS_KEY_ID:?"is a required environment variable - assume the Segment CDN upload role before calling this script"}"
: "${AWS_SECRET_ACCESS_KEY:?"is a required environment variable - assume the Segment CDN upload role before calling this script"}"
: "${AWS_SESSION_TOKEN:?"is a required environment variable - assume the Segment CDN upload role before calling this script"}"

node scripts/release.js
