#!/bin/bash

set -e

: "${AWS_ACCESS_KEY_ID:?"is a required environment variable"}"
: "${AWS_SECRET_ACCESS_KEY:?"is a required environment variable"}"
: "${AWS_SESSION_TOKEN:?"is a required environment variable"}"

node scripts/release.js
