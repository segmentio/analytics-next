#!/bin/bash

# Create github release(s) for every tag of the current commit. Use the github cli.

tags=$(git tag --points-at HEAD)

for tag in "${tags[@]}"; do
  gh release create "$tag"
done
